import ProgressBar, { ProgressBarOptions } from "progress";
import dotenv from "dotenv";
dotenv.config();

import * as runner from "./runner";
import { RepoName, RepoInfo, RepoStatus } from "./types";
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
  const bar = new ProgressBar(
    `${label} [:bar] :label :current/:total(:percent) :etas`,
    {
      width: 20,
      ...options,
    }
  );
  bar.tick(0, { label: "starting..." });
  return bar;
}

function getTotalVersions(repoInfos: RepoInfo[]) {
  return repoInfos
    .map((info) => Object.keys(info.versions).length)
    .reduce((prev, curr) => prev + curr, 0);
}

async function main() {
  const { repoNames } = readJson<Input>("runner/input.json");
  const { arg1 } = parseArgv(process.argv);

  // 各リポジトリで並列実行
  const bar1 = createProgressBar("step1", {
    total: repoNames.length,
  });
  const repoInfoResult = await runner.getRepoInfos(repoNames, bar1, arg1);
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
}

main();
