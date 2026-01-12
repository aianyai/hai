import type { LanguageModel } from "ai";
import { streamText } from "ai";
import type { Profile, ProfileProviderOptions } from "../types.js";
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
 * Build provider options for streamText/generateText
 *
 * Priority for thinking settings:
 * 1. CLI --think/--no-think (highest)
 * 2. providerOptions thinking settings
 * 3. options.think (lowest)
 *
 * @param providerType - The provider type (anthropic, openai, etc.)
 * @param cliThink - CLI think option (true=--think, false=--no-think, undefined=not specified)
 * @param configThink - Resolved think from options (profile.options.think > global.options.think)
 * @param model - Model name
 * @param profileProviderOptions - Provider options from profile
 */
export function buildProviderOptions(
  providerType: string,
  cliThink: boolean | undefined,
  configThink: boolean,
  model: string,
  profileProviderOptions?: ProfileProviderOptions
): ProviderOptionsType {
  switch (providerType) {
    case "anthropic": {
      const baseOptions = { ...(profileProviderOptions ?? {}) };

      // Determine if thinking should be enabled
      let enableThinking: boolean;
      if (cliThink !== undefined) {
        // CLI explicitly specified
        enableThinking = cliThink;
      } else if (
        "thinking" in baseOptions &&
        baseOptions.thinking &&
        typeof baseOptions.thinking === "object" &&
        "type" in baseOptions.thinking
      ) {
        // providerOptions has thinking settings
        enableThinking = baseOptions.thinking.type === "enabled";
      } else {
        // Fall back to config options.think
        enableThinking = configThink;
      }

      if (cliThink === false) {
        // CLI --no-think: remove thinking settings
        delete (baseOptions as Record<string, unknown>).thinking;
      } else if (enableThinking) {
        // Enable thinking with budgetTokens from providerOptions or default
        const budgetTokens =
          "thinking" in baseOptions &&
          baseOptions.thinking &&
          typeof baseOptions.thinking === "object" &&
          "budgetTokens" in baseOptions.thinking
            ? baseOptions.thinking.budgetTokens
            : 12000;
        (baseOptions as Record<string, unknown>).thinking = {
          type: "enabled",
          budgetTokens,
        };
      }

      if (Object.keys(baseOptions).length === 0) return undefined;
      return { anthropic: baseOptions };
    }

    case "openai": {
      const baseOptions = { ...(profileProviderOptions ?? {}) };
      const isReasoningModel = /^o[13]/.test(model);

      // Determine if reasoning should be enabled (only for o1/o3 models)
      let enableReasoning: boolean;
      if (cliThink !== undefined) {
        enableReasoning = cliThink && isReasoningModel;
      } else if ("reasoningEffort" in baseOptions && baseOptions.reasoningEffort) {
        enableReasoning = isReasoningModel;
      } else {
        enableReasoning = configThink && isReasoningModel;
      }

      if (cliThink === false) {
        // CLI --no-think: remove reasoning settings
        delete (baseOptions as Record<string, unknown>).reasoningEffort;
      } else if (enableReasoning) {
        const reasoningEffort =
          "reasoningEffort" in baseOptions && baseOptions.reasoningEffort
            ? baseOptions.reasoningEffort
            : "medium";
        (baseOptions as Record<string, unknown>).reasoningEffort = reasoningEffort;
      }

      if (Object.keys(baseOptions).length === 0) return undefined;
      return { openai: baseOptions };
    }

    case "openai-compatible": {
      const baseOptions = { ...(profileProviderOptions ?? {}) };
      if (Object.keys(baseOptions).length === 0) return undefined;
      return { openai: baseOptions };
    }

    case "gemini": {
      const baseOptions = { ...(profileProviderOptions ?? {}) };

      // Determine if thinking should be enabled
      let enableThinking: boolean;
      if (cliThink !== undefined) {
        enableThinking = cliThink;
      } else if ("thinkingConfig" in baseOptions && baseOptions.thinkingConfig) {
        enableThinking = true;
      } else {
        enableThinking = configThink;
      }

      if (cliThink === false) {
        // CLI --no-think: remove thinking settings
        delete (baseOptions as Record<string, unknown>).thinkingConfig;
      } else if (enableThinking) {
        const existingConfig =
          "thinkingConfig" in baseOptions && baseOptions.thinkingConfig
            ? baseOptions.thinkingConfig
            : {};
        (baseOptions as Record<string, unknown>).thinkingConfig = {
          ...existingConfig,
          includeThoughts: true,
        };
      }

      if (Object.keys(baseOptions).length === 0) return undefined;
      return { google: baseOptions };
    }

    default:
      return undefined;
  }
}
