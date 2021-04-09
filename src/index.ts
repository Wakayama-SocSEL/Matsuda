import path from "path";

import ProgressBar, { ProgressBarOptions } from "progress";
import dotenv from "dotenv";
dotenv.config();

import * as runner from "./runner";
import { RepoName, RepoInfo } from "./types";
import { outputDir, readJson, safeWriteFileSync } from "./utils";

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

type Input = {
  repoNames: RepoName[];
};

function parseArgv(argv: string[]) {
  const [_, __, arg1] = argv;
  return {
    arg1: parseInt(arg1) || 5,
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
  const { arg1 } = parseArgv(process.argv);

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
    //  各バージョンで実行
    await runner.outputStatuses(repoInfo, bar2);
  }
}

main();
