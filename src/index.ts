import dotenv from "dotenv";
dotenv.config();

import * as runner from "./lib/runner";
import { RepoName, RepoInfo, RepoStatus } from "./lib/types";
import { createProgressBar, readJson } from "./lib/utils";

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

function getTotalVersions(repoInfos: RepoInfo[]) {
  return repoInfos
    .map((info) => Object.keys(info.versions).length)
    .reduce((prev, curr) => prev + curr, 0);
}

async function main() {
  const { arg1, arg2 } = parseArgv(process.argv);
  const input = readJson<Input>("runner/input.json");
  const repoNames = input.repoNames.slice(0, arg1);

  // 各リポジトリで並列実行
  const bar1 = createProgressBar("step1", {
    total: repoNames.length,
  });
  const repoInfoResult = await runner.getRepoInfos(repoNames, bar1, arg2);
  // RepoErrorを除去してRepoInfo[]にキャストする
  const repoInfos = repoInfoResult.filter(
    (info): info is RepoInfo => !("err" in info)
  );

  const bar2 = createProgressBar("step2", {
    total: getTotalVersions(repoInfos),
  });
  const statuses: RepoStatus[] = [];
  for (const repoInfo of repoInfos) {
    //  各バージョンで実行
    const status = await runner.getRepoStatus(repoInfo, bar2);
    statuses.push(status);
  }

  console.log("step3 creating output.json");
  await runner.outputResult(statuses);
}

main();
