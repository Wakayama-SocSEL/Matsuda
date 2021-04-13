import fs from "fs";
import path from "path";

import ProgressBar from "progress";
import { Octokit } from "@octokit/core";

import { RepoName, RepoInfo, RepoError, RepoStatus } from "./types";
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

export async function getRepoInfos(
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

export async function getRepoStatus(
  repoInfo: RepoInfo,
  bar: ProgressBar
): Promise<RepoStatus> {
  // repoStatus.jsonが取得済みであれば読み込んで返す
  const filepath = path.join(outputDir, repoInfo.repoName, "repoStatus.json");
  if (fs.existsSync(filepath)) {
    const repoStatus = readJson<RepoStatus>(filepath);
    const versionsCount = Object.keys(repoInfo.versions).length;
    bar.tick(versionsCount, { label: repoInfo.repoName });
    return repoStatus;
  }
  const results: RepoStatus = {};
  const octokit = new Octokit({ auth: process.env.GH_TOKEN });
  for (const [version, ref] of Object.entries(repoInfo.versions)) {
    const [owner, repo] = repoInfo.repoName.split("/");
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/commits/{ref}/status",
      { owner, repo, ref }
    );
    // リポジトリ名が変更されている場合は、レスポンスに含まれるリポジトリ名を2度目以降のリクエストで使う
    repoInfo.repoName = response.data.repository.full_name as RepoName;
    results[version] = response;
    await sleep(0.5);
    bar.tick({
      label: `${repoInfo.repoName}@${version}(${response.headers["x-ratelimit-used"]})`,
    });
  }
  safeWriteFileSync(filepath, JSON.stringify(results, null, 2));
  return results;
}

type Result = {
  [key: string]: any;
};

function getStateCount(repoStatus: RepoStatus, state: string) {
  return Object.values(repoStatus).filter(
    (status) => status.data.state == state
  ).length;
}

export async function outputResult(repoStatuses: RepoStatus[]) {
  const results: Result[] = [];
  for (const repoStatus of repoStatuses) {
    const successCount = getStateCount(repoStatus, "success");
    const failureCount = getStateCount(repoStatus, "failure");
    const pendingCount = getStateCount(repoStatus, "pending");
    const totalCount = Object.keys(repoStatus).length;
    const runCount = successCount + failureCount;
    const result: Result = {
      repoName: "",
      count: {
        total: totalCount,
        run: runCount,
      },
      rate: {
        total: {
          success: successCount / totalCount,
          failure: failureCount / totalCount,
          pending: pendingCount / totalCount,
        },
        run: {
          success: successCount / runCount,
          failure: failureCount / runCount,
        },
      },
      states: {
        success: 0,
        failure: 0,
        pending: 0,
      },
    };
    for (const status of Object.values(repoStatus)) {
      result.repoName = status.data.repository.full_name;
      result.states[status.data.state] += 1;
    }
    results.push(result);
  }
  const filepath = path.join(outputDir, "result.json");
  safeWriteFileSync(filepath, JSON.stringify(results, null, 2));
  await run(
    `yarn json2csv -i ./output/result.json -o ./output/result.csv --flatten-objects`
  );
}
