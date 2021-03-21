import fs from "fs";
import * as git from "./git";
import { safeWriteFileSync } from "./utils";

type Json<T> = {
  [key: string]: T;
};

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

async function outputTestJson(
  filepath: string,
  url: string,
  commits: Json<string>
) {
  const results = await git.runTests(url, Object.values(commits));
  safeWriteFileSync(filepath, JSON.stringify(results, null, 2));
  console.log("output: ", filepath);
}

async function main() {
  const repoNames: git.RepoName[] = ["npm/node-semver"];
  await outputRepoInfos(repoNames)
}

main();
