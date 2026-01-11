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
 * Print AI message (default color)
 */
export function printAIMessage(message: string): void {
  console.log(message);
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
 * Print loading message (for non-streaming mode)
 */
export function printLoading(colorEnabled: boolean): void {
  process.stdout.write(color.gray("Thinking...", colorEnabled));
}

/**
 * Clear loading message
 */
export function clearLoading(): void {
  process.stdout.write("\r\x1b[K");
}

/**
 * Print interrupt message
 */
export function printInterrupt(colorEnabled: boolean): void {
  console.log();
  console.log(color.gray("(stopped)", colorEnabled));
}

export interface StreamResult {
  text: string;
  aborted: boolean;
}

/**
 * Stream text to stdout
 */
export async function streamOutput(stream: AsyncIterable<string>): Promise<StreamResult> {
  let fullText = "";
  let aborted = false;

  try {
    for await (const chunk of stream) {
      fullText += chunk;
      process.stdout.write(chunk);
    }
    // Add newline if output doesn't end with one
    if (fullText.length > 0 && !fullText.endsWith("\n")) {
      console.log();
    }
  } catch (error) {
    // Check if it's an abort error
    if (error instanceof Error && error.name === "AbortError") {
      aborted = true;
      // Message printed by caller at interrupt point
    } else {
      throw error;
    }
  }

  return { text: fullText, aborted };
}

/**
 * Print non-streaming output (default color)
 */
export function printOutput(text: string): void {
  console.log(text);
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
  console.log(color.white("Please edit the configuration file to set your API key.", colorEnabled));
  console.log();
  console.log(
    color.gray("Tip: Use $ENV_VAR syntax to reference environment variables:", colorEnabled)
  );
  console.log(color.gray('  "apiKey": "$OPENAI_API_KEY"', colorEnabled));
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
  console.error(color.white("Please set your API key in the configuration file:", colorEnabled));
  console.error(color.cyan(`  ${configPath}`, colorEnabled));
  console.error();
  console.error(
    color.gray("Tip: Use $ENV_VAR syntax to reference environment variables:", colorEnabled)
  );
  console.error(color.gray('  "apiKey": "$OPENAI_API_KEY"', colorEnabled));
  console.error();
}

/**
 * Get colored prompt for interactive mode
 */
export function getPrompt(colorEnabled: boolean): string {
  return color.green("> ", colorEnabled);
}
