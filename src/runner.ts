import fs from "fs";
import path from "path";

import ProgressBar from "progress";
import { Octokit } from "@octokit/core";

import { RepoName, RepoInfo, RepoError } from "./types";
import {
  run,
  sleep,
  parallelPromiseAll,
  safeWriteFileSync,
  outputDir,
  readJson,
} from "./utils";

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

export async function outputRepoInfos(
  repoNames: RepoName[],
  bar: ProgressBar,
  concurrency: number
): Promise<GetRepoInfoResult[]> {
  const tasks = repoNames.map((repoName) => {
    const task = async () => {
      // repoInfo.jsonが取得済みであれば読み込んで返す
      const filepath = path.join(outputDir, repoName, "repoInfo.json");
      if (fs.existsSync(filepath)) {
        return readJson<RepoInfo | RepoError>(filepath);
      }
      try {
        const results = await getRepoInfo(repoName);
        const repoInfo: RepoInfo = { repoName, versions: {} };
        for (const [name, hash] of results) {
          if (!(name in repoInfo.versions)) {
            repoInfo.versions[name] = hash;
          }
        }
        safeWriteFileSync(filepath, JSON.stringify(repoInfo, null, 2));
        return repoInfo;
      } catch (err) {
        const repoError: RepoError = { repoName, err };
        safeWriteFileSync(filepath, JSON.stringify(repoError, null, 2));
        return repoError;
      }
    };
    return async () => {
      const result = await task();
      bar.tick({ label: repoName });
      return result;
    };
  });
  return parallelPromiseAll<GetRepoInfoResult>(tasks, concurrency);
}

export async function outputStatuses(
  repoInfo: RepoInfo,
  bar: ProgressBar
): Promise<void> {
  const results: { [version: string]: any } = {};
  const octokit = new Octokit({ auth: process.env.GH_TOKEN });
  for (const [version, ref] of Object.entries(repoInfo.versions)) {
    const [owner, repo] = repoInfo.repoName.split("/");
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/commits/{ref}/status",
      { owner, repo, ref }
    );
    results[version] = response;
    await sleep(0.5);
    bar.tick({ label: `${repoInfo.repoName}@${version}` });
  }
  const filepath = path.join(outputDir, repoInfo.repoName, "repoStatus.json");
  safeWriteFileSync(filepath, JSON.stringify(results, null, 2));
}
