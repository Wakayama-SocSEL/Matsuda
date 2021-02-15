import fs from "fs";
import path from "path";
import childProcess from "child_process";

import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

type GitDiff = {
  change: string;
  filename: string;
};

function diff(dir: string, hash1: string, hash2: string): Promise<GitDiff[]> {
  return new Promise<GitDiff[]>((resolve) => {
    const command = `cd ${dir} && git diff --raw ${hash1} ${hash2}`;
    const diffBuffer = childProcess.execSync(command);
    const diffs = diffBuffer.toString("utf-8").trim().split("\n");
    const result = diffs.map((diff) => {
      const [change, filename] = diff.split(/\s/).slice(-2);
      return { change, filename };
    });
    resolve(result);
  });
}

type Data = {
  compareUrl: string;
  containsTest: boolean;
  diffs: GitDiff[];
};

function getData(dir: string, url: string, tags: string[]): Promise<Data[]> {
  const promises = [...new Array(tags.length - 1)].map(async (_, i) => {
    const diffs = await diff(dir, tags[i], tags[i + 1]);
    const compareUrl = `${url}/compare/${tags[i]}...${tags[i + 1]}`;
    const containsTest =
      diffs.find((diff) => {
        return /test/.test(diff.filename) && diff.change;
      }) !== undefined;
    console.log(compareUrl, containsTest);
    return {
      compareUrl,
      diffs,
      containsTest,
    };
  });
  return Promise.all(promises);
}

const main = async () => {
  const urls = [
    "https://github.com/expressjs/express",
    "https://github.com/npm/node-semver",
  ];
  for (const url of urls) {
    const repo = url.split("/").pop()!;
    const dir = path.join(process.cwd(), "libs", repo);
    if (!fs.existsSync(dir)) {
      await git.clone({ fs, http, dir, url: `${url}.git` });
    }
    const tags = await git.listTags({ fs, dir });
    const result = await getData(dir, url, tags);
    fs.writeFileSync(
      `./output/${repo}.json`,
      JSON.stringify({ result }, null, 2)
    );
  }
};

main();
