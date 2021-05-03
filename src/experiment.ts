import { ExperimentInput } from "./lib/runner/experiment/type";

import * as runner from "./lib/runner";
import { readJson, createProgressBar } from "./lib/utils";

function parseArgv(argv: string[]) {
  const [_, __, arg1, arg2] = argv;
  return {
    arg1: parseInt(arg1) || 5,
    arg2: parseInt(arg2) || 5,
  };
}

async function main() {
  const { arg1, arg2 } = parseArgv(process.argv);
  const inputs = readJson<ExperimentInput[]>(
    "runner-experiment/inputs.json"
  ).slice(0, arg1);

  // 各リポジトリで並列実行
  const bar1 = createProgressBar("step1", {
    total: inputs.length,
  });
  for (const input of inputs) {
    runner.experiment.runTests(input, bar1, arg2);
    bar1.tick({
      label: `${input.L__nameWithOwner} & ${input.S__npm_pkg} Done.`,
    });
  }
}

main();
