import { createInterface } from "node:readline";
import type { LanguageModel, ModelMessage } from "ai";
import { streamText, generateText } from "ai";
import { streamOutput, printOutput, getPrompt } from "./output.js";
import chalk from "chalk";

const EXIT_COMMANDS = ["/exit", "/quit"];

// Use a more flexible type for provider options
type ProviderOptionsType = Parameters<typeof streamText>[0]["providerOptions"];

export interface InteractiveOptions {
  model: LanguageModel;
  providerOptions?: ProviderOptionsType;
  initialMessage?: string;
  stream: boolean;
  colorEnabled: boolean;
}

/**
 * Run interactive chat session
 */
export async function runInteractive(options: InteractiveOptions): Promise<void> {
  const { model, providerOptions, initialMessage, stream, colorEnabled } = options;

  const messages: ModelMessage[] = [];

  // Handle initial message if provided
  if (initialMessage) {
    messages.push({ role: "user", content: initialMessage });

    const response = await chat(model, messages, stream, colorEnabled, providerOptions);
    messages.push({ role: "assistant", content: response });
  }

  // Create readline interface
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  // Set prompt
  const prompt = getPrompt(colorEnabled);

  // Handle Ctrl+C gracefully
  rl.on("SIGINT", () => {
    console.log();
    console.log(colorEnabled ? chalk.gray("Bye!") : "Bye!");
    rl.close();
    process.exit(0);
  });

  // Main chat loop
  const askQuestion = (): void => {
    rl.question(prompt, (input: string) => {
      void handleInput(input);
    });
  };

  const handleInput = async (input: string): Promise<void> => {
    const trimmed = input.trim();

    // Check for exit commands
    if (EXIT_COMMANDS.includes(trimmed.toLowerCase())) {
      console.log(colorEnabled ? chalk.gray("Bye!") : "Bye!");
      rl.close();
      process.exit(0);
    }

    // Skip empty input
    if (!trimmed) {
      askQuestion();
      return;
    }

    // Add user message
    messages.push({ role: "user", content: trimmed });

    try {
      // Get AI response
      const response = await chat(model, messages, stream, colorEnabled, providerOptions);
      messages.push({ role: "assistant", content: response });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(colorEnabled ? chalk.red(`Error: ${errorMessage}`) : `Error: ${errorMessage}`);
    }

    // Continue loop
    askQuestion();
  };

  askQuestion();
}

/**
 * Send message and get response
 */
async function chat(
  model: LanguageModel,
  messages: ModelMessage[],
  useStream: boolean,
  colorEnabled: boolean,
  providerOptions?: ProviderOptionsType
): Promise<string> {
  if (useStream) {
    const result = streamText({
      model,
      messages,
      providerOptions,
    });

    return streamOutput(result.textStream, colorEnabled);
  } else {
    const result = await generateText({
      model,
      messages,
      providerOptions,
    });

    printOutput(result.text, colorEnabled);
    return result.text;
  }
}
