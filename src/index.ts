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

async function getPackages(hashs: string[], dir: string): Promise<Package[]> {
  const pkgs: Package[] = [];
  for (const [i, hash] of hashs.entries()) {
    console.log(`${i + 1}/${hashs.length}:`);
    try {
      const pkg = await command(`git show ${hash}:package.json`, dir);
      pkgs.push(JSON.parse(pkg));
    } catch (e) {}
  }
  return pkgs;
}

const main = async () => {
  const urls = [
    "https://github.com/expressjs/express",
    "https://github.com/npm/node-semver",
  ];
  for (const url of urls) {
    const name = url.split("/").pop()!;
    const dir = path.join(process.cwd(), "libs", name);
    if (!fs.existsSync(dir)) {
      await command(`git clone ${url}.git ${dir}`);
    }
    const hashs = await getHashs(dir);
    const pkgs = await getPackages(hashs, dir);
    for (const [i] of pkgs.entries()) {
      if (i == 0) continue;
      const [prevV, nextV] = [pkgs[i - 1].version, pkgs[i].version];
      const isValid = semver.valid(prevV) && semver.valid(nextV);
      if (isValid && semver.gt(prevV, nextV)) {
        console.log(nextV);
      }
    }
  }
};

main();
