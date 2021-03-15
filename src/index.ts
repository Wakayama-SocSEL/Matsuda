import fs from "fs";
import path from "path";
import { exec } from "child_process";
import semver from "semver";
import { parallelPromiseAll } from "./utils";

async function command(command: string, cwd: string = ".") {
  return new Promise<string>((resolve, reject) => {
    exec(command, { cwd }, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout.toString());
    });
  });
}

type Package = {
  version: string;
};

async function getHashs(dir: string): Promise<string[]> {
  // pkg_commits.csv内のコミットに置き換え可能？
  const gitLogResult = await command(`git log --reverse --pretty="%H"`, dir);
  return gitLogResult.trim().split("\n");
}

async function getPackage(hash: string, dir: string): Promise<Package | null> {
  try {
    const pkg = await command(`git show ${hash}:package.json`, dir);
    return JSON.parse(pkg) as Package;
  } catch (e) {
    return null;
  }
}

type Commit = {
  hash: string;
  pkg: Package | null;
};

async function getCommits(hashs: string[], dir: string): Promise<Commit[]> {
  const tasks = hashs.map((hash) => {
    return async () => {
      const pkg = await getPackage(hash, dir);
      return { hash, pkg };
    };
  });
  return parallelPromiseAll<Commit>(tasks, 10);
}

function isUpdated(prev: string, next: string): boolean {
  const isValid = semver.valid(prev) && semver.valid(next);
  if (isValid && semver.gt(prev, next)) return false;
  return prev != next;
}

const main = async () => {
  const urls = [
    "https://github.com/npm/node-semver",
    //"https://github.com/expressjs/express",
  ];
  for (const url of urls) {
    const name = url.split("/").pop()!;
    const dir = path.join(process.cwd(), "libs", name);
    if (!fs.existsSync(dir)) {
      await command(`git clone ${url}.git ${dir}`);
    }
    const hashs = await getHashs(dir);
    const commits = await getCommits(hashs, dir);
    for (const commit of commits) {
      console.log(commit.hash, commit.pkg?.version);
    }
  }
};

main();
