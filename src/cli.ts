import { Command } from "commander";
import { createRequire } from "node:module";
import type { CLIOptions } from "./types.js";

// Read version from package.json
const require = createRequire(import.meta.url);
const { version: VERSION } = require("../package.json") as { version: string };

export interface ParsedArgs {
  message: string;
  options: CLIOptions;
}

/**
 * Create and configure the CLI program
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name("hai")
    .description("AI in your terminal. Run commands or ask questions - just hai it.")
    .argument("[message...]", "The message to send to the AI")
    .option("-i, --interact", "Interactive mode for multi-turn conversation")
    .option("-y, --yes", "Autonomous mode (auto-confirm command execution)")
    .option("-p, --prompt <name>", "Use a predefined prompt template")
    .option("-u, --use <name>", "Use a specific profile")
    .option("-f, --file <path>", "Input file (can be used multiple times)", collect, [])
    .option("--chat", "Force chat mode (disable tool use)")
    .option("--think", "Enable model thinking/reasoning mode")
    .option("--no-think", "Disable model thinking mode")
    .option("--stream", "Force enable streaming output")
    .option("--no-stream", "Force disable streaming output")
    .option("--max-steps <number>", "Maximum execution steps for agent mode", parseInt)
    .option("--timeout <seconds>", "Command execution timeout in seconds", parseInt)
    .option("--config <path>", "Path to config file")
    .version(VERSION, "-v, --version");

  return program;
}

/**
 * Collect multiple values for an option
 */
function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}

/**
 * Parse command line arguments
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const program = createProgram();
  program.parse(argv);

  const options = program.opts<CLIOptions>();
  const args = program.args;
  const message = args.join(" ");

  return {
    message,
    options,
  };
}

/**
 * Show help message and exit
 */
export function showHelp(): void {
  const program = createProgram();
  program.help();
}
