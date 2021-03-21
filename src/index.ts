import fs from "fs";
import path from "path";
import * as git from "./git";
import { safeWriteFileSync } from "./utils";

type Json<T> = {
  [key: string]: T;
};

async function outputCommitJson(filepath: string, dir: string) {
  const hashs = await git.getHashs(dir);
  const commits = await git.getCommits(hashs, dir);
  const results: Json<string> = {};
  for (const commit of commits) {
    if (commit.pkg && commit.pkg.version && !(commit.pkg.version in results)) {
      results[commit.pkg.version] = commit.hash;
    }
  }
  safeWriteFileSync(filepath, JSON.stringify(results, null, 2));
  console.log("output:", filepath);
}

async function outputTestJson(
  filepath: string,
  url: string,
  commits: Json<string>
) {
  const results: Json<git.TestResult> = {};
  for (const [index, commit] of Object.entries(commits).entries()) {
    const [version, hash] = commit;
    results[version] = await git.runTest(url, hash);
    const progress = `(${index + 1}/${Object.keys(commits).length})`;
    process.stdout.write(`${progress} ${version}\r`);
  }
  safeWriteFileSync(filepath, JSON.stringify(results, null, 2));
  console.log("output: ", filepath);
}

async function main() {
  const repos = ["npm/node-semver"];
  for (const repo of repos) {
    const dir = path.join(process.cwd(), "libs", repo);
    const url = `https://github.com/${repo}.git`;
    // リポジトリのクローン
    if (!fs.existsSync(dir)) {
      await git.clone(url, dir);
    }
    // リポジトリを最新版にリセット
    await git.reset(dir);
    // バージョンとコミットハッシュのセットを出力
    const commitsJsonPath = `./output/${repo}/commits.json`;
    if (!fs.existsSync(commitsJsonPath)) {
      await outputCommitJson(commitsJsonPath, dir);
    }
    // 各コミットハッシュごとにテスト実行
    const commits = JSON.parse(fs.readFileSync(commitsJsonPath, "utf-8"));
    const testJsonPath = `./output/${repo}/test.json`;
    if (!fs.existsSync(testJsonPath)) {
      await outputTestJson(testJsonPath, url, commits);
    }
  }
}

main();
