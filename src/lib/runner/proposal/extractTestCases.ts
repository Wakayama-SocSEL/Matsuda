import { run } from "../../utils";

function dockerRun(command: string): Promise<string> {
  return run(`docker run --rm kazuki-m/runner-proposal ${command}`);
}

export type TestCases = {
  [label: string]: string;
};

export async function extractTestCases(nameWithOwner: string, hash: string) {
  const result = await dockerRun(`yarn -s proposal ${nameWithOwner} ${hash}`);
  return JSON.parse(result) as TestCases;
}
