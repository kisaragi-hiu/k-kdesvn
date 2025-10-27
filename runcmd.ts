/** Simple zx replacement. */

import { spawnSync } from "node:child_process";

/**
 * Run `command` with `args`.
 * `command` is space-separated, so args can be specified in there.
 * Options:
 * showcmd:
 *   show the command and arguments
 * quiet:
 *   don't show the output in the terminal. This also enables reading the
 *   output in the return value.
 * shell:
 *   Use the shell to run the command.
 * nothrow:
 *   Don't throw if the command returns a non-zero exit code.
 */
export function runcmd(options?: {
  nothrow?: boolean;
  showcmd?: boolean;
  quiet?: boolean;
  shell?: boolean;
  input?: string;
}) {
  return function (command: string, ...args: string[]) {
    const splitCmd = command.split(" ");
    const first = splitCmd[0];
    if (!first) {
      throw new Error("Command must not be empty");
    }
    const allArgs = [...splitCmd.slice(1), ...args];
    if (options?.showcmd) {
      if (allArgs.some((x) => x.includes(" ")))
        console.warn("Some args have spaces and will not be displayed right");
      console.log(`$ ${first} ${allArgs.join(" ")}`);
    }
    const result = spawnSync(first, allArgs, {
      shell: options?.shell,
      stdio: options?.quiet ? "pipe" : "inherit",
      encoding: "utf-8",
      input: options?.input,
    });
    if (result.status !== 0 && !options?.nothrow) {
      throw new Error(`exit code: ${result.status}`);
    }
    return result;
  };
}
