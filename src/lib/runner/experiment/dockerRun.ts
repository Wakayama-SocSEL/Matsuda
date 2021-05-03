import { run } from "../../utils";

export function dockerRun(command: string): Promise<string> {
  return run(`docker run --rm kazuki-m/runner-experiment ${command}`);
}
