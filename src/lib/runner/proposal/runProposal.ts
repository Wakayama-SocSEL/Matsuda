import fs from "fs";
import path from "path";

import {
  outputDir,
  parallelPromiseAll,
  readJson,
  run,
  safeWriteFileSync,
} from "../../utils";
import { ProposalInput, ProposalResult, ProposalResultItem } from "./type";

function dockerRun(command: string): Promise<string> {
  return run(`docker run --rm --cpus 1 kazuki-m/runner-proposal ${command}`);
}

async function runProposal(nameWithOwner: string, hash: string) {
  const result = await dockerRun(`yarn -s proposal ${nameWithOwner} ${hash}`);
  try {
    return JSON.parse(result) as ProposalResultItem;
  } catch (e) {
    throw new Error(result);
  }
}

export async function runProposals(
  inputs: ProposalInput[],
  bar: ProgressBar,
  concurrency: number
): Promise<ProposalResult[]> {
  const tasks = inputs.map((input) => {
    const task = async () => {
      const filepath = path.join(
        outputDir,
        ".cache-proposal",
        input.nameWithOwner,
        `${input.updated.version}.json`
      );
      // キャッシュがあればカバレッジ計測は実行しない
      if (fs.existsSync(filepath)) {
        return readJson<ProposalResult>(filepath);
      }

      const prev = await runProposal(
        //
        input.nameWithOwner,
        input.prev.hash
      );
      const updated = await runProposal(
        input.nameWithOwner,
        input.updated.hash
      );
      const result = { input, result: { prev, updated } };
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
  return parallelPromiseAll<ProposalResult>(tasks, concurrency);
}
