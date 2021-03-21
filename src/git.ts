import { run, parallelPromiseAll } from "./utils";

export type Package = {
  version: string;
};

export type Commit = {
  hash: string;
  pkg: Package | null;
};

export async function clone(url: string, dir: string): Promise<void> {
  await run(`git clone ${url} ${dir}`);
}

export async function reset(dir: string): Promise<void> {
  await run(`git reset origin/master --hard`, dir);
}

export async function getHashs(dir: string): Promise<string[]> {
  // pkg_commits.csv内のコミットに置き換え可能？
  const command = `git log --reverse --date-order --pretty="%H"`;
  const gitLogResult = await run(command, dir);
  return gitLogResult.trim().split("\n");
}

export async function getPackage(
  hash: string,
  dir: string
): Promise<Package | null> {
  try {
    const pkg = await run(`git show ${hash}:package.json`, dir);
    return JSON.parse(pkg) as Package;
  } catch (e) {
    return null;
  }
}

export type RepoName = `${string}/${string}`

export type RepoInfo = {
  repo: `${string}/${string}`
  versions: {
    [name: string]: string;
  }
};

export async function getRepoInfos(repos: RepoName[]): Promise<RepoInfo[]> {
  const tasks = repos.map((repo) => {
    return async () => {
      const results = (
        await run(`docker run --rm runner ./getRepoInfo.sh https://github.com/${repo}.git`)
      )
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

export async function runTests(url: string, hashs: string[]): Promise<TestResult[]> {
  const tasks = hashs.map(hash => {
    return async () => {
      try {
        await run(`docker run --rm runner ${url} ${hash}`);
        return { url, hash, ok: true };
      } catch (e) {
        return { url, hash, ok: false, err: `${e}` };
      }
    }
  })
  return parallelPromiseAll<TestResult>(tasks, 5)
}
