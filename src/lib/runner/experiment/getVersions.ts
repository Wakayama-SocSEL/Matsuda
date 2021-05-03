import { RepoName } from "../analysis/types";
import { dockerRun } from "./dockerRun";

type VersionsResult = {
  [pkgName: string]: string;
};

export async function getVersions(
  repoName: RepoName,
  hash: string
): Promise<VersionsResult> {
  const result = await dockerRun(`./getVersions.sh ${repoName} ${hash}`);
  return JSON.parse(result);
}
