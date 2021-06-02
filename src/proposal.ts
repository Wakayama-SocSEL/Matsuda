import fs from "fs";
import path from "path";

import * as runner from "./lib/runner";
import { ProposalResult } from "./lib/runner/proposal/runProposal";
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

type Result = {
  nameWithOwner: string;
  prev: Revision & {
    tests: number;
    coverage: any;
  };
  breaking: Revision & {
    tests: number;
    coverage: any;
  };
  change: number;
  insert: number;
  delete: number;
  unchanged: number;
  break: boolean;
};

function getResult(
  input: Input,
  prevProposal: ProposalResult,
  breakingProposal: ProposalResult
) {
  const result: Result = {
    nameWithOwner: input.nameWithOwner,
    prev: {
      ...input.prev,
      coverage: prevProposal.coverage,
      tests: Object.keys(prevProposal.testCases).length,
    },
    breaking: {
      ...input.breaking,
      coverage: breakingProposal.coverage,
      tests: Object.keys(breakingProposal.testCases).length,
    },
    change: 0,
    insert: 0,
    delete: 0,
    unchanged: 0,
    break: false,
  };
  for (const [prevLabel, prevBody] of Object.entries(prevProposal.testCases)) {
    if (prevLabel in breakingProposal) {
      const key =
        prevBody == breakingProposal.testCases[prevLabel]
          ? "unchanged"
          : "change";
      result[key] += 1;
    } else {
      result.delete += 1;
    }
  }
  for (const breakingLabel of Object.keys(breakingProposal.testCases)) {
    if (!(breakingLabel in prevProposal)) result.insert += 1;
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
      const filepath = path.join(
        outputDir,
        input.nameWithOwner,
        "proposalResult.json"
      );
      if (fs.existsSync(filepath)) {
        return readJson<Result>(filepath);
      }
      const prevTestCases = await runner.proposal.runProposal(
        input.nameWithOwner,
        input.prev.hash
      );
      const breakingTestCases = await runner.proposal.runProposal(
        input.nameWithOwner,
        input.breaking.hash
      );
      const result = getResult(input, prevTestCases, breakingTestCases);
      safeWriteFileSync(filepath, JSON.stringify(result, null, 2));
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
