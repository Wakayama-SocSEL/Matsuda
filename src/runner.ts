import ProgressBar from "progress";

import { RepoName, RepoInfo, RepoError } from "./types";
import { run, parallelPromiseAll } from "./utils";

function dockerRun(command: string): Promise<string> {
  return run(`docker run --rm kazuki-m/runner ${command}`);
}

async function getRepoInfo(repoName: RepoName): Promise<string[][]> {
  const result = await dockerRun(`./getRepoInfo.sh ${repoName}`);
  return result
    .trim()
    .split("\n")
    .map((raw) => raw.split(" "));
}

export type GetRepoInfoResult = RepoInfo | RepoError;

export async function getRepoInfos(
  repoNames: RepoName[],
  bar: ProgressBar,
  concurrency: number
): Promise<GetRepoInfoResult[]> {
  const tasks = repoNames.map((repoName) => {
    return async () => {
      try {
        const results = await getRepoInfo(repoName);
        const repoInfo: RepoInfo = { repoName, versions: {} };
        for (const [name, hash] of results) {
          if (!(name in repoInfo.versions)) {
            repoInfo.versions[name] = hash;
          }
        }
        return repoInfo;
      } catch (err) {
        return { repoName, err };
      }
    };
  });
  return parallelPromiseAll<GetRepoInfoResult>(tasks, bar, concurrency);
}

async function runTest(repoName: RepoName, hash: string): Promise<string> {
  return dockerRun(`./runTest.sh ${repoName} ${hash}`);
}

export type RunTestResult = {
  version: string;
  ok: boolean;
  err?: string;
};

export async function runTests(
  repoInfo: RepoInfo,
  bar: ProgressBar,
  concurrency: number
): Promise<RunTestResult[]> {
  const tasks = Object.entries(repoInfo.versions).map(([version, hash]) => {
    return async () => {
      try {
        await runTest(repoInfo.repoName, hash);
        return { version, ok: true };
      } catch (e) {
        return { version, ok: false, err: `${e}` };
      }
    };
  });
  return parallelPromiseAll<RunTestResult>(tasks, bar, concurrency);
}
