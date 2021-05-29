import path from "path";
import * as runner from "./lib/runner";
import { TestCases } from "./lib/runner/proposal/extractTestCases";
import {
  readJson,
  createProgressBar,
  convertJsonToCSV,
  outputDir,
  safeWriteFileSync,
  parallelPromiseAll,
  useArgv,
} from "./lib/utils";

type Revision = {
  version: string;
  hash: string;
};

type Input = {
  nameWithOwner: string;
  breaking: Revision;
  prev: Revision;
};

type Result = Input & {
  tests: {
    prev: number;
    breaking: number;
  };
  change: number;
  insert: number;
  delete: number;
  unchanged: number;
  break: boolean;
};

function getResult(
  input: Input,
  prevTestCases: TestCases,
  breakingTestCases: TestCases
) {
  const result: Result = {
    ...input,
    tests: {
      prev: Object.keys(prevTestCases).length,
      breaking: Object.keys(breakingTestCases).length,
    },
    change: 0,
    insert: 0,
    delete: 0,
    unchanged: 0,
    break: false,
  };
  for (const [prevLabel, prevBody] of Object.entries(prevTestCases)) {
    if (prevLabel in breakingTestCases) {
      const key =
        prevBody == breakingTestCases[prevLabel] ? "unchanged" : "change";
      result[key] += 1;
    } else {
      result.delete += 1;
    }
  }
  for (const breakingLabel of Object.keys(breakingTestCases)) {
    if (!(breakingLabel in prevTestCases)) result.insert += 1;
  }
  result.break = result.change >= 1 || result.delete >= 1;
  return result;
}

async function main() {
  const inputs = readJson<Input[]>("runner-proposal/inputs.json");
  const argv = useArgv();

  const bar = createProgressBar("step1", {
    total: inputs.length,
  });
  const tasks = inputs.map((input) => {
    const task = async () => {
      const prevTestCases = await runner.proposal.extractTestCases(
        input.nameWithOwner,
        input.prev.hash
      );
      const breakingTestCases = await runner.proposal.extractTestCases(
        input.nameWithOwner,
        input.breaking.hash
      );
      const result = getResult(input, prevTestCases, breakingTestCases);
      bar.tick({
        label: `${input.nameWithOwner}@${input.prev.version}...${input.breaking.version}`,
      });
      return result;
    };
    return async () => {
      try {
        return await task();
      } catch (e) {
        bar.interrupt(
          `${input.nameWithOwner}@${input.prev.version}...${input.breaking.version}`
        );
        bar.interrupt(`${e}`);
        throw new Error();
      }
    };
  });

  const results: Result[] = await parallelPromiseAll<Result>(
    tasks,
    argv.p || 3
  );
  safeWriteFileSync(
    path.join(outputDir, "proposal_result.json"),
    JSON.stringify(results, null, 2)
  );
  safeWriteFileSync(
    path.join(outputDir, "proposal_result.csv"),
    convertJsonToCSV(results)
  );
}

main().catch((err) => {
  console.log();
  console.error(err);
});
