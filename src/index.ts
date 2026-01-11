import { streamText, generateText } from "ai";
import { parseArgs } from "./cli.js";
import {
  loadConfig,
  isFirstRun,
  getApiKey,
  resolveProfile,
  getPromptTemplate,
  resolveThinkMode,
  resolveStreamMode,
  resolveColorMode,
  getConfigPath,
} from "./config.js";
import { createProvider, buildProviderOptions } from "./providers/index.js";
import { processInput } from "./input.js";
import {
  isTTY,
  streamOutput,
  printOutput,
  printError,
  printFirstRunMessage,
  printNoApiKeyError,
} from "./output.js";
import { runInteractive } from "./interactive.js";

async function main(): Promise<void> {
  try {
    // Parse CLI arguments
    const { message, options } = parseArgs(process.argv);

    // Load configuration
    const config = loadConfig(options.config);
    const configPath = getConfigPath();

    // Resolve profile
    const profile = resolveProfile(config, options.profile);

    // Check for first run
    if (isFirstRun(config)) {
      printFirstRunMessage(configPath, true);
      process.exit(1);
    }

    // Get API key
    const apiKey = getApiKey(profile);
    if (!apiKey) {
      printNoApiKeyError(profile.name, configPath, true);
      process.exit(1);
      return; // TypeScript needs this to understand control flow
    }

    // Resolve settings
    const tty = isTTY();
    const think = resolveThinkMode(options.think, profile, config);
    const stream = resolveStreamMode(options.stream, config, tty);
    const colorEnabled = resolveColorMode(config, tty);

    // Create AI model
    const { model, providerType } = createProvider(profile, apiKey);

    // Build provider options for thinking mode
    const providerOptions = buildProviderOptions(providerType, think, profile.model);

    // Get predefined prompt template if specified
    const promptTemplate = options.prompt ? getPromptTemplate(config, options.prompt) : undefined;

    if (options.prompt && !promptTemplate) {
      printError(`Prompt template not found: ${options.prompt}`, colorEnabled);
      process.exit(1);
    }

    // Process input (stdin, files, templates)
    const finalMessage = await processInput(message, promptTemplate, options.file || []);

    // Check if we have any message
    if (!finalMessage && !options.interact) {
      printError("No message provided", colorEnabled);
      process.exit(1);
    }

    // Interactive mode
    if (options.interact) {
      await runInteractive({
        model,
        providerOptions,
        initialMessage: finalMessage || undefined,
        stream,
        colorEnabled,
      });
      return;
    }

    // Single-shot mode
    if (stream) {
      const result = streamText({
        model,
        messages: [{ role: "user", content: finalMessage }],
        providerOptions,
      });
      await streamOutput(result.textStream, colorEnabled);
    } else {
      const result = await generateText({
        model,
        messages: [{ role: "user", content: finalMessage }],
        providerOptions,
      });
      printOutput(result.text, colorEnabled);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    printError(errorMessage, true);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${errorMessage}`);
  process.exit(1);
});
