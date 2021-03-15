import path from "path";
import * as git from "./git";
import { safeWriteFileSync } from "./utils";

function output(filepath: string, commits: git.Commit[]) {
  const results: { [key: string]: string } = {};
  for (const commit of commits) {
    if (commit.pkg && commit.pkg.version) {
      results[commit.pkg.version] = commit.hash;
    }
  }
  safeWriteFileSync(filepath, JSON.stringify(results, null, 2));
  console.log("output:", filepath);
}

async function main() {
  const repos = ["npm/node-semver", "expressjs/express"];
  for (const repo of repos) {
    const dir = path.join(process.cwd(), "libs", repo);
    await git.clone(`https://github.com/${repo}.git`, dir);
    const hashs = await git.getHashs(dir);
    const commits = await git.getCommits(hashs, dir);
    output(`./output/${repo}.json`, commits);
  }
}

main();
