import fs from "fs";

import execa from "execa";
import globby from "globby";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";

async function getTestFiles(dir: string) {
  const filepaths = await globby(`${dir}/**/*.{js,ts}`);
  return filepaths
    .map((path) => {
      return { path, isTS: path.endsWith(".ts") };
    })
    .filter((file) => /(test|spec)/.test(file.path));
}

type TestCases = {
  label: string;
  body: string;
};

function traverseTest(code: string, typescript = false) {
  const testCases: TestCases[] = [];
  const options: parser.ParserOptions = {
    sourceType: "module",
    plugins: typescript ? ["typescript"] : [],
  };
  let otherCode = `${code}`;
  try {
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
          const body = code.slice(path.node.start!, path.node.end!);
          testCases.push({ label: arg1.value, body });
          otherCode = otherCode.replace(body, "");
        }
      },
    });
  } catch (e) {}
  return { testCases, otherCode };
}

type Result = {
  coverage: any;
  testCases: {
    [label: string]: string;
  };
  otherCodes: {
    [path: string]: string;
  };
};

async function runTest(repoDir: string) {
  try {
    await execa("npm", ["install"], { cwd: repoDir });
    await execa(
      "npx",
      ["nyc", "--reporter", "json-summary", "timeout", "150s", "npm", "test"],
      {
        cwd: repoDir,
      }
    );
  } catch (e) {
    return null;
  }
  try {
    const result = await execa(
      "jq",
      [
        ".total | {lines:.lines, statements:.statements}",
        "./coverage/coverage-summary.json",
      ],
      { cwd: repoDir }
    );
    return JSON.parse(result.stdout);
  } catch (e) {
    return null;
  }
}

async function main() {
  const [nameWithOwner, hash, skipCoverage] = process.argv.slice(2);
  const repoDir = `./repos/${nameWithOwner}`;
  await execa("git", ["reset", hash, "--hard"], { cwd: repoDir });

  const testFiles = await getTestFiles(repoDir);
  const coverage = skipCoverage ? null : await runTest(repoDir);
  const result: Result = { coverage, testCases: {}, otherCodes: {} };
  for (const file of testFiles) {
    const code = fs.readFileSync(file.path, { encoding: "utf-8" });
    const traversed = traverseTest(code, file.isTS);
    const addedKeys: string[] = [];
    for (const testCase of traversed.testCases) {
      const hash = addedKeys.filter((key) => key == testCase.label).length;
      addedKeys.push(testCase.label);
      result.testCases[`${testCase.label}#${hash}`] = testCase.body;
      result.otherCodes[file.path] = traversed.otherCode;
    }
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
});
