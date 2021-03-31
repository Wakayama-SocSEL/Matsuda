import fs from "fs";
import path from "path";
import childProcess from "child_process";
import ProgressBar from "progress";

export async function run(command: string, cwd: string = "."): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    childProcess.exec(`bash -c "${command}" 2>&1`, { cwd }, (error, stdout) => {
      if (error) reject(stdout.toString());
      else resolve(stdout.toString());
    });
  });
}

// https://qiita.com/rithmety/items/9bc7111c14033fe491f2
export async function parallelPromiseAll<T>(
  tasks: (() => Promise<T>)[],
  bar: ProgressBar,
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  let cursor = 0;
  bar.tick(0);
  const processes = Array.from({ length: concurrency }).map(async () => {
    while (true) {
      const index = cursor++;
      if (index >= tasks.length) return;
      results[index] = await tasks[index]();
      bar.tick();
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
