import { streamText, stepCountIs, type LanguageModel, type ModelMessage } from "ai";
import { createShellTool } from "./tools/index.js";
import { getSystemContext } from "./shell-info.js";
import type { ConfirmResult } from "./confirm.js";

export interface AgentOptions {
  model: LanguageModel;
  messages: ModelMessage[];
  maxSteps: number;
  timeout: number; // in milliseconds
  autoConfirm: boolean;
  stream: boolean;
  cwd: string;
  providerOptions?: Parameters<typeof streamText>[0]["providerOptions"];
  onConfirm: (command: string) => Promise<ConfirmResult>;
  onCancel?: () => void; // Called when user cancels to abort the agent
  onBeforeToolUse?: () => void; // Called before any tool use (for clearing loading indicator)
  onShowLoading?: () => void; // Called to show loading indicator (after tool execution)
  onError?: (error: unknown) => void; // Called when an error occurs (suppresses default console.error)
  abortSignal?: AbortSignal;
}

export interface AgentStreamResult {
  stream: true;
  textStream: AsyncIterable<string>;
}

export interface AgentTextResult {
  stream: false;
  text: string;
}

export type AgentResult = AgentStreamResult | AgentTextResult;

/**
 * Extract system message from messages array and merge with shell context
 */
function extractSystemAndMessages(messages: ModelMessage[]): {
  system: string;
  nonSystemMessages: ModelMessage[];
} {
  const systemContext = getSystemContext();
  const existingSystemIndex = messages.findIndex((m) => m.role === "system");

  if (existingSystemIndex >= 0) {
    const existingSystem = messages[existingSystemIndex];
    const existingContent =
      typeof existingSystem.content === "string" ? existingSystem.content : "";
    const nonSystemMessages = messages.filter((_, i) => i !== existingSystemIndex);
    return {
      system: `${systemContext}\n\n${existingContent}`,
      nonSystemMessages,
    };
  } else {
    return {
      system: systemContext,
      nonSystemMessages: messages,
    };
  }
}

/**
 * Run the agent with tool execution capabilities
 * Always uses streamText internally since tool use is interactive
 */
export async function runAgent(options: AgentOptions): Promise<AgentResult> {
  // For non-streaming mode, we need to buffer text and output it before tool calls
  let bufferedText = "";
  // Loading is already shown by caller before runAgent is called
  let isShowingLoading = !options.stream;

  const flushBuffer = () => {
    if (bufferedText) {
      process.stdout.write(bufferedText);
      if (!bufferedText.endsWith("\n")) {
        console.log();
      }
      bufferedText = "";
    }
  };

  const clearLoading = () => {
    if (isShowingLoading) {
      options.onBeforeToolUse?.();
      isShowingLoading = false;
    }
  };

  const showLoading = () => {
    if (!isShowingLoading && !options.stream) {
      options.onShowLoading?.();
      isShowingLoading = true;
    }
  };

  const tools = {
    shell: createShellTool({
      cwd: options.cwd,
      autoConfirm: options.autoConfirm,
      timeout: options.timeout,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      onBeforeToolUse: () => {
        // Clear loading indicator
        clearLoading();
        // For non-streaming mode, output buffered text before tool confirmation
        if (!options.stream) {
          flushBuffer();
        }
      },
      abortSignal: options.abortSignal,
    }),
  };

  const { system, nonSystemMessages } = extractSystemAndMessages(options.messages);

  const result = streamText({
    model: options.model,
    system,
    messages: nonSystemMessages,
    tools,
    stopWhen: stepCountIs(options.maxSteps),
    providerOptions: options.providerOptions,
    abortSignal: options.abortSignal,
    onError: options.onError ? ({ error }) => options.onError!(error) : undefined,
  });

  if (options.stream) {
    return { stream: true, textStream: result.textStream };
  } else {
    // For non-streaming, use fullStream to buffer text and handle tool calls
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        bufferedText += part.text;
      } else if (part.type === "tool-result") {
        // After tool execution, show loading again for next thinking phase
        showLoading();
      }
      // tool-call is handled by onBeforeToolUse callback which clears loading and flushes buffer
    }

    // Clear loading and output any remaining buffered text
    clearLoading();
    flushBuffer();

    return { stream: false, text: "" }; // Text already output
  }
}
