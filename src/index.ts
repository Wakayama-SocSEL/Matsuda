import fs from "fs";
import path from "path";
import { exec } from "child_process";
import semver from "semver";

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
  return gitLogResult.split("\n");
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
  pkg: Package;
};

async function getUniqueVersionCommits(
  hashs: string[],
  dir: string
): Promise<Commit[]> {
  const commits: Commit[] = [];
  for (const [i, hash] of hashs.entries()) {
    console.log(`${i + 1}/${hashs.length}`);
    const pkg = await getPackage(hash, dir);
    if (pkg == null) continue;
    const isFirstCommitOrUpdated =
      commits.length == 0 ||
      isUpdated(commits[commits.length - 1].pkg.version, pkg.version);
    if (isFirstCommitOrUpdated) {
      commits.push({ hash, pkg });
    }
  }
  return commits;
}

function isUpdated(prev: string, next: string): boolean {
  const isValid = semver.valid(prev) && semver.valid(next);
  if (isValid && semver.gt(prev, next)) return false;
  return prev != next;
}

const main = async () => {
  const urls = [
    "https://github.com/expressjs/express",
    //"https://github.com/npm/node-semver",
  ];
  for (const url of urls) {
    const name = url.split("/").pop()!;
    const dir = path.join(process.cwd(), "libs", name);
    if (!fs.existsSync(dir)) {
      await command(`git clone ${url}.git ${dir}`);
    }
    const hashs = await getHashs(dir);
    const commits = await getUniqueVersionCommits(hashs, dir);
    for (const commit of commits) {
      console.log(commit.hash, commit.pkg.version);
    }
  }
};

main();
