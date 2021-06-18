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
  npm_pkg: string;
  state: string;
  stats: {
    failure: number;
    success: number;
  };
  updated: Revision;
  prev: Revision;
};

type Result = Input & {
  prev: Revision & {
    tests: number;
    coverage: any;
  };
  updated: Revision & {
    tests: number;
    coverage: any;
  };
  testCases: {
    change: number;
    insert: number;
    delete: number;
    unchanged: number;
  };
  isBreaking: boolean;
};

function getResult(
  input: Input,
  prevProposal: ProposalResult,
  updatedProposal: ProposalResult
) {
  const result: Result = {
    ...input,
    prev: {
      ...input.prev,
      coverage: prevProposal.coverage,
      tests: Object.keys(prevProposal.testCases).length,
    },
    updated: {
      ...input.updated,
      coverage: updatedProposal.coverage,
      tests: Object.keys(updatedProposal.testCases).length,
    },
    testCases: {
      change: 0,
      insert: 0,
      delete: 0,
      unchanged: 0,
    },
    isBreaking: false,
  };
  for (const [prevLabel, prevBody] of Object.entries(prevProposal.testCases)) {
    if (prevLabel in updatedProposal.testCases) {
      const key =
        prevBody == updatedProposal.testCases[prevLabel]
          ? "unchanged"
          : "change";
      result.testCases[key] += 1;
    } else {
      result.testCases.delete += 1;
    }
  }
  for (const breakingLabel of Object.keys(updatedProposal.testCases)) {
    if (!(breakingLabel in prevProposal.testCases)) {
      result.testCases.insert += 1;
    }
  }
  result.isBreaking =
    result.testCases.change >= 1 || result.testCases.delete >= 1;
  return result;
}

async function main() {
  const argv = useArgv();
  const inputsAll = readJson<Input[]>("runner-proposal/inputs.json");
  const inputs = argv.c != null ? inputsAll.slice(0, argv.c) : inputsAll;

  const bar = createProgressBar("step1", {
    total: inputs.length,
  });
  const tasks = inputs.map((input) => {
    const task = async () => {
      const filepath = path.join(
        outputDir,
        ".cache-proposal",
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
      const updatedTestCases = await runner.proposal.runProposal(
        input.nameWithOwner,
        input.updated.hash
      );
      const result = getResult(input, prevTestCases, updatedTestCases);
      safeWriteFileSync(filepath, JSON.stringify(result, null, 2));
      return result;
    };
    return async () => {
      try {
        const result = await task();
        bar.tick({
          label: `${input.nameWithOwner}@${input.prev.version}...${input.updated.version}`,
        });
        return result;
      } catch (e) {
        bar.interrupt(
          `${input.nameWithOwner}@${input.prev.version}...${input.updated.version}`
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
