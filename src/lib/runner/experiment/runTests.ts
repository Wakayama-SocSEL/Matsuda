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
import { ExperimentInput, TestStatus, TestResult } from "./type";

function getCurrentVersion(range: string) {
  try {
    return semver.minVersion(range)?.version || null;
  } catch (e) {
    return null;
  }
}

async function getTestableVersions(input: ExperimentInput) {
  const versions = await getPkgVersions(input.L__npm_pkg);
  const currentVersion = getCurrentVersion(input.L__commit_version);
  if (currentVersion == null) {
    return [];
  }
  const itemIndex = versions.map((v) => v.version).indexOf(currentVersion);
  if (itemIndex == -1) {
    return [];
  }
  return versions.slice(itemIndex);
}

async function runTest(
  repoName: string,
  hash: string,
  libName: string,
  taskIndex?: number
): Promise<TestStatus> {
  try {
    const cmd =
      `docker run --rm --cpus 1 --name runner-${taskIndex} ` +
      `-v $HOST_PWD/runner-experiment/repos/${repoName}:/mnt-repos/${repoName} ` +
      `kazuki-m/runner-experiment ` +
      `timeout 150s ./runTest.sh ${repoName} ${hash} ${libName}`;
    const stdout = await run(cmd);
    const state: TestStatus = { state: "success", log: stdout };
    return state;
  } catch (err) {
    const state: TestStatus = { state: "failure", log: `${err}` };
    return state;
  }
}

export async function runTests(
  inputs: ExperimentInput[],
  bar: ProgressBar,
  concurrency: number
): Promise<TestResult[][]> {
  const tasks = inputs.map((input) => {
    const task = async (index?: number) => {
      const versions = await getTestableVersions(input);
      const results: TestResult[] = [];
      for (const { version, hash } of versions) {
        const libName = `${input.L__npm_pkg}@${version}`;

        // キャッシュ処理
        const filepath = path.join(
          outputDir,
          ".cache-experiment",
          libName,
          `${input.S__npm_pkg}@${input.S__commit_id.slice(0, 7)}`,
          "testResult.json"
        );
        if (fs.existsSync(filepath)) {
          const result = readJson<TestResult>(filepath);
          results.push(result);
          // 失敗以降はテストを実行しない
          if (result.status.state == "failure") {
            break;
          }
          continue;
        }

        // 出力情報は後から確認するだけなので、別で保存
        // test_result.jsonのファイルサイズ削減のため
        const { state, log } = await runTest(
          input.S__nameWithOwner,
          input.S__commit_id,
          libName,
          index
        );
        const result = {
          input: { ...input, L__version: version, L__hash: hash },
          status: { state },
        };
        results.push(result);
        bar.interrupt(`  ${input.S__nameWithOwner} -> ${libName} ... ${state}`);
        safeWriteFileSync(filepath, JSON.stringify(result, null, 2));

        // 出力情報を別途保存
        const logpath = path.join(filepath, "..", `${+new Date()}.log`);
        safeWriteFileSync(logpath, log);

        // 失敗以降はテストを実行しない
        if (state == "failure") {
          break;
        }
      }
      return results;
    };
    return async (index?: number) => {
      const result = await task(index);
      bar.tick({
        label: `${input.L__nameWithOwner} & ${input.S__npm_pkg}`,
      });
      return result;
    };
  });
  return parallelPromiseAll<TestResult[]>(tasks, concurrency);
}
