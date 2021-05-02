import path from "path";
import fs from "fs";

import { Octokit } from "@octokit/core";

import { RepoResult, RepoName, RepoInfo } from "../../types";
import { outputDir, readJson, sleep, safeWriteFileSync } from "../../utils";

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
