import ProgressBar, { ProgressBarOptions } from "progress";
import dotenv from "dotenv";
dotenv.config();

import * as runner from "./runner";
import { RepoName, RepoInfo } from "./types";
import { readJson } from "./utils";

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
    `${label}\t[:bar] :label :current/:total(:percent) :etas`,
    {
      width: 20,
      ...options,
    }
  );
}

async function main() {
  const { repoNames } = readJson<Input>("runner/input.json");
  const { arg1 } = parseArgv(process.argv);

  // 各リポジトリで並列実行
  const bar1 = createProgressBar("outputRepoInfos", {
    total: repoNames.length,
  });
  const repoInfoResult = await runner.outputRepoInfos(repoNames, bar1, arg1);
  // RepoErrorを除去してRepoInfo[]にキャストする
  const repoInfos = repoInfoResult.filter(
    (info): info is RepoInfo => !("err" in info)
  );

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
