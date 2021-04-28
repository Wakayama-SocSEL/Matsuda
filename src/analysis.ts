import dotenv from "dotenv";
dotenv.config();

import * as runner from "./lib/runner";
import { RepoInfo, DatasetRepository, RepoResult } from "./lib/types";
import { createProgressBar, readJson } from "./lib/utils";

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
  const inputs = readJson<DatasetRepository[]>("runner/inputs.json");
  const repositories = inputs.slice(0, arg1);

  // 各リポジトリで並列実行
  const bar1 = createProgressBar("step1", {
    total: repositories.length,
  });
  const repoInfoResult = await runner.getRepoInfos(repositories, bar1, arg2);
  // RepoErrorを除去してRepoInfo[]にキャストする
  const repoInfos = repoInfoResult.filter(
    (info): info is RepoInfo => !("err" in info)
  );

  const bar2 = createProgressBar("step2", {
    total: getTotalVersions(repoInfos),
  });
  const results: RepoResult[] = [];
  for (const repoInfo of repoInfos) {
    //  各バージョンで実行
    const result = await runner.getRepoResult(repoInfo, bar2);
    results.push(result);
  }

  console.log("step3 creating output.json");
  await runner.outputResult(results);
}

main();
