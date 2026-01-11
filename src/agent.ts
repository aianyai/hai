import { streamText, generateText, stepCountIs, type LanguageModel, type ModelMessage } from "ai";
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
 */
export async function runAgent(options: AgentOptions): Promise<AgentResult> {
  const tools = {
    shell: createShellTool({
      cwd: options.cwd,
      autoConfirm: options.autoConfirm,
      timeout: options.timeout,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      abortSignal: options.abortSignal,
    }),
  };

  const { system, nonSystemMessages } = extractSystemAndMessages(options.messages);

  if (options.stream) {
    const result = streamText({
      model: options.model,
      system,
      messages: nonSystemMessages,
      tools,
      stopWhen: stepCountIs(options.maxSteps),
      providerOptions: options.providerOptions,
      abortSignal: options.abortSignal,
    });
    return { stream: true, textStream: result.textStream };
  } else {
    const result = await generateText({
      model: options.model,
      system,
      messages: nonSystemMessages,
      tools,
      stopWhen: stepCountIs(options.maxSteps),
      providerOptions: options.providerOptions,
      abortSignal: options.abortSignal,
    });
    return { stream: false, text: result.text };
  }
}
