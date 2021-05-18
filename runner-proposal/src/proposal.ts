import fs from "fs";

import * as parser from "@babel/parser";
import traverse from "@babel/traverse";

const [nameWithOwner, prevHash, breakingHash] = process.argv.slice(2);

const code = fs.readFileSync("./src/fixture/sample.js", { encoding: "utf-8" });
const ast = parser.parse(code);

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
      console.log({
        name: arg1.value,
        body: code.slice(arg2.body.start!, arg2.body.end!),
      });
    }
  },
});
