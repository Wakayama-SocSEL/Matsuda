import path from "path";
import { safeWriteFileSync, outputDir, convertJsonToCSV } from "../../utils";
import { RepoInfo } from "./types";

type Result = {
  [key: string]: any;
};

export function outputVersions(repoInfos: RepoInfo[]) {
  const results: Result[] = [];
  for (const repoInfo of repoInfos) {
    for (const [version, hash] of Object.entries(repoInfo.versions)) {
      results.push({
        repo_: repoInfo.repo,
        data_: {
          version,
          hash,
        },
      });
    }
  }
  safeWriteFileSync(
    path.join(outputDir, "repository_versions.json"),
    JSON.stringify(results, null, 2)
  );
  safeWriteFileSync(
    path.join(outputDir, "repository_versions.csv"),
    convertJsonToCSV(results)
  );
}
