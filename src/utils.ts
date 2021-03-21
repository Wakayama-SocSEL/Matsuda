import fs from "fs";
import path from "path";
import childProcess from "child_process";

export async function run(command: string, cwd: string = "."): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    childProcess.exec(command, { cwd }, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout.toString());
    });
  });
}

// https://qiita.com/rithmety/items/9bc7111c14033fe491f2
export async function parallelPromiseAll<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  let cursor = 0;
  const processes = Array.from({ length: concurrency }).map(async () => {
    while (true) {
      const progress = Math.floor((cursor * 100) / tasks.length);
      process.stdout.write(`${cursor}/${tasks.length}(${progress}%)\r`);
      if (cursor >= tasks.length) return;
      results[cursor] = await tasks[cursor]();
      cursor++;
    }
  });
  await Promise.all(processes);
  return results;
}

export function safeWriteFileSync(filepath: string, data: string) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filepath, data);
}

export function readJson<T>(filepath: string): T {
  const content = fs.readFileSync(filepath, "utf-8");
  return JSON.parse(content);
}
