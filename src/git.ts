import { run, parallelPromiseAll } from "./utils";

export type RepoName = `${string}/${string}`;

export type RepoInfo = {
  repoName: RepoName;
  versions: {
    [name: string]: string;
  };
};

export async function getRepoInfos(repoNames: RepoName[]): Promise<RepoInfo[]> {
  const tasks = repoNames.map((repoName) => {
    return async () => {
      const command = `docker run --rm runner ./getRepoInfo.sh ${repoName}`;
      const results = (await run(command))
        .split("\n")
        .map((raw) => raw.split(" "));
      const repoInfo: RepoInfo = { repoName, versions: {} };
      for (const [name, hash] of results) {
        if (!(name in repoInfo.versions)) {
          repoInfo.versions[name] = hash;
        }
      }
      return repoInfo;
    };
  });
  return parallelPromiseAll<RepoInfo>(tasks, 5);
}

export type TestResult = {
  version: string;
  ok: boolean;
  err?: string;
};

export async function runTests(repoInfo: RepoInfo): Promise<TestResult[]> {
  const tasks = Object.entries(repoInfo.versions).map(([version, hash]) => {
    return async () => {
      try {
        const command = `docker run --rm runner ./runTest.sh ${repoInfo.repoName} ${hash}`;
        await run(command);
        return { version, ok: true };
      } catch (e) {
        return { version, ok: false, err: `${e}` };
      }
    };
  });
  return parallelPromiseAll<TestResult>(tasks, 5);
}
