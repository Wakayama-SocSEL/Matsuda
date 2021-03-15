import fs from "fs";
import path from "path";
import * as git from "./git";

function output(filename: string, commits: git.Commit[]) {
  const results: { [key: string]: string } = {};
  for (const commit of commits) {
    if (commit.pkg && commit.pkg.version) {
      results[commit.pkg.version] = commit.hash;
    }
  }
  fs.writeFileSync(filename, JSON.stringify(results));
}

async function main() {
  const urls = [
    "https://github.com/npm/node-semver",
    "https://github.com/expressjs/express",
  ];
  for (const url of urls) {
    const name = url.split("/").pop()!;
    const dir = path.join(process.cwd(), "libs", name);
    await git.clone(url, dir);
    const hashs = await git.getHashs(dir);
    const commits = await git.getCommits(hashs, dir);
    output(`./output/${name}.json`, commits);
  }
}

main();
