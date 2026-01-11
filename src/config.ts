import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { Config, Profile, ResolvedOptions } from "./types.js";
import { DEFAULT_CONFIG } from "./types.js";

const CONFIG_DIR = join(homedir(), ".config", "hai");
const CONFIG_FILE = join(CONFIG_DIR, "settings.json");

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load configuration from file
 * Creates default config if not exists
 */
export function loadConfig(configPath?: string): Config {
  const path = configPath || CONFIG_FILE;

  if (!existsSync(path)) {
    // Create default config
    ensureConfigDir();
    writeFileSync(path, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
    return DEFAULT_CONFIG;
  }

  try {
    const content = readFileSync(path, "utf-8");
    return JSON.parse(content) as Config;
  } catch (error) {
    throw new Error(`Failed to parse config file: ${path}`, { cause: error });
  }
}

/**
 * Check if this is first run (no API key configured)
 */
export function isFirstRun(config: Config): boolean {
  const defaultProfile = getDefaultProfile(config);
  if (!defaultProfile) return true;

  const apiKey = getApiKey(defaultProfile);
  return !apiKey;
}

/**
 * Resolve a value that may be an environment variable reference.
 * If the value starts with '$', treat it as an env var name and resolve it.
 * Example: "$OPENAI_API_KEY" -> process.env.OPENAI_API_KEY
 */
export function resolveEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;

  if (value.startsWith("$")) {
    const envVarName = value.slice(1);
    return process.env[envVarName] || undefined;
  }

  return value;
}

/**
 * Get API key for a profile (supports $ENV_VAR syntax)
 */
export function getApiKey(profile: Profile): string | undefined {
  return resolveEnvValue(profile.apiKey);
}

/**
 * Get base URL for a profile (supports $ENV_VAR syntax)
 */
export function getBaseURL(profile: Profile): string | undefined {
  return resolveEnvValue(profile.baseURL);
}

/**
 * Get profile by name
 */
export function getProfile(config: Config, name: string): Profile | undefined {
  return config.profiles.find((p) => p.name === name);
}

/**
 * Get default profile
 * Priority: 1. First with default: true, 2. First profile
 */
export function getDefaultProfile(config: Config): Profile | undefined {
  const defaultProfile = config.profiles.find((p) => p.default === true);
  if (defaultProfile) return defaultProfile;
  return config.profiles[0];
}

/**
 * Resolve which profile to use
 */
export function resolveProfile(config: Config, profileName?: string): Profile {
  if (profileName) {
    const profile = getProfile(config, profileName);
    if (!profile) {
      throw new Error(`Profile not found: ${profileName}`);
    }
    return profile;
  }

  const profile = getDefaultProfile(config);
  if (!profile) {
    throw new Error("No profiles configured");
  }
  return profile;
}

/**
 * Get predefined prompt template
 */
export function getPromptTemplate(config: Config, name: string): string | undefined {
  return config.prompts?.[name];
}

/**
 * Resolve options by merging global and profile options
 * Priority: Profile options > Global options > Defaults
 */
export function resolveOptions(config: Config, profile: Profile): ResolvedOptions {
  const defaults: ResolvedOptions = {
    stream: true,
    think: false,
    mode: "auto",
    maxSteps: 25,
    timeout: 120,
    pipe: { stream: false, color: false },
  };

  const global = config.options ?? {};
  const profileOpts = profile.options ?? {};

  return {
    stream: profileOpts.stream ?? global.stream ?? defaults.stream,
    think: profileOpts.think ?? global.think ?? defaults.think,
    mode: profileOpts.mode ?? global.mode ?? defaults.mode,
    maxSteps: profileOpts.maxSteps ?? global.maxSteps ?? defaults.maxSteps,
    timeout: profileOpts.timeout ?? global.timeout ?? defaults.timeout,
    pipe: {
      stream: profileOpts.pipe?.stream ?? global.pipe?.stream ?? defaults.pipe.stream,
      color: profileOpts.pipe?.color ?? global.pipe?.color ?? defaults.pipe.color,
    },
  };
}

/**
 * Resolve think mode setting
 * Priority: CLI > Profile > Global > Default (false)
 */
export function resolveThinkMode(
  cliThink: boolean | undefined,
  profile: Profile,
  config: Config
): boolean {
  if (cliThink !== undefined) return cliThink;
  const options = resolveOptions(config, profile);
  return options.think;
}

/**
 * Resolve stream mode setting
 * Priority: CLI > TTY/Pipe defaults
 */
export function resolveStreamMode(
  cliStream: boolean | undefined,
  profile: Profile,
  config: Config,
  isTTY: boolean
): boolean {
  if (cliStream !== undefined) return cliStream;

  const options = resolveOptions(config, profile);

  if (isTTY) {
    return options.stream;
  } else {
    return options.pipe.stream;
  }
}

/**
 * Resolve color mode
 */
export function resolveColorMode(profile: Profile, config: Config, isTTY: boolean): boolean {
  if (isTTY) return true;
  const options = resolveOptions(config, profile);
  return options.pipe.color;
}

/**
 * Get config file path
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}
