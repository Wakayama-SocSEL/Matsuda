import fs from "fs";

import execa from "execa";
import globby from "globby";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";

import { ProposalResult } from "./type";

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

function parseAndGenerate(code: string, options: parser.ParserOptions) {
  try {
    const ast = parser.parse(code, options);
    return generate(ast).code;
  } catch (e) {}
  return "";
}

function traverseTest(code: string, typescript = false) {
  const testCases: TestCases[] = [];
  const options: parser.ParserOptions = {
    sourceType: "module",
    plugins: typescript ? ["typescript"] : [],
  };
  let otherCode = `${code}`;
  let error = false;
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
          const body = code.slice(path.node.start!, path.node.end! + 1);
          testCases.push({ label: arg1.value, body });
          otherCode = otherCode.replace(body, "");
        }
      },
    });
  } catch (e) {
    error = true;
  }
  // テスト外の変更を取得するにあたって、空白行の追加などを無視するために
  // テスト外のコードを一度パースしてから元に戻す処理を追加
  // 空白行追加の例: https://github.com/vercel/ms/compare/2.0.0..2.1.0
  return { testCases, otherCode: parseAndGenerate(otherCode, options), error };
}

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
  const result: ProposalResult = {
    coverage,
    testCases: {},
    otherCodes: {},
    errors: {},
  };
  for (const file of testFiles) {
    const code = fs.readFileSync(file.path, { encoding: "utf-8" });
    const traversed = traverseTest(code, file.isTS);
    result.otherCodes[file.path] = traversed.otherCode;
    result.errors[file.path] = traversed.error;

    const addedLabels: string[] = [];
    for (const testCase of traversed.testCases) {
      // 重複したキー(ラベル)のテストケースがあれば、発見した順で番号をつける
      const hash = addedLabels.filter((l) => l == testCase.label).length;
      addedLabels.push(testCase.label);
      // 結果にテストコードを追加
      result.testCases[`${testCase.label}#${hash}`] = testCase.body;
    }
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
});
