import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import type { ProviderOptions } from "./index.js";

/**
 * Create Google Gemini provider
 */
export function createGeminiProvider(options: ProviderOptions): LanguageModel {
  const google = createGoogleGenerativeAI({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
    headers: options.headers,
  });

  // Gemini doesn't have a separate thinking mode
  return google(options.model);
}
