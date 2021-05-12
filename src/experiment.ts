import {
  ExperiemntDataset,
  ExperimentInput,
  TestResult,
} from "./lib/runner/experiment/type";

import * as runner from "./lib/runner";
import { readJson, createProgressBar, useArgv } from "./lib/utils";

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
  const argv = useArgv();
  const inputsAll = readJson<ExperimentInput[]>(
    "runner-experiment/inputs.json"
  );
  const inputs = argv.c != null ? inputsAll.slice(0, argv.c) : inputsAll;
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
      argv.p
    );
    results.push(result);
  }

  runner.experiment.outputResult(results);
}

main().catch((err) => {
  console.log();
  console.error(err);
});
