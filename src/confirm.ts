import chalk from "chalk";

export type ConfirmResult = "yes" | "no" | "all" | "cancel";

/**
 * Display command to be executed (used in both confirm and auto mode)
 */
export function displayCommand(command: string): void {
  console.error(chalk.cyan("▶ ") + chalk.yellow(command));
}

/**
 * Display command output (max 5 lines, show count for remaining)
 */
export function displayOutput(output: string): void {
  const lines = output.split("\n");
  const maxLines = 5;

  console.error(); // blank line before output
  if (lines.length <= maxLines) {
    console.error(chalk.gray(output));
  } else {
    const displayedLines = lines.slice(0, maxLines).join("\n");
    const moreCount = lines.length - maxLines;
    console.error(chalk.gray(displayedLines));
    console.error(chalk.gray(`... ${moreCount} more lines`));
  }
  console.error(); // blank line after output
}

/**
 * Prompt user to confirm command execution
 * - Enter/y/Y → confirm (yes)
 * - n/N → reject current command (no)
 * - a/A → confirm all subsequent commands (all)
 * - c/C/ESC → cancel this round (cancel)
 * - Other keys → ignored
 */
export async function confirmCommand(command: string): Promise<ConfirmResult> {
  displayCommand(command);
  // Format: Execute? (Yes/no/all/cancel) - Y/n/a/c normal (Y bold), rest dim
  const prompt =
    chalk.blue("Execute? ") +
    chalk.white("(") +
    chalk.bold("Y") +
    chalk.gray("es") +
    chalk.white("/") +
    chalk.white("n") +
    chalk.gray("o") +
    chalk.white("/") +
    chalk.white("a") +
    chalk.gray("ll") +
    chalk.white("/") +
    chalk.white("c") +
    chalk.gray("ancel") +
    chalk.white(")") +
    " ";
  process.stderr.write("  " + prompt);

  return new Promise((resolve) => {
    const isTTY = process.stdin.isTTY;
    // Save previous rawMode state to restore later
    const wasRawMode = isTTY && process.stdin.isRaw;

    if (isTTY && !wasRawMode) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    const cleanup = () => {
      if (isTTY && !wasRawMode) {
        process.stdin.setRawMode(false);
      }
      process.stdin.removeListener("data", onData);
    };

    const onData = (key: string) => {
      // Ctrl+C - exit program
      if (key === "\x03") {
        cleanup();
        console.error();
        process.exit(0);
      }

      // Enter or y/Y - confirm
      if (key === "\r" || key === "\n" || key === "y" || key === "Y") {
        cleanup();
        console.error(chalk.green("Yes"));
        resolve("yes");
        return;
      }

      // n/N - reject current command
      if (key === "n" || key === "N") {
        cleanup();
        console.error(chalk.red("No"));
        resolve("no");
        return;
      }

      // a/A - yes to all
      if (key === "a" || key === "A") {
        cleanup();
        console.error(chalk.yellow("Yes to All"));
        resolve("all");
        return;
      }

      // c/C or ESC - cancel this round
      if (key === "c" || key === "C" || key === "\x1b") {
        cleanup();
        console.error(chalk.gray("Cancel"));
        resolve("cancel");
        return;
      }

      // Ignore all other keys
    };

    process.stdin.on("data", onData);
  });
}
