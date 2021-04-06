import path from "path";
import ProgressBar, { ProgressBarOptions } from "progress";

import * as git from "./git";
import { readJson, safeWriteFileSync } from "./utils";

const outputDir = path.join(process.cwd(), "output", `${+new Date()}`);

function getRepoInfoPath(repoName: git.RepoName) {
  return path.join(outputDir, repoName, "repoInfo.json");
}

async function outputRepoInfos(
  repoNames: git.RepoName[],
  bar: ProgressBar,
  concurrency: number
) {
  const repoInfos = await git.getRepoInfos(repoNames, bar, concurrency);
  for (const repoInfo of repoInfos) {
    const filepath = getRepoInfoPath(repoInfo.repoName);
    safeWriteFileSync(filepath, JSON.stringify(repoInfo, null, 2));
  }
  // リポジトリがクローン出来なかったなどエラーが起きたものを除外
  return repoInfos.filter((info): info is git.RepoInfo => "versions" in info);
}

async function outputTest(
  repoInfo: git.RepoInfo,
  bar: ProgressBar,
  concurrency: number
) {
  const filepath = path.join(outputDir, repoInfo.repoName, "testResults.json");
  const results = await git.runTests(repoInfo, bar, concurrency);
  safeWriteFileSync(filepath, JSON.stringify(results, null, 2));
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

function createProgressBar(label: string, options: ProgressBarOptions) {
  return new ProgressBar(
    `${label} [:bar] :current/:total(:percent) :etas`,
    options
  );
}

async function main() {
  const { repoNames } = readJson<Input>("runner/input.json");
  const { arg1, arg2 } = parseArgv(process.argv);

  // 各リポジトリで並列実行
  const bar1 = createProgressBar("outputRepoInfos", {
    total: repoNames.length,
  });
  const repoInfos = await outputRepoInfos(repoNames, bar1, arg1);

  const totalVersions = repoInfos
    .map((info) => Object.keys(info.versions).length)
    .reduce((prev, curr) => prev + curr, 0);
  const bar2 = createProgressBar("outputTests", {
    total: totalVersions,
  });
  for (const repoInfo of repoInfos) {
    //  各バージョンで並列実行
    await outputTest(repoInfo, bar2, arg2);
  }
}

main();
