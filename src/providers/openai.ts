import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { ProviderOptions } from "./index.js";

/**
 * Create OpenAI provider (Responses API)
 */
export function createOpenAIProvider(options: ProviderOptions): LanguageModel {
  const openai = createOpenAI({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
  });

  return openai(options.model);
}
