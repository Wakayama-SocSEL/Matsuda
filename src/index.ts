import fs from "fs";
import * as git from "./git";
import { readJson, safeWriteFileSync } from "./utils";

async function outputRepoInfos(repos: git.RepoName[]) {
  function getFilepath(repo: git.RepoName) {
    return `./output/${repo}/repoInfo.json`
  }
  const filteredRepos = repos.filter(repo => {
    const filepath = getFilepath(repo)
    return !fs.existsSync(filepath)
  })
  const versions = await git.getRepoInfos(filteredRepos);
  for (const version of versions) {
    const filepath = getFilepath(version.repo)
    safeWriteFileSync(filepath, JSON.stringify(version, null, 2));
    console.log("output:", filepath);
  }
}

async function outputTest(
  repoInfo: git.RepoInfo
) {
  const filepath = `./output/${repoInfo.repo}/testResults.json`
  const results = await git.runTests(repoInfo.repo, Object.values(repoInfo.versions));
  safeWriteFileSync(filepath, JSON.stringify(results, null, 2));
  console.log("output: ", filepath);
}

async function main() {
  const repoNames: git.RepoName[] = ["npm/node-semver"];
  // 各リポジトリで並列実行
  await outputRepoInfos(repoNames)
  for (const repoName of repoNames) {
    const repoInfo = readJson<git.RepoInfo>(`./output/${repoName}/repoInfo.json`)
    //  各バージョンで並列実行
    await outputTest(repoInfo)
  }
}

main();
