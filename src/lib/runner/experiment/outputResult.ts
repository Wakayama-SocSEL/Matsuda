import path from "path";

import { convertJsonToCSV, outputDir, safeWriteFileSync } from "../../utils";
import { TestResult } from "./type";

type Result = {
  [key: string]: any;
};

export function outputResult(testResults: TestResult[][]) {
  const results: Result = [];
  // ライブラリごとの結果
  for (const libraryResults of testResults) {
    // 各ライブラリと各ソフトウェアの結果
    for (const { input, status } of libraryResults) {
      results.push({
        ...input,
        ...status,
      });
    }
  }
  safeWriteFileSync(
    path.join(outputDir, "test_result.json"),
    JSON.stringify(results, null, 2)
  );
  safeWriteFileSync(
    path.join(outputDir, "test_result.csv"),
    convertJsonToCSV(results, { quote: '"' })
  );
}
