# hai

> Say hi to AI, right from your terminal

[![npm version](https://img.shields.io/npm/v/%40aiany%2Fhai?style=flat)](https://www.npmjs.org/package/@aiany/hai)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

**hai** (pronounced "hi") brings AI to your terminal. Run commands or ask questions—just hai it.

```bash
$ hai "how much disk space"
# → runs `df -h`, explains the result

$ hai "what is Docker"
# → answers your question directly
```

No complex setup. No switching modes. Just describe what you need.

## Features

- **Agent Mode** - AI automatically executes shell commands based on your intent
- **Multiple AI Providers** - OpenAI, Anthropic Claude, Google Gemini, and any OpenAI-compatible API
- **Profile Management** - Configure multiple profiles for different models and providers
- **Interactive Mode** - Multi-turn conversations in the terminal
- **Pipe Support** - Process input from stdin or files
- **Predefined Prompts** - Create reusable prompt templates with `{{input}}` placeholder
- **Thinking Mode** - Enable extended thinking for supported models (Claude, o1/o3)
- **Streaming Output** - Real-time response streaming with color support
- **Keyboard Shortcuts** - Interrupt output with ESC or Ctrl+C

## Installation

```bash
npm install -g @aiany/hai
```

## Usage

### Basic

```bash
# Single question
hai "What is the capital of France?"

# Interactive mode
hai -i

# Interactive mode with initial message
hai -i "Hello"
```

### Agent Mode

By default, hai runs in agent mode where AI can execute shell commands to help you:

```bash
# AI will run `ls -la` to answer
hai "What files are in this directory?"

# AI will check git status and logs
hai "Show me recent changes in this project"

# AI will run build commands
hai "Build and test this project"
```

When a command is about to execute, you'll see a confirmation prompt:

```
▶ ls -la
  Execute? (Yes/no/all/cancel)
```

- **Y/Enter** - Execute this command
- **n** - Skip this command
- **a** - Execute all remaining commands without asking
- **c/ESC** - Cancel and stop the agent

Use `-y` for autonomous mode (no confirmation):

```bash
hai -y "List all TypeScript files"
```

Use `--chat` to disable agent mode and just chat:

```bash
hai --chat "Explain what ls does"
```

### Pipe Input

```bash
# Pipe text
echo "Hello" | hai "Translate to Chinese"

# Pipe file content
cat code.js | hai "Explain this code"
```

### File Input

```bash
# Single file
hai "Review this code" -f main.ts

# Multiple files
hai "Compare these files" -f a.ts -f b.ts
```

### Profiles

```bash
# Use a specific profile
hai -u claude "Hello"

# Enable thinking mode
hai --think "Explain quantum entanglement"
```

### Predefined Prompts

```bash
# Use a predefined prompt template
hai -p translate "Hello world"
```

## Configuration

Configuration file: `~/.config/hai/settings.json`

```json
{
  "profiles": [
    {
      "name": "claude",
      "provider": "anthropic",
      "model": "claude-opus-4-5",
      "apiKey": "$ANTHROPIC_API_KEY",
      "baseURL": "https://api.openai.com/v1",
      "default": true,
      "options": {
        "think": true
      }
    },
    {
      "name": "gpt",
      "provider": "openai",
      "model": "gpt-5.2-pro",
      "apiKey": "$OPENAI_API_KEY",
      "baseURL": "https://api.openai.com/v1"
    },
    {
      "name": "gemini",
      "provider": "gemini",
      "model": "gemini-3-pro-preview",
      "apiKey": "$GOOGLE_API_KEY",
      "baseURL": "https://generativelanguage.googleapis.com/v1beta"
    },
    {
      "name": "deepseek",
      "provider": "openai-compatible",
      "model": "deepseek-reasoner",
      "apiKey": "$DEEPSEEK_API_KEY",
      "baseURL": "https://api.deepseek.com/v1"
    }
  ],
  "prompts": {
    "translate": "Translate to English: {{input}}",
    "explain": "Explain in simple terms: {{input}}"
  },
  "options": {
    "stream": true,
    "mode": "auto",
    "maxSteps": 25,
    "timeout": 120
  }
}
```

### Options

Runtime options can be set globally or per-profile. Profile options override global options.

| Option     | Type    | Default | Description                          |
| ---------- | ------- | ------- | ------------------------------------ |
| `stream`   | boolean | `true`  | Enable streaming output in TTY mode  |
| `think`    | boolean | `false` | Enable thinking mode                 |
| `mode`     | string  | `auto`  | `auto` (agent) or `chat` (pure text) |
| `maxSteps` | integer | `25`    | Max command execution steps          |
| `timeout`  | integer | `120`   | Command timeout in seconds           |
| `pipe`     | object  | -       | Pipe mode settings (stream, color)   |

Example with profile-specific options:

```json
{
  "profiles": [
    {
      "name": "claude-think",
      "provider": "anthropic",
      "model": "claude-opus-4-5",
      "apiKey": "$ANTHROPIC_API_KEY",
      "options": {
        "think": true,
        "mode": "chat"
      },
      "headers": { "X-Custom-Auth": "token" },
      "providerOptions": {
        "thinking": { "type": "enabled", "budgetTokens": 20000 }
      }
    }
  ],
  "options": {
    "stream": true
  }
}
```

### Provider Options

`providerOptions` accepts the same parameters as AI SDK's providerOptions. These are passed directly to the provider when calling the model.

### Custom Headers

Use `headers` to add custom HTTP headers to API requests.

### Environment Variables

Use `$ENV_VAR` syntax in `apiKey` and `baseURL` fields to reference environment variables:

```json
{
  "apiKey": "$OPENAI_API_KEY",
  "baseURL": "$MY_CUSTOM_BASE_URL"
}
```

You can also use literal values directly:

```json
{
  "apiKey": "sk-xxxx",
  "baseURL": "http://localhost:11434/v1"
}
```

### Providers

| Provider            | Description                 |
| ------------------- | --------------------------- |
| `openai`            | OpenAI Responses API        |
| `openai-compatible` | OpenAI Chat Completions API |
| `anthropic`         | Anthropic Claude            |
| `gemini`            | Google Gemini               |

## CLI Options

| Option             | Short | Description                               |
| ------------------ | ----- | ----------------------------------------- |
| `--interact`       | `-i`  | Interactive mode                          |
| `--yes`            | `-y`  | Autonomous mode (auto-confirm)            |
| `--chat`           |       | Chat mode (disable command execution)     |
| `--prompt <name>`  | `-p`  | Use predefined prompt                     |
| `--use <name>`     | `-u`  | Use a specific profile                    |
| `--file <path>`    | `-f`  | Input file (can use multiple times)       |
| `--think`          |       | Enable thinking mode                      |
| `--no-think`       |       | Disable thinking mode                     |
| `--stream`         |       | Force streaming output                    |
| `--no-stream`      |       | Disable streaming output                  |
| `--max-steps <n>`  |       | Max command execution steps (default: 25) |
| `--timeout <secs>` |       | Command timeout in seconds (default: 120) |
| `--config <path>`  |       | Custom config file path                   |
| `--version`        | `-v`  | Show version                              |
| `--help`           | `-h`  | Show help                                 |

## Keyboard Shortcuts

| Key       | Single-shot Mode | Interactive Mode    | Command Confirm |
| --------- | ---------------- | ------------------- | --------------- |
| `Ctrl+C`  | Exit             | Exit                | Exit            |
| `ESC`     | Stop output      | Stop current output | Cancel          |
| `Y/Enter` | -                | -                   | Execute         |
| `n`       | -                | -                   | Skip            |
| `a`       | -                | -                   | Execute all     |
| `c`       | -                | -                   | Cancel          |

In interactive mode, pressing `ESC` interrupts the current response but allows you to continue the conversation. Use `Ctrl+C` or type `/exit` to quit.

## 中文文档

[查看中文 README](./docs/README.zh-CN.md)

## License

[GPL-3.0](LICENSE)
