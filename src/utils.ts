import semver from "semver";
import { exec } from "child_process";

export async function run(command: string, cwd: string = "."): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(command, { cwd }, (error, stdout) => {
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
      console.log(`${cursor}/${tasks.length}`);
      if (cursor >= tasks.length) return;
      results[cursor] = await tasks[cursor]();
      cursor++;
    }
  });
  await Promise.all(processes);
  return results;
}

export function isUpdated(prev: string, next: string): boolean {
  const isValid = semver.valid(prev) && semver.valid(next);
  if (isValid && semver.gt(prev, next)) return false;
  return prev != next;
}
