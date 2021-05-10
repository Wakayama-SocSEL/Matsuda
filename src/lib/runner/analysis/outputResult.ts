import path from "path";

import { ApiResponses, RepoResult } from "./types";
import { safeWriteFileSync, outputDir, convertJsonToCSV } from "../../utils";

type State = "success" | "failure" | "pending";

type Result = {
  [key: string]: any;
};

function getStateCount(reponses: ApiResponses, state: State) {
  return Object.values(reponses).filter((status) => status.data.state == state)
    .length;
}

function createData(stateCounts: { [state in State]: number }, state: State) {
  const { success, failure, pending } = stateCounts;
  const run = success + failure;
  const total = run + pending;
  return {
    count: stateCounts[state],
    total: {
      rate: stateCounts[state] / total,
    },
    run: {
      rate: stateCounts[state] / run,
    },
  };
}

export function outputResult(repoResults: RepoResult[]) {
  const results: Result[] = [];
  for (const repoResult of repoResults) {
    const { repo, apiResponses } = repoResult;
    const stateCounts = {
      success: getStateCount(apiResponses, "success"),
      failure: getStateCount(apiResponses, "failure"),
      pending: getStateCount(apiResponses, "pending"),
    };
    const result: Result = {
      repo_: repo,
      data_: {
        success: createData(stateCounts, "success"),
        failure: createData(stateCounts, "failure"),
        pending: createData(stateCounts, "pending"),
      },
    };
    results.push(result);
  }
  safeWriteFileSync(
    path.join(outputDir, "analysis_result.json"),
    JSON.stringify(results, null, 2)
  );
  safeWriteFileSync(
    path.join(outputDir, "analysis_result.csv"),
    convertJsonToCSV(results)
  );
}
