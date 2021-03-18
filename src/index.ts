import fs from "fs";
import path from "path";
import * as git from "./git";
import { safeWriteFileSync } from "./utils";

type Json = {
  [key: string]: string;
};

async function outputCommitJson(filepath: string, dir: string) {
  const hashs = await git.getHashs(dir);
  const commits = await git.getCommits(hashs, dir);
  const results: Json = {};
  for (const commit of commits) {
    if (commit.pkg && commit.pkg.version && !(commit.pkg.version in results)) {
      results[commit.pkg.version] = commit.hash;
    }
  }
  safeWriteFileSync(filepath, JSON.stringify(results, null, 2));
  console.log("output:", filepath);
}

// TODO: 実行結果を保存
async function outputTestJson(filepath: string, commits: Json, dir: string) {
  for (const [version, hash] of Object.entries(commits)) {
    const result = await git.runTest(hash, dir);
    console.log(version, hash, result.ok);
  }
}

async function main() {
  const repos = ["npm/node-semver"];
  for (const repo of repos) {
    const dir = path.join(process.cwd(), "libs", repo);
    // リポジトリのクローン
    if (!fs.existsSync(dir)) {
      await git.clone(`https://github.com/${repo}.git`, dir);
    }
    // バージョンとコミットハッシュのセットを出力
    const commitsJsonPath = `./output/${repo}/commits.json`;
    if (!fs.existsSync(commitsJsonPath)) {
      await outputCommitJson(commitsJsonPath, dir);
    }
    // 各コミットハッシュごとにテスト実行
    const commits = JSON.parse(fs.readFileSync(commitsJsonPath, "utf-8"));
    const testJsonPath = `./output/${repo}/test.json`;
    if (!fs.existsSync(testJsonPath)) {
      await outputTestJson(testJsonPath, commits, dir);
    }
  }
}

main();
