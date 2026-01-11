import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import type { ProviderOptions } from "./index.js";

/**
 * Create OpenAI Compatible provider (Chat Completions API)
 * Used for OpenAI Chat API and third-party compatible services
 */
export function createOpenAICompatibleProvider(options: ProviderOptions): LanguageModel {
  if (!options.baseURL) {
    throw new Error("baseURL is required for openai-compatible provider");
  }

  const provider = createOpenAICompatible({
    name: "openai-compatible",
    apiKey: options.apiKey,
    baseURL: options.baseURL,
  });

  return provider(options.model);
}
