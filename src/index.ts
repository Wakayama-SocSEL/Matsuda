import fs from "fs";
import path from "path";
import * as git from "./git";
import { readJson, safeWriteFileSync } from "./utils";

const outputDir = path.join(process.cwd(), "output", `${+new Date()}`);

function getRepoInfoPath(repoName: git.RepoName) {
  return path.join(outputDir, repoName, "repoInfo.json");
}

async function outputRepoInfos(repos: git.RepoName[], concurrency: number) {
  const filteredRepos = repos.filter((repo) => {
    const filepath = getRepoInfoPath(repo);
    return !fs.existsSync(filepath);
  });
  const repoInfos = await git.getRepoInfos(filteredRepos, concurrency);
  for (const repoInfo of repoInfos) {
    const filepath = getRepoInfoPath(repoInfo.repoName);
    safeWriteFileSync(filepath, JSON.stringify(repoInfo, null, 2));
    console.log("output:", filepath);
  }
}

async function outputTest(repoInfo: git.RepoInfo, concurrency: number) {
  const filepath = path.join(outputDir, repoInfo.repoName, "testResults.json");
  const results = await git.runTests(repoInfo, concurrency);
  safeWriteFileSync(filepath, JSON.stringify(results, null, 2));
  console.log("output: ", filepath);
}

type Input = {
  repoNames: git.RepoName[];
};

function parseArgv(argv: string[]) {
  const [_, __, arg1, arg2] = argv;
  return {
    arg1: parseInt(arg1) || 5,
    arg2: parseInt(arg2) || 5,
  };
}

async function main() {
  const { repoNames } = readJson<Input>("runner/input.json");
  const { arg1, arg2 } = parseArgv(process.argv);
  // 各リポジトリで並列実行
  await outputRepoInfos(repoNames, arg1);
  for (const repoName of repoNames) {
    const repoInfo = readJson<git.RepoInfo>(getRepoInfoPath(repoName));
    //  各バージョンで並列実行
    await outputTest(repoInfo, arg2);
  }
}

main();
