import { run } from "../../utils";

type PackageVersion = {
  version: string;
  hash: string;
};

export async function getPkgVersions(
  npm_pkg: string
): Promise<PackageVersion[]> {
  const versions = await run(
    `jq 'map(select(.repo_.npm_pkg==\\"${npm_pkg}\\").data_)' ./output/repository_versions.json`
  );
  return JSON.parse(versions);
}
