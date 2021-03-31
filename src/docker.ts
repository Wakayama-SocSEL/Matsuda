import * as git from "./git";
import { run } from "./utils";

function dockerRun(command: string): Promise<string> {
  return run(`docker run --rm kazuki-m/runner ${command}`);
}

export async function getRepoInfo(repoName: git.RepoName): Promise<string[][]> {
  const result = await dockerRun(`./getRepoInfo.sh ${repoName}`);
  return result
    .trim()
    .split("\n")
    .map((raw) => raw.split(" "));
}

export async function runTest(
  repoName: git.RepoName,
  hash: string
): Promise<string> {
  return dockerRun(`./runTest.sh ${repoName} ${hash}`);
}
