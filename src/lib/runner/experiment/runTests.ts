import fs from "fs";
import path from "path";

import semver from "semver";

import {
  outputDir,
  parallelPromiseAll,
  readJson,
  run,
  safeWriteFileSync,
} from "../../utils";
import { getPkgVersions } from "./getPkgVersions";
import {
  ExperimentInput,
  TestError,
  TestSuccess,
  TestStatus,
  TestResult,
} from "./type";

function getCurrentVersion(range: string) {
  return semver.minVersion(range)!.version;
}

async function getTestableVersions(input: ExperimentInput) {
  const versions = await getPkgVersions(input.L__npm_pkg);
  const currentVersion = getCurrentVersion(input.L__commit_version);
  const itemIndex = versions.indexOf(currentVersion);
  if (itemIndex == -1) {
    throw new Error(`${input.L__npm_pkg}@${currentVersion}は存在しません`);
  }
  return versions.slice(itemIndex);
}

function dockerRun(command: string): Promise<string> {
  return run(`docker run --rm kazuki-m/runner-experiment ${command}`, {
    timeout: 150 * 1000,
  });
}

async function runTest(
  repoName: string,
  hash: string,
  libName: string
): Promise<TestStatus> {
  try {
    const stdout = await dockerRun(
      `./runTest.sh ${repoName} ${hash} ${libName}`
    );
    const state: TestSuccess = { state: "success", stdout };
    return state;
  } catch (err) {
    const state: TestError = { state: "failure", err: `${err}` };
    return state;
  }
}

export async function runTests(
  L__nameWithOwner: string,
  inputs: ExperimentInput[],
  bar: ProgressBar,
  concurrency: number
): Promise<TestResult[][]> {
  bar.interrupt(`${L__nameWithOwner}`);
  const filepath = path.join(outputDir, L__nameWithOwner, "testResults.json");
  if (fs.existsSync(filepath)) {
    return readJson<TestResult[][]>(filepath);
  }
  const tasks = inputs.map((input) => {
    const task = async () => {
      const versions = await getTestableVersions(input);
      const results: TestResult[] = [];
      for (const version of versions) {
        const libName = `${input.L__npm_pkg}@${version}`;
        const status = await runTest(
          input.S__nameWithOwner,
          input.S__commit_id,
          libName
        );
        results.push({
          input: { ...input, L__version: version },
          status,
        });
        bar.interrupt(
          `  ${input.S__nameWithOwner} -> ${libName} ... ${status.state}`
        );
        if (status.state == "failure") {
          break;
        }
      }
      return results;
    };
    return async () => {
      const result = await task();
      bar.tick({
        label: `${input.L__nameWithOwner} & ${input.S__npm_pkg}`,
      });
      return result;
    };
  });
  const testResults = await parallelPromiseAll<TestResult[]>(
    tasks,
    concurrency
  );
  safeWriteFileSync(filepath, JSON.stringify(testResults, null, 2));
  return testResults;
}
