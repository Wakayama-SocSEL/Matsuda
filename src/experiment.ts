import * as runner from "./lib/runner";
import { ExperimentInput } from "./lib/runner/experiment/type";
import { readJson, createProgressBar, useArgv } from "./lib/utils";

async function main() {
  const argv = useArgv();
  const inputsAll = readJson<ExperimentInput[]>(
    "runner-experiment/inputs.json"
  );
  const inputs = argv.c != null ? inputsAll.slice(0, argv.c) : inputsAll;

  // 各リポジトリで並列実行
  const bar1 = createProgressBar("step1", {
    total: inputs.length,
  });
  const results = await runner.experiment.runTests(inputs, bar1, argv.p);
  runner.experiment.outputResult(results);
}

main().catch((err) => {
  console.log();
  console.error(err);
});
