import fs from "fs";
import path from "path";

import * as runner from "./lib/runner";
import { ProposalInput } from "./lib/runner/proposal/type";
import {
  readJson,
  createProgressBar,
  convertJsonToCSV,
  outputDir,
  safeWriteFileSync,
  useArgv,
} from "./lib/utils";

async function main() {
  const argv = useArgv();
  const inputsAll = readJson<ProposalInput[]>("runner-proposal/inputs.json");
  const inputs = argv.c != null ? inputsAll.slice(0, argv.c) : inputsAll;

  const bar = createProgressBar("step1", {
    total: inputs.length,
  });
  const results = await runner.proposal.runProposals(inputs, bar, argv.p);
  runner.proposal.outputProposal(results);
}

main().catch((err) => {
  console.log();
  console.error(err);
});
