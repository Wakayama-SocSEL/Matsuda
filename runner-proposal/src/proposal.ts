import fs from "fs";
import { execSync } from "child_process";

import globby from "globby";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";

async function getTestFilepaths(dir: string) {
  const filepaths = await globby(`${dir}/**/*.{js,ts}`);
  return filepaths.filter((path) => /(test|spec)/.test(path));
}

type TestCases = {
  label: string;
  body: string;
};

function traverseTestCases(code: string, typescript = false) {
  const testCases: TestCases[] = [];
  const options: parser.ParserOptions = {
    sourceType: "module",
    plugins: typescript ? ["typescript"] : [],
  };
  const ast = parser.parse(code, options);
  traverse(ast, {
    CallExpression(path) {
      const [arg1, arg2] = path.node.arguments;
      if (
        path.node.arguments.length >= 2 &&
        path.node.callee.type == "Identifier" &&
        /^(test|it)$/.test(path.node.callee.name) &&
        arg1.type == "StringLiteral" &&
        (arg2.type == "FunctionExpression" ||
          arg2.type == "ArrowFunctionExpression")
      ) {
        testCases.push({
          label: arg1.value,
          body: code.slice(arg2.body.start!, arg2.body.end!),
        });
      }
    },
  });
  return testCases;
}

type Result = {
  [label: string]: string;
};

async function main() {
  const [nameWithOwner, hash] = process.argv.slice(2);
  const repoDir = `./repos/${nameWithOwner}`;
  execSync(`cd ${repoDir} && git reset ${hash} --hard`);
  const testFilepaths = await getTestFilepaths(repoDir);
  const result: Result = {};
  for (const path of testFilepaths) {
    const code = fs.readFileSync(path, { encoding: "utf-8" });
    const testCases = traverseTestCases(code, path.endsWith("ts"));
    for (const testCase of testCases) {
      result[testCase.label] = testCase.body;
    }
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
});
