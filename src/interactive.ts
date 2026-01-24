import { createInterface, Interface, emitKeypressEvents } from "node:readline";
import type { LanguageModel, ModelMessage } from "ai";
import { streamText, generateText } from "ai";
import {
  streamOutput,
  printOutput,
  getPrompt,
  printInterrupt,
  printUserMessage,
  createSpinner,
  printError,
  toError,
} from "./output.js";
import { runAgent } from "./agent.js";
import { confirmCommand } from "./confirm.js";
import type { Mode } from "./types.js";
import chalk from "chalk";

const EXIT_COMMANDS = ["/exit", "/quit"];
const ESC = "\x1b";

interface KeypressKey {
  name?: string;
  ctrl?: boolean;
  sequence?: string;
}

// Use a more flexible type for provider options
type ProviderOptionsType = Parameters<typeof streamText>[0]["providerOptions"];

export interface InteractiveOptions {
  model: LanguageModel;
  providerOptions?: ProviderOptionsType;
  initialMessage?: string;
  initialMessageDisplay?: string;
  stream: boolean;
  colorEnabled: boolean;
  mode: Mode;
  maxSteps: number;
  timeout: number;
  cwd: string;
  autoConfirm: boolean;
  debug?: boolean;
}

/**
 * Run interactive chat session
 */
export async function runInteractive(options: InteractiveOptions): Promise<void> {
  const {
    model,
    providerOptions,
    initialMessage,
    initialMessageDisplay,
    stream,
    colorEnabled,
    mode,
    maxSteps,
    timeout,
    cwd,
    autoConfirm,
    debug,
  } = options;

  const messages: ModelMessage[] = [];
  let rl: Interface | null = null;
  let isStreaming = false;
  let currentAbortController: AbortController | null = null;

  // Setup keypress handling for ESC during streaming
  const setupStreamingKeypress = (): void => {
    if (!process.stdin.isTTY) return;

    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    process.stdin.on("keypress", (_str: string, key: KeypressKey) => {
      if (!isStreaming) return;

      // ESC - interrupt current output only
      if (key.sequence === ESC) {
        if (currentAbortController) {
          printInterrupt(colorEnabled);
          currentAbortController.abort();
        }
      }

      // Ctrl+C - exit program
      if (key.ctrl && key.name === "c") {
        console.log();
        console.log(colorEnabled ? chalk.gray("Bye!") : "Bye!");
        process.exit(0);
      }
    });
  };

  // Restore readline mode after streaming
  const restoreReadlineMode = (): void => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
  };

  // Create readline interface
  const createRL = (): Interface => {
    const newRl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    // Handle Ctrl+C gracefully
    newRl.on("SIGINT", () => {
      console.log();
      console.log(colorEnabled ? chalk.gray("Bye!") : "Bye!");
      newRl.close();
      process.exit(0);
    });

    return newRl;
  };

  // Chat function with abort support
  const chatWithAbort = async (): Promise<string> => {
    currentAbortController = new AbortController();
    isStreaming = true;
    const spinner = createSpinner(colorEnabled);

    try {
      if (mode === "auto") {
        // Agent mode - use tool calling
        if (!stream) {
          spinner.start();
        }
        let agentError: unknown;
        const result = await runAgent({
          model,
          messages,
          maxSteps,
          timeout,
          autoConfirm,
          stream,
          cwd,
          providerOptions,
          onConfirm: confirmCommand,
          onCancel: () => currentAbortController?.abort(),
          onBeforeToolUse: () => {
            if (!stream) spinner.stop();
          },
          onShowLoading: () => {
            if (!stream) spinner.start();
          },
          onError: (error) => {
            agentError = error;
          },
          abortSignal: currentAbortController.signal,
        });

        if (result.stream === true) {
          const { text } = await streamOutput(result.textStream);
          if (agentError) throw toError(agentError);
          return text;
        } else {
          if (agentError) throw toError(agentError);
          // For non-streaming, text is already output by runAgent
          return "";
        }
      } else {
        // Chat mode - pure text generation without tools
        if (stream) {
          let streamError: unknown;
          const result = streamText({
            model,
            messages,
            providerOptions,
            abortSignal: currentAbortController.signal,
            onError: ({ error }) => {
              streamError = error;
            },
          });

          const { text } = await streamOutput(result.textStream);
          if (streamError) throw toError(streamError);
          return text;
        } else {
          spinner.start();
          const result = await generateText({
            model,
            messages,
            providerOptions,
            abortSignal: currentAbortController.signal,
          });
          spinner.stop();
          printOutput(result.text);
          return result.text;
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Message already printed in keypress handler
        return "(stopped)";
      }
      throw error;
    } finally {
      isStreaming = false;
      currentAbortController = null;
    }
  };

  // Handle initial message if provided
  if (initialMessage) {
    setupStreamingKeypress();
    printUserMessage(initialMessageDisplay || initialMessage, colorEnabled);
    messages.push({ role: "user", content: initialMessage });

    const response = await chatWithAbort();
    messages.push({ role: "assistant", content: response });
    restoreReadlineMode();
  }

  // Set prompt
  const prompt = getPrompt(colorEnabled);

  // Main chat loop
  const askQuestion = (): void => {
    rl = createRL();
    rl.question(prompt, (input: string) => {
      void handleInput(input);
    });
  };

  const handleInput = async (input: string): Promise<void> => {
    const trimmed = input.trim();

    // Close current readline
    if (rl) {
      rl.close();
      rl = null;
    }

    // Check for exit commands
    if (EXIT_COMMANDS.includes(trimmed.toLowerCase())) {
      console.log(colorEnabled ? chalk.gray("Bye!") : "Bye!");
      process.exit(0);
    }

    // Skip empty input
    if (!trimmed) {
      askQuestion();
      return;
    }

    // Clear the input line and reprint with color
    process.stdout.write("\x1b[1A\x1b[2K");
    printUserMessage(trimmed, colorEnabled);

    // Add user message
    messages.push({ role: "user", content: trimmed });

    try {
      // Setup for streaming
      setupStreamingKeypress();

      // Get AI response
      const response = await chatWithAbort();
      messages.push({ role: "assistant", content: response });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      printError(errorMessage, { colorEnabled, debug, error });
    } finally {
      // Restore readline mode
      restoreReadlineMode();
    }

    // Continue loop
    askQuestion();
  };

  if (!initialMessage) {
    setupStreamingKeypress();
  }
  restoreReadlineMode();
  askQuestion();
}
