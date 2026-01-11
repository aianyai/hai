import { readFileSync } from "node:fs";
import { basename } from "node:path";

const INPUT_PLACEHOLDER = "{{input}}";

/**
 * Check if stdin has piped data
 */
export function hasStdinData(): boolean {
  return !process.stdin.isTTY;
}

/**
 * Read stdin data (for piped input)
 */
export async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return "";
  }

  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("readable", () => {
      let chunk: string | null;
      while ((chunk = process.stdin.read() as string | null) !== null) {
        data += chunk;
      }
    });
    process.stdin.on("end", () => resolve(data.trim()));
    process.stdin.on("error", reject);
  });
}

/**
 * Read file contents
 */
export function readFile(filePath: string): string {
  try {
    return readFileSync(filePath, "utf-8");
  } catch (error) {
    throw new Error(`Failed to read file: ${filePath}`, { cause: error });
  }
}

/**
 * Merge multiple files into a single input string
 * Format: === filename ===\n<content>\n
 */
export function mergeFiles(filePaths: string[]): string {
  if (filePaths.length === 0) return "";

  const parts = filePaths.map((filePath) => {
    const name = basename(filePath);
    const content = readFile(filePath);
    return `=== ${name} ===\n${content}`;
  });

  return parts.join("\n");
}

/**
 * Fill template with input
 * If template has {{input}}, replace it
 * Otherwise, append input to the end
 */
export function fillTemplate(template: string, input: string): string {
  if (!input) return template;
  if (!template) return input;

  if (template.includes(INPUT_PLACEHOLDER)) {
    return template.replace(INPUT_PLACEHOLDER, input);
  }

  return `${template}\n\n${input}`;
}

/**
 * Process all inputs according to the two-step flow:
 * Step 1: Pipe/file content → fill into main prompt
 * Step 2: Step 1 result → fill into --prompt template
 */
export async function processInput(
  mainPrompt: string,
  predefinedPrompt: string | undefined,
  filePaths: string[]
): Promise<string> {
  // Collect pipe and file inputs
  const pipeInput = await readStdin();
  const fileInput = mergeFiles(filePaths);

  // Combine pipe and file inputs
  let externalInput = "";
  if (pipeInput && fileInput) {
    externalInput = `${pipeInput}\n\n${fileInput}`;
  } else {
    externalInput = pipeInput || fileInput;
  }

  // Step 1: External input → main prompt
  let step1Result = mainPrompt;
  if (externalInput) {
    step1Result = fillTemplate(mainPrompt, externalInput);
  }

  // Step 2: Step 1 result → predefined prompt
  if (predefinedPrompt) {
    return fillTemplate(predefinedPrompt, step1Result);
  }

  return step1Result;
}
