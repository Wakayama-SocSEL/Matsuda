import { run } from "../../utils";

function dockerRun(command: string): Promise<string> {
  return run(`docker run --rm kazuki-m/runner-proposal ${command}`);
}

export type ProposalResult = {
  coverage: any;
  testCases: {
    [label: string]: string;
  };
};

export async function runProposal(nameWithOwner: string, hash: string) {
  const result = await dockerRun(`yarn -s proposal ${nameWithOwner} ${hash}`);
  try {
    return JSON.parse(result) as ProposalResult;
  } catch (e) {
    throw new Error(result);
  }
}
