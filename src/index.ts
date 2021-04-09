import path from "path";
import ProgressBar, { ProgressBarOptions } from "progress";

import * as runner from "./runner";
import { RepoName, RepoInfo } from "./types";
import { readJson, safeWriteFileSync } from "./utils";

const outputDir = path.join(process.cwd(), "output", `${+new Date()}`);

function getRepoInfoPath(repoName: RepoName) {
  return path.join(outputDir, repoName, "repoInfo.json");
}

async function outputRepoInfos(
  repoNames: RepoName[],
  bar: ProgressBar,
  concurrency: number
) {
  const repoInfos = await runner.getRepoInfos(repoNames, bar, concurrency);
  for (const repoInfo of repoInfos) {
    const filepath = getRepoInfoPath(repoInfo.repoName);
    safeWriteFileSync(filepath, JSON.stringify(repoInfo, null, 2));
  }
  // リポジトリがクローン出来なかったなどエラーが起きたものを除外
  return repoInfos.filter((info): info is RepoInfo => "versions" in info);
}

async function outputTest(
  repoInfo: RepoInfo,
  bar: ProgressBar,
  concurrency: number
) {
  const filepath = path.join(outputDir, repoInfo.repoName, "testResults.json");
  const results = await runner.runTests(repoInfo, bar, concurrency);
  safeWriteFileSync(filepath, JSON.stringify(results, null, 2));
}

type Input = {
  repoNames: RepoName[];
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
