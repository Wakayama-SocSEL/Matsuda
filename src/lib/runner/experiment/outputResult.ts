import path from "path";

import { convertJsonToCSV, outputDir, safeWriteFileSync } from "../../utils";
import { TestResult } from "./type";

type Result = {
  [key: string]: any;
};

export function outputResult(testResults: TestResult[][][]) {
  const results: Result = [];
  // Lを使うテスト全て
  for (const uniqueResults of testResults) {
    // L-Sの一意な組み合わせのテスト全て
    for (const uniqueResult of uniqueResults) {
      if (
        uniqueResult[0].status.state == "success" &&
        uniqueResult[uniqueResult.length - 1].status.state == "failure"
      ) {
        // errまたはstdoutを除去
        const { input } = uniqueResult[uniqueResult.length - 1];
        results.push(input);
      }
    }
  }
  safeWriteFileSync(
    path.join(outputDir, "experiment_result.json"),
    JSON.stringify(results, null, 2)
  );
  safeWriteFileSync(
    path.join(outputDir, "experiment_result.csv"),
    convertJsonToCSV(results)
  );
}
