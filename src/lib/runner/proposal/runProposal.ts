import { run } from "../../utils";

function dockerRun(command: string): Promise<string> {
  return run(`docker run --rm --cpus 1 kazuki-m/runner-proposal ${command}`);
}

export type ProposalResult = {
  coverage: any;
  testCases: {
    [label: string]: string;
  };
  otherCodes: {
    [path: string]: string;
  };
  errors: {
    [path: string]: boolean;
  };
};

export async function runProposal(
  nameWithOwner: string,
  hash: string,
  skipCoverage: boolean
) {
  const result = await dockerRun(
    `yarn -s proposal ${nameWithOwner} ${hash}` + (skipCoverage ? " true" : "")
  );
  try {
    return JSON.parse(result) as ProposalResult;
  } catch (e) {
    throw new Error(result);
  }
}
