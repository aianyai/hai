import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import type { OpenAICompatibleProviderOptions } from "@ai-sdk/openai-compatible";

// Provider types
export type ProviderType = "openai" | "openai-compatible" | "anthropic" | "gemini";

// Agent mode types
export type Mode = "auto" | "chat";

// Pipe-specific settings
export interface PipeSettings {
  stream?: boolean;
  color?: boolean;
}

// Resolved pipe settings (all fields required)
export interface ResolvedPipeSettings {
  stream: boolean;
  color: boolean;
}

// Runtime options (can be set globally or per-profile)
export interface Options {
  stream?: boolean;
  think?: boolean;
  mode?: Mode;
  maxSteps?: number;
  timeout?: number;
  pipe?: PipeSettings;
}

// Resolved options (all fields required)
export interface ResolvedOptions {
  stream: boolean;
  think: boolean;
  mode: Mode;
  maxSteps: number;
  timeout: number;
  pipe: ResolvedPipeSettings;
}

// Provider options type (union of all provider options from AI SDK)
export type ProfileProviderOptions =
  | AnthropicProviderOptions
  | OpenAIResponsesProviderOptions
  | OpenAICompatibleProviderOptions
  | GoogleGenerativeAIProviderOptions;

// Profile configuration
export interface Profile {
  name: string;
  default?: boolean;
  provider: ProviderType;
  model: string;
  apiKey?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  options?: Options;
  providerOptions?: ProfileProviderOptions;
  for?: string[]; // reserved for future task routing
}

// Predefined prompts
export interface Prompts {
  [key: string]: string;
}

// Main configuration structure
export interface Config {
  profiles: Profile[];
  prompts?: Prompts;
  options?: Options;
}

// CLI options parsed from command line
export interface CLIOptions {
  interact?: boolean;
  prompt?: string;
  use?: string;
  file?: string[];
  think?: boolean;
  stream?: boolean;
  config?: string;
  yes?: boolean;
  chat?: boolean;
  maxSteps?: number;
  timeout?: number;
  debug?: boolean;
}

// Resolved runtime options
export interface RuntimeOptions {
  message: string;
  interact: boolean;
  profile: Profile;
  think: boolean;
  stream: boolean;
  isTTY: boolean;
  colorEnabled: boolean;
  mode: Mode;
  autoConfirm: boolean;
  maxSteps: number;
  timeout: number;
  cwd: string;
}

// Default configuration template
export const DEFAULT_CONFIG: Config = {
  profiles: [
    {
      name: "claude",
      provider: "anthropic",
      model: "claude-opus-4-5",
      apiKey: "$ANTHROPIC_API_KEY",
      baseURL: "https://api.anthropic.com/v1",
      default: true,
    },
    {
      name: "gpt",
      provider: "openai",
      model: "gpt-5.2-pro",
      apiKey: "$OPENAI_API_KEY",
      baseURL: "https://api.openai.com/v1",
    },
    {
      name: "gemini",
      provider: "gemini",
      model: "gemini-3-pro-preview",
      apiKey: "$GOOGLE_API_KEY",
      baseURL: "https://generativelanguage.googleapis.com/v1beta",
    },
    {
      name: "deepseek",
      provider: "openai-compatible",
      model: "deepseek-reasoner",
      apiKey: "$DEEPSEEK_API_KEY",
      baseURL: "https://api.deepseek.com/v1",
    },
  ],
  prompts: {
    translate: "Translate to English: {{input}}",
    explain: "Explain in simple terms: {{input}}",
  },
};
