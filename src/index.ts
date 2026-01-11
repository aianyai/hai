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
  printInterrupt,
} from "./output.js";
import { runInteractive } from "./interactive.js";
import { createInterruptibleController } from "./keyboard.js";

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

    // Single-shot mode with keyboard interrupt support
    const { controller, keyboard } = createInterruptibleController({
      onInterrupt: () => {
        printInterrupt(colorEnabled);
      },
    });

    try {
      if (stream) {
        const result = streamText({
          model,
          messages: [{ role: "user", content: finalMessage }],
          providerOptions,
          abortSignal: controller.signal,
        });
        await streamOutput(result.textStream);
      } else {
        const result = await generateText({
          model,
          messages: [{ role: "user", content: finalMessage }],
          providerOptions,
          abortSignal: controller.signal,
        });
        printOutput(result.text);
      }
    } catch {
      // Ignore abort errors - message already printed in onInterrupt
    } finally {
      keyboard.cleanup();
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
