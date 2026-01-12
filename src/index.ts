import { streamText, generateText } from "ai";
import chalk from "chalk";
import { parseArgs, showHelp } from "./cli.js";
import {
  loadConfig,
  isFirstRun,
  getApiKey,
  resolveProfile,
  getPromptTemplate,
  resolveThinkMode,
  resolveStreamMode,
  resolveColorMode,
  resolveOptions,
  getConfigPath,
} from "./config.js";
import { createProvider, buildProviderOptions } from "./providers/index.js";
import { processInput } from "./input.js";
import {
  isTTY,
  streamOutput,
  printOutput,
  printError,
  printInfo,
  printFirstRunMessage,
  printNoApiKeyError,
  printInterrupt,
  createSpinner,
} from "./output.js";
import { runInteractive } from "./interactive.js";
import { createInterruptibleController } from "./keyboard.js";
import { runAgent } from "./agent.js";
import { confirmCommand } from "./confirm.js";

async function main(): Promise<void> {
  try {
    // Parse CLI arguments
    const { message, options } = parseArgs(process.argv);

    // Validate argument conflicts
    if (options.yes && options.chat) {
      printError("-y and --chat cannot be used together", true);
      process.exit(1);
    }

    // Load configuration
    const config = loadConfig(options.config);
    const configPath = getConfigPath();

    // Resolve profile
    const profile = resolveProfile(config, options.use);

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

    // Resolve options (profile options override global options)
    const resolvedOpts = resolveOptions(config, profile);

    // Resolve settings with CLI overrides
    const tty = isTTY();
    const think = resolveThinkMode(options.think, profile, config);
    const stream = resolveStreamMode(options.stream, profile, config, tty);
    const colorEnabled = resolveColorMode(profile, config, tty);

    // Resolve mode (CLI --chat overrides config)
    // Non-TTY stdin with auto mode and no -y flag: fallback to chat mode
    let mode = options.chat ? "chat" : resolvedOpts.mode;
    if (!process.stdin.isTTY && !options.yes && mode === "auto") {
      mode = "chat";
    }
    const autoConfirm = options.yes ?? false;
    const maxSteps = options.maxSteps ?? resolvedOpts.maxSteps;
    const timeout = (options.timeout ?? resolvedOpts.timeout) * 1000; // convert to ms
    const cwd = process.cwd();

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
    const { full: finalMessage, display: displayMessage } = await processInput(
      message,
      promptTemplate,
      options.file || []
    );

    // Check if we have any message
    if (!finalMessage && !options.interact) {
      if (tty) {
        // TTY with no message: enter interactive mode
        printInfo("Entering interactive mode...", colorEnabled);
      } else {
        // Non-TTY with no message: show help
        console.log(chalk.yellow("No message provided. See usage below:\n"));
        showHelp();
        return;
      }
    }

    // Interactive mode (skip if stdout is piped - output would go to pipe)
    if ((options.interact || !finalMessage) && tty) {
      await runInteractive({
        model,
        providerOptions,
        initialMessage: finalMessage || undefined,
        initialMessageDisplay: displayMessage || undefined,
        stream,
        colorEnabled,
        mode,
        maxSteps,
        timeout,
        cwd,
        autoConfirm,
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
      if (mode === "auto") {
        // Agent mode - use tool calling
        const spinner = createSpinner(colorEnabled);
        if (!stream) {
          spinner.start();
        }
        const result = await runAgent({
          model,
          messages: [{ role: "user", content: finalMessage }],
          maxSteps,
          timeout,
          autoConfirm,
          stream,
          cwd,
          providerOptions,
          onConfirm: confirmCommand,
          onCancel: () => controller.abort(),
          onBeforeToolUse: () => {
            if (!stream) spinner.stop();
          },
          onShowLoading: () => {
            if (!stream) spinner.start();
          },
          abortSignal: controller.signal,
        });

        if (result.stream === true) {
          await streamOutput(result.textStream);
        }
        // For non-streaming, text is already output by runAgent
      } else {
        // Chat mode - pure text generation without tools
        if (stream) {
          const result = streamText({
            model,
            messages: [{ role: "user", content: finalMessage }],
            providerOptions,
            abortSignal: controller.signal,
          });
          await streamOutput(result.textStream);
        } else {
          const spinner = createSpinner(colorEnabled);
          spinner.start();
          const result = await generateText({
            model,
            messages: [{ role: "user", content: finalMessage }],
            providerOptions,
            abortSignal: controller.signal,
          });
          spinner.stop();
          printOutput(result.text);
        }
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
