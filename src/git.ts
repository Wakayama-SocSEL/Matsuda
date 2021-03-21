import { run, parallelPromiseAll } from "./utils";

export type RepoName = `${string}/${string}`;

export type RepoInfo = {
  repo: RepoName;
  versions: {
    [name: string]: string;
  };
};

export async function getRepoInfos(repos: RepoName[]): Promise<RepoInfo[]> {
  const tasks = repos.map((repo) => {
    return async () => {
      const command = `docker run --rm runner ./getRepoInfo.sh https://github.com/${repo}.git`;
      const results = (await run(command))
        .split("\n")
        .map((raw) => raw.split(" "));
      const repoInfo: RepoInfo = { repo, versions: {} };
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
  ok: boolean;
  err?: string;
};

export async function runTests(
  repo: RepoName,
  hashs: string[]
): Promise<TestResult[]> {
  const tasks = hashs.map((hash) => {
    return async () => {
      try {
        const command = `docker run --rm runner ./runTest.sh https://github.com/${repo}.git ${hash}`;
        await run(command);
        return { ok: true };
      } catch (e) {
        return { ok: false, err: `${e}` };
      }
    };
  });
  return parallelPromiseAll<TestResult>(tasks, 5);
}
