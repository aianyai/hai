import chalk from "chalk";

/**
 * Check if stdout is a TTY
 */
export function isTTY(): boolean {
  return process.stdout.isTTY === true;
}

// Simple wrapper functions that optionally apply color
const color = {
  cyan: (text: string, enabled: boolean) => (enabled ? chalk.cyan(text) : text),
  green: (text: string, enabled: boolean) => (enabled ? chalk.green(text) : text),
  red: (text: string, enabled: boolean) => (enabled ? chalk.red(text) : text),
  gray: (text: string, enabled: boolean) => (enabled ? chalk.gray(text) : text),
  yellow: (text: string, enabled: boolean) => (enabled ? chalk.yellow(text) : text),
  white: (text: string, enabled: boolean) => (enabled ? chalk.white(text) : text),
};

/**
 * Print AI message with optional color
 */
export function printAIMessage(message: string, colorEnabled: boolean): void {
  console.log(color.cyan(message, colorEnabled));
}

/**
 * Print user message with optional color
 */
export function printUserMessage(message: string, colorEnabled: boolean): void {
  console.log(color.green(`> ${message}`, colorEnabled));
}

/**
 * Print error message
 */
export function printError(message: string, colorEnabled: boolean): void {
  console.error(color.red(`Error: ${message}`, colorEnabled));
}

/**
 * Print info message
 */
export function printInfo(message: string, colorEnabled: boolean): void {
  console.log(color.gray(message, colorEnabled));
}

/**
 * Stream text to stdout
 */
export async function streamOutput(
  stream: AsyncIterable<{ type: string; textDelta?: string }>,
  colorEnabled: boolean
): Promise<string> {
  let fullText = "";

  for await (const part of stream) {
    if (part.type === "text-delta" && part.textDelta) {
      fullText += part.textDelta;
      process.stdout.write(color.cyan(part.textDelta, colorEnabled));
    }
  }

  // Add newline at the end
  console.log();

  return fullText;
}

/**
 * Print non-streaming output
 */
export function printOutput(text: string, colorEnabled: boolean): void {
  console.log(color.cyan(text, colorEnabled));
}

/**
 * Print first-run welcome message
 */
export function printFirstRunMessage(configPath: string, colorEnabled: boolean): void {
  console.log(color.yellow("Welcome to hai!", colorEnabled));
  console.log();
  console.log(color.white("A configuration file has been created at:", colorEnabled));
  console.log(color.cyan(`  ${configPath}`, colorEnabled));
  console.log();
  console.log(color.white("Please edit the configuration file to add your API key.", colorEnabled));
  console.log();
  console.log(color.white("You can also set API keys via environment variables:", colorEnabled));
  console.log(
    color.gray("  OPENAI_API_KEY     - for OpenAI and OpenAI-compatible providers", colorEnabled)
  );
  console.log(color.gray("  ANTHROPIC_API_KEY  - for Anthropic Claude", colorEnabled));
  console.log(color.gray("  GOOGLE_API_KEY     - for Google Gemini", colorEnabled));
  console.log();
}

/**
 * Print no API key error
 */
export function printNoApiKeyError(
  profile: string,
  configPath: string,
  colorEnabled: boolean
): void {
  console.error(color.red(`No API key configured for profile: ${profile}`, colorEnabled));
  console.error();
  console.error(color.white("Please set your API key via:", colorEnabled));
  console.error(color.gray("  1. Environment variable (e.g., OPENAI_API_KEY)", colorEnabled));
  console.error(color.gray(`  2. Configuration file: ${configPath}`, colorEnabled));
  console.error();
}

/**
 * Get colored prompt for interactive mode
 */
export function getPrompt(colorEnabled: boolean): string {
  return color.green("> ", colorEnabled);
}
