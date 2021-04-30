import fs from "fs";
import path from "path";

import ProgressBar from "progress";
import { Octokit } from "@octokit/core";

import {
  RepoName,
  RepoInfo,
  RepoError,
  RepoResult,
  DatasetRepository,
  ApiResponses,
} from "./types";
import {
  run,
  sleep,
  parallelPromiseAll,
  safeWriteFileSync,
  outputDir,
  readJson,
  convertJsonToCSV,
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

function getOwnerAndRepo(repoResult: RepoResult) {
  const nameWithOwner: RepoName =
    Object.values(repoResult.apiResponses).length > 0
      ? Object.values(repoResult.apiResponses)[0].data.repository.full_name
      : repoResult.repo.nameWithOwner;
  const [owner, repo] = nameWithOwner.split("/");
  return { owner, repo };
}

export async function getRepoResult(
  repoInfo: RepoInfo,
  bar: ProgressBar
): Promise<RepoResult> {
  // repoStatus.jsonが取得済みであれば読み込んで返す
  const filepath = path.join(
    outputDir,
    repoInfo.repo.nameWithOwner,
    "repoResult.json"
  );
  if (fs.existsSync(filepath)) {
    const repoStatus = readJson<RepoResult>(filepath);
    const versionsCount = Object.keys(repoInfo.versions).length;
    bar.tick(versionsCount, { label: repoInfo.repo.nameWithOwner });
    return repoStatus;
  }
  const result: RepoResult = { repo: repoInfo.repo, apiResponses: {} };
  const octokit = new Octokit({ auth: process.env.GH_TOKEN });
  for (const [version, ref] of Object.entries(repoInfo.versions)) {
    const { owner, repo } = getOwnerAndRepo(result);
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/commits/{ref}/status",
      { owner, repo, ref }
    );
    result.apiResponses[version] = response;
    await sleep(0.5);
    bar.tick({
      label: `${repoInfo.repo.nameWithOwner}@${version}(${response.headers["x-ratelimit-used"]})`,
    });
  }
  safeWriteFileSync(filepath, JSON.stringify(result, null, 2));
  return result;
}

type Result = {
  [key: string]: any;
};

type State = "success" | "failure" | "pending";

function getStateCount(reponses: ApiResponses, state: State) {
  return Object.values(reponses).filter((status) => status.data.state == state)
    .length;
}

function createData(stateCounts: { [state in State]: number }, state: State) {
  const { success, failure, pending } = stateCounts;
  const run = success + failure;
  const total = run + pending;
  return {
    count: stateCounts[state],
    total: {
      rate: stateCounts[state] / total,
    },
    run: {
      rate: stateCounts[state] / run,
    },
  };
}

export async function outputResult(repoResults: RepoResult[]) {
  const results: Result[] = [];
  for (const repoResult of repoResults) {
    const { repo, apiResponses } = repoResult;
    const stateCounts = {
      success: getStateCount(apiResponses, "success"),
      failure: getStateCount(apiResponses, "failure"),
      pending: getStateCount(apiResponses, "pending"),
    };
    const result: Result = {
      repo,
      data: {
        success: createData(stateCounts, "success"),
        failure: createData(stateCounts, "failure"),
        pending: createData(stateCounts, "pending"),
      },
    };
    results.push(result);
  }
  safeWriteFileSync(
    path.join(outputDir, "analysis_result.json"),
    JSON.stringify(results, null, 2)
  );
  safeWriteFileSync(
    path.join(outputDir, "analysis_result.csv"),
    convertJsonToCSV(results)
  );
}
