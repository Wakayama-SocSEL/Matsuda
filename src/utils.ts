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
