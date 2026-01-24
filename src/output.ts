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

export interface PrintErrorOptions {
  colorEnabled: boolean;
  debug?: boolean;
  error?: unknown;
}

/**
 * Print error message with optional debug stack trace
 */
export function printError(message: string, options: PrintErrorOptions | boolean): void {
  // Support legacy signature: printError(message, colorEnabled)
  const opts: PrintErrorOptions =
    typeof options === "boolean" ? { colorEnabled: options } : options;
  const { colorEnabled, debug, error } = opts;

  console.error(color.red(`Error: ${message}`, colorEnabled));

  if (debug && error instanceof Error) {
    console.error();
    console.error(color.gray("Stack trace:", colorEnabled));
    console.error(color.gray(formatErrorStack(error), colorEnabled));
  }
}

/**
 * Format error stack with cause chain
 */
function formatErrorStack(error: Error, indent = ""): string {
  const lines: string[] = [];

  // Error name and message
  const name = error.name || "Error";
  lines.push(`${indent}${name}: ${error.message}`);

  // Stack trace (skip the first line which is the error message)
  if (error.stack) {
    const stackLines = error.stack.split("\n").slice(1);
    for (const line of stackLines) {
      lines.push(`${indent}${line}`);
    }
  }

  // Recursively format cause chain
  if (error.cause instanceof Error) {
    lines.push("");
    lines.push(`${indent}Caused by:`);
    lines.push(formatErrorStack(error.cause, indent + "  "));
  }

  return lines.join("\n");
}

/**
 * Convert unknown error to Error instance
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  return new Error("Unknown error");
}

/**
 * Print info message
 */
export function printInfo(message: string, colorEnabled: boolean): void {
  console.log(color.gray(message, colorEnabled));
}

/**
 * Spinner animation for loading state
 */
const SPINNER_FRAMES = ["|", "/", "-", "\\"];
const SPINNER_INTERVAL = 100; // ms

// Rainbow colors: cycle through spectrum
const SPINNER_COLORS = [
  (s: string) => chalk.red(s),
  (s: string) => chalk.redBright(s),
  (s: string) => chalk.yellow(s),
  (s: string) => chalk.yellowBright(s),
  (s: string) => chalk.green(s),
  (s: string) => chalk.greenBright(s),
  (s: string) => chalk.cyan(s),
  (s: string) => chalk.cyanBright(s),
  (s: string) => chalk.blue(s),
  (s: string) => chalk.blueBright(s),
  (s: string) => chalk.magenta(s),
  (s: string) => chalk.magentaBright(s),
];

export interface Spinner {
  start: () => void;
  stop: () => void;
}

export function createSpinner(colorEnabled: boolean): Spinner {
  // No spinner in pipe mode (non-TTY)
  if (!isTTY()) {
    return { start: () => {}, stop: () => {} };
  }

  let frameIndex = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const getFrame = () => {
    const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length];
    if (!colorEnabled) return frame;
    const colorFn = SPINNER_COLORS[frameIndex % SPINNER_COLORS.length];
    return colorFn(frame);
  };

  const start = () => {
    if (timer) return; // Already running
    frameIndex = 0;
    process.stdout.write(getFrame());
    timer = setInterval(() => {
      frameIndex++;
      process.stdout.write("\r" + getFrame());
    }, SPINNER_INTERVAL);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    process.stdout.write("\r\x1b[K"); // Clear the spinner line
  };

  return { start, stop };
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
