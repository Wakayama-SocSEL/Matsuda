import fs from "fs";
import path from "path";

import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

type DiffResult = {
  filename: string;
  type: "modify" | "add" | "remove";
};

//https://isomorphic-git.org/docs/en/snippets#git-diff-name-status-commithash1-commithash2
async function diff(
  dir: string,
  hash1: string,
  hash2: string
): Promise<DiffResult[]> {
  return await git.walk({
    fs,
    dir,
    trees: [git.TREE({ ref: hash1 }), git.TREE({ ref: hash2 })],
    map: async (filename, entries): Promise<DiffResult | undefined> => {
      if (entries == null) {
        return undefined;
      }
      const [A, B] = entries;
      // 型定義が誤っており、A,Bはnullになることがある
      const Aoid = A && (await A.oid());
      const Boid = B && (await B.oid());
      const type =
        Aoid !== Boid
          ? "modify"
          : Aoid === undefined
          ? "add"
          : Boid === undefined
          ? "remove"
          : "equal";
      if (type == "equal") {
        return undefined;
      }
      return { filename, type };
    },
  });
}

type Data = {
  url: string;
  containsTest: boolean;
  diff: DiffResult[];
};

async function getData(
  dir: string,
  url: string,
  tags: string[]
): Promise<Data[]> {
  const promises = [...new Array(tags.length - 1)].map(async (_, i) => {
    const diffs = await diff(dir, tags[i], tags[i + 1]);
    return {
      url: `${url}/compare/${tags[i]}...${tags[i + 1]}`,
      diff: diffs,
      containsTest:
        diffs.find((diff) => /test/.test(diff.filename)) !== undefined,
    };
  });
  return await Promise.all(promises);
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
