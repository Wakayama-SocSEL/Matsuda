import { run } from "../../utils";

export async function getPkgVersions(npm_pkg: string): Promise<string[]> {
  const versions = await run(`npm view ${npm_pkg} versions --json`);
  return JSON.parse(versions);
}
