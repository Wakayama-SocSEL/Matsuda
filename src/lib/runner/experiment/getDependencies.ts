import { dockerRun } from "./dockerRun";
import { DependenciesResult } from "./type";

export async function getDependencies(
  repoName: string,
  hash: string
): Promise<DependenciesResult> {
  const result = await dockerRun(`./getDependencies.sh ${repoName} ${hash}`);
  return JSON.parse(result);
}
