import {
  ExperiemntDataset,
  ExperimentInput,
  TestResult,
} from "./lib/runner/experiment/type";

import * as runner from "./lib/runner";
import { readJson, createProgressBar } from "./lib/utils";

function parseArgv(argv: string[]) {
  const [_, __, arg1, arg2] = argv;
  return {
    arg1: parseInt(arg1) || 5,
    arg2: parseInt(arg2) || 5,
  };
}

function groupByLNameWithOwner(inputs: ExperimentInput[]) {
  return inputs.reduce<ExperiemntDataset>((result, item) => {
    if (item.L__nameWithOwner in result) {
      result[item.L__nameWithOwner].push(item);
    } else {
      result[item.L__nameWithOwner] = [item];
    }
    return result;
  }, {});
}

async function main() {
  const { arg1, arg2 } = parseArgv(process.argv);
  const inputs = readJson<ExperimentInput[]>(
    "runner-experiment/inputs.json"
  ).slice(0, arg1);
  const dataset = groupByLNameWithOwner(inputs);

  // 各リポジトリで並列実行
  const bar1 = createProgressBar("step1", {
    total: inputs.length,
  });
  const results: TestResult[][][] = [];
  for (const [L__nameWithOwner, inputs] of Object.entries(dataset)) {
    const result = await runner.experiment.runTests(
      L__nameWithOwner,
      inputs,
      bar1,
      arg2
    );
    results.push(result);
  }

  runner.experiment.outputResult(results);
}

main();
