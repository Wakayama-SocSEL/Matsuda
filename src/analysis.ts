import dotenv from "dotenv";
dotenv.config();

import * as runner from "./lib/runner";
import {
  RepoInfo,
  DatasetRepository,
  RepoResult,
} from "./lib/runner/analysis/types";
import { createProgressBar, readJson, useArgv } from "./lib/utils";

function getTotalVersions(repoInfos: RepoInfo[]) {
  return repoInfos
    .map((info) => Object.keys(info.versions).length)
    .reduce((prev, curr) => prev + curr, 0);
}

async function main() {
  const argv = useArgv();
  const inputs = readJson<DatasetRepository[]>("runner-analysis/inputs.json");
  const repositories = argv.c != null ? inputs.slice(0, argv.c) : inputs;

  // 各リポジトリで並列実行
  const bar1 = createProgressBar("step1", {
    total: repositories.length,
  });
  const repoInfoResult = await runner.analysis.getRepoInfos(
    repositories,
    bar1,
    argv.p
  );
  // RepoErrorを除去してRepoInfo[]にキャストする
  const repoInfos = repoInfoResult.filter(
    (info): info is RepoInfo => !("err" in info)
  );
  runner.analysis.outputVersions(repoInfos);

  const bar2 = createProgressBar("step2", {
    total: getTotalVersions(repoInfos),
  });
  const results: RepoResult[] = [];
  for (const repoInfo of repoInfos) {
    //  各バージョンで実行
    const result = await runner.analysis.getRepoResult(repoInfo, bar2);
    results.push(result);
  }

  console.log("step3 creating result files");
  runner.analysis.outputResult(results);
}

main().catch((err) => {
  console.log();
  console.error(err);
});
