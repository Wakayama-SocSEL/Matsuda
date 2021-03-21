import fs from "fs";
import * as git from "./git";
import { readJson, safeWriteFileSync } from "./utils";

function getRepoInfoPath(repo: git.RepoName) {
  return `./output/${repo}/repoInfo.json`;
}

async function outputRepoInfos(repos: git.RepoName[]) {
  const filteredRepos = repos.filter((repo) => {
    const filepath = getRepoInfoPath(repo);
    return !fs.existsSync(filepath);
  });
  const versions = await git.getRepoInfos(filteredRepos);
  for (const version of versions) {
    const filepath = getRepoInfoPath(version.repo);
    safeWriteFileSync(filepath, JSON.stringify(version, null, 2));
    console.log("output:", filepath);
  }
}

async function outputTest(repoInfo: git.RepoInfo) {
  const filepath = `./output/${repoInfo.repo}/testResults.json`;
  const results = await git.runTests(
    repoInfo.repo,
    Object.values(repoInfo.versions)
  );
  safeWriteFileSync(filepath, JSON.stringify(results, null, 2));
  console.log("output: ", filepath);
}

async function main() {
  const repoNames: git.RepoName[] = ["npm/node-semver"];
  // 各リポジトリで並列実行
  await outputRepoInfos(repoNames);
  for (const repoName of repoNames) {
    const repoInfo = readJson<git.RepoInfo>(getRepoInfoPath(repoName));
    //  各バージョンで並列実行
    await outputTest(repoInfo);
  }
}

main();
