import path from "path";
import * as git from "./git";

const main = async () => {
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
    for (const commit of commits) {
      console.log(commit.hash, commit.pkg?.version);
    }
  }
};

main();
