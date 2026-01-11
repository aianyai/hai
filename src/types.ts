// Provider types
export type ProviderType = "openai" | "openai-compatible" | "anthropic" | "gemini";

// Profile configuration
export interface Profile {
  name: string;
  default?: boolean;
  provider: ProviderType;
  model: string;
  apiKey?: string;
  baseURL?: string;
  think?: boolean;
  for?: string[]; // reserved for future task routing
}

// Pipe-specific settings
export interface PipeSettings {
  stream?: boolean;
  color?: boolean;
}

// Predefined prompts
export interface Prompts {
  [key: string]: string;
}

// Main configuration structure
export interface Config {
  profiles: Profile[];
  prompts?: Prompts;
  stream?: boolean;
  think?: boolean;
  pipe?: PipeSettings;
}

// CLI options parsed from command line
export interface CLIOptions {
  interact?: boolean;
  prompt?: string;
  profile?: string;
  file?: string[];
  think?: boolean;
  stream?: boolean;
  config?: string;
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
}

// Default configuration template
export const DEFAULT_CONFIG: Config = {
  profiles: [
    {
      name: "gpt4",
      default: true,
      provider: "openai-compatible",
      model: "gpt-4o",
      apiKey: "",
      baseURL: "https://api.openai.com/v1",
    },
    {
      name: "claude",
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      apiKey: "",
    },
    {
      name: "local",
      provider: "openai-compatible",
      model: "llama3",
      apiKey: "ollama",
      baseURL: "http://localhost:11434/v1",
    },
  ],
  prompts: {
    translate: "请翻译成英文：{{input}}",
    explain: "用通俗易懂的方式解释：{{input}}",
    code: "用代码实现以下需求：{{input}}",
  },
  stream: true,
  think: false,
  pipe: {
    stream: false,
    color: false,
  },
};
