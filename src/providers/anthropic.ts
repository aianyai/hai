import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import type { ProviderOptions } from "./index.js";

/**
 * Create Anthropic provider (Claude)
 */
export function createAnthropicProvider(options: ProviderOptions): LanguageModel {
  const anthropic = createAnthropic({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
    headers: options.headers,
  });

  return anthropic(options.model);
}
