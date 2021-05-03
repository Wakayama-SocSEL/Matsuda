import fs from "fs";
import path from "path";

import semver from "semver";

import {
  outputDir,
  parallelPromiseAll,
  readJson,
  safeWriteFileSync,
} from "../../utils";
import { dockerRun } from "./dockerRun";
import { getPkgVersions } from "./getPkgVersions";
import {
  ExperimentInput,
  RunTestResult,
  TestError,
  TestStatus,
  TestSuccess,
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

async function runTest(
  repoName: string,
  hash: string,
  libName: string
): Promise<string> {
  return dockerRun(`./runTest.sh ${repoName} ${hash} ${libName}`);
}

export async function runTests(
  input: ExperimentInput,
  bar: ProgressBar,
  concurrency: number
): Promise<RunTestResult> {
  const filepath = path.join(
    outputDir,
    input.L__nameWithOwner,
    "testStatus.json"
  );
  if (fs.existsSync(filepath)) {
    return readJson<RunTestResult>(filepath);
  }
  const versions = await getTestableVersions(input);
  const tasks = versions.map((version) => {
    const task = async () => {
      try {
        const stdout = await runTest(
          input.S__nameWithOwner,
          input.S__commit_id,
          `${input.L__npm_pkg}@${version}`
        );
        const result: TestSuccess = { state: "success", stdout };
        return result;
      } catch (err) {
        const result: TestError = { state: "failure", err: `${err}` };
        return result;
      }
    };
    return async () => {
      const result = await task();
      bar.tick(0, {
        label: `${input.L__nameWithOwner} & ${input.S__npm_pkg}@${version}`,
      });
      return result;
    };
  });
  const statuses = await parallelPromiseAll<TestStatus>(tasks, concurrency);
  const testResult = { input, statuses };
  safeWriteFileSync(filepath, JSON.stringify(testResult, null, 2));
  return testResult;
}
