import fs from "fs";
import path from "path";

import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

type DiffResult = {
  filepath: string;
  type: "modify" | "add" | "remove" | "equal";
};

//https://isomorphic-git.org/docs/en/snippets#git-diff-name-status-commithash1-commithash2
async function diff(
  dir: string,
  hash1: string,
  hash2: string
): Promise<DiffResult[]> {
  const diffs: DiffResult[] = await git.walk({
    fs,
    dir,
    trees: [git.TREE({ ref: hash1 }), git.TREE({ ref: hash2 })],
    // @ts-ignore
    map: async (filepath, [A, B]): DiffResult => {
      const Aoid = await A.oid();
      const Boid = await B.oid();
      const type =
        Aoid !== Boid
          ? "modify"
          : Aoid === undefined
          ? "add"
          : Boid === undefined
          ? "remove"
          : "equal";
      return { filepath, type };
    },
  });
  return diffs.filter((diff) => diff.filepath != ".");
}

const main = async () => {
  const urls = [
    //"https://github.com/expressjs/express",
    "https://github.com/npm/node-semver",
  ];
  for (const url of urls) {
    const repo = url.split("/").pop()!;
    const dir = path.join(process.cwd(), "libs", repo);
    if (!fs.existsSync(dir)) {
      await git.clone({ fs, http, dir, url: `${url}.git` });
    }
    const diffs = await diff(dir, "v7.3.3", "v7.3.4");
    console.log(diffs.filter((diff) => diff.type != "equal"));
  }
};

main();
