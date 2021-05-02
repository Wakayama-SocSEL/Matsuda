import fs from "fs";
import path from "path";

import { dockerRun } from "./dockerRun";
import { RepoName, RepoInfo, RepoError, DatasetRepository } from "./types";
import {
  outputDir,
  readJson,
  safeWriteFileSync,
  parallelPromiseAll,
} from "../../utils";

async function getRepoInfo(repoName: RepoName): Promise<string[][]> {
  const result = await dockerRun(`./getRepoInfo.sh ${repoName}`);
  return result
    .trim()
    .split("\n")
    .map((raw) => raw.split(" "));
}

export type GetRepoInfoResult = RepoInfo | RepoError;

export async function getRepoInfos(
  repos: DatasetRepository[],
  bar: ProgressBar,
  concurrency: number
): Promise<GetRepoInfoResult[]> {
  const tasks = repos.map((repo) => {
    const task = async () => {
      // repoInfo.jsonが取得済みであれば読み込んで返す
      const filepath = path.join(
        outputDir,
        repo.nameWithOwner,
        "repoInfo.json"
      );
      if (fs.existsSync(filepath)) {
        return readJson<RepoInfo | RepoError>(filepath);
      }
      try {
        const results = await getRepoInfo(repo.nameWithOwner);
        const repoInfo: RepoInfo = { repo, versions: {} };
        for (const [name, hash] of results) {
          if (!(name in repoInfo.versions)) {
            repoInfo.versions[name] = hash;
          }
        }
        safeWriteFileSync(filepath, JSON.stringify(repoInfo, null, 2));
        return repoInfo;
      } catch (err) {
        const repoError: RepoError = { repo, err };
        safeWriteFileSync(filepath, JSON.stringify(repoError, null, 2));
        return repoError;
      }
    };
    return async () => {
      const result = await task();
      bar.tick({ label: repo.nameWithOwner });
      return result;
    };
  });
  return parallelPromiseAll<GetRepoInfoResult>(tasks, concurrency);
}
