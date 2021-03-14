import fs from "fs";
import path from "path";
import { exec } from "child_process";

async function command(command: string, cwd: string = ".") {
  return new Promise<string>((resolve, reject) => {
    exec(command, { cwd }, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout.toString());
    });
  });
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
    // pkg_commits.csv内のコミットに置き換え可能？
    const gitLogResult = await command(`git log --reverse --pretty="%H"`, dir);
    const hashs = gitLogResult.split("\n");
    for (const [i, hash] of hashs.entries()) {
      process.stdout.write(`${i + 1}/${hashs.length}:`);
      try {
        const pkg = await command(`git show ${hash}:package.json`, dir);
        console.log(JSON.parse(pkg).version);
      } catch (e) {
        console.error(e.toString().trim());
      }
    }
  }
};

main();
