import type { LanguageModel } from "ai";
import { streamText } from "ai";
import type { Profile } from "../types.js";
import { getBaseURL } from "../config.js";
import { createOpenAIProvider } from "./openai.js";
import { createOpenAICompatibleProvider } from "./openai-compatible.js";
import { createAnthropicProvider } from "./anthropic.js";
import { createGeminiProvider } from "./gemini.js";

export interface ProviderOptions {
  apiKey: string;
  baseURL?: string;
  model: string;
}

export interface ProviderResult {
  model: LanguageModel;
  providerType: string;
}

// Use the actual type from streamText
type ProviderOptionsType = Parameters<typeof streamText>[0]["providerOptions"];

/**
 * Create a language model instance based on profile
 */
export function createProvider(profile: Profile, apiKey: string): ProviderResult {
  const options: ProviderOptions = {
    apiKey,
    baseURL: getBaseURL(profile),
    model: profile.model,
  };

  switch (profile.provider) {
    case "openai":
      return { model: createOpenAIProvider(options), providerType: "openai" };
    case "openai-compatible":
      return { model: createOpenAICompatibleProvider(options), providerType: "openai-compatible" };
    case "anthropic":
      return { model: createAnthropicProvider(options), providerType: "anthropic" };
    case "gemini":
      return { model: createGeminiProvider(options), providerType: "gemini" };
    default: {
      const provider: string = profile.provider;
      throw new Error(`Unknown provider: ${provider}`);
    }
  }
}

/**
 * Build provider options for streamText/generateText based on think mode
 */
export function buildProviderOptions(
  providerType: string,
  think: boolean,
  model: string
): ProviderOptionsType {
  if (!think) return undefined;

  switch (providerType) {
    case "anthropic":
      return {
        anthropic: {
          thinking: { type: "enabled", budgetTokens: 12000 },
        },
      };
    case "openai":
      // Only for o1/o3 reasoning models
      if (/^o[13]/.test(model)) {
        return {
          openai: {
            reasoningEffort: "medium",
          },
        };
      }
      return undefined;
    default:
      return undefined;
  }
}
