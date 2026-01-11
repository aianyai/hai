# hai

A simple and flexible AI chat CLI tool

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
hai --profile claude "Hello"

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
      "name": "gpt4",
      "default": true,
      "provider": "openai-compatible",
      "model": "gpt-4o",
      "baseURL": "https://api.openai.com/v1"
    },
    {
      "name": "claude",
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "think": true
    },
    {
      "name": "gemini",
      "provider": "gemini",
      "model": "gemini-2.0-flash"
    }
  ],
  "prompts": {
    "translate": "Translate to English: {{input}}",
    "explain": "Explain in simple terms: {{input}}"
  },
  "stream": true
}
```

### Providers

| Provider            | Description                 | Required Config             |
| ------------------- | --------------------------- | --------------------------- |
| `openai`            | OpenAI Responses API        | `OPENAI_API_KEY`            |
| `openai-compatible` | OpenAI Chat Completions API | `OPENAI_API_KEY`, `baseURL` |
| `anthropic`         | Anthropic Claude            | `ANTHROPIC_API_KEY`         |
| `gemini`            | Google Gemini               | `GOOGLE_API_KEY`            |

### Environment Variables

API keys can be set via environment variables (takes priority over config file):

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`

## CLI Options

| Option              | Short | Description                          |
| ------------------- | ----- | ------------------------------------ |
| `--interact`        | `-i`  | Interactive mode                     |
| `--yes`             | `-y`  | Autonomous mode (auto-confirm)       |
| `--chat`            |       | Chat mode (disable command execution)|
| `--prompt <name>`   | `-p`  | Use predefined prompt                |
| `--profile <name>`  |       | Switch profile                       |
| `--file <path>`     | `-f`  | Input file (can use multiple times)  |
| `--think`           |       | Enable thinking mode                 |
| `--no-think`        |       | Disable thinking mode                |
| `--stream`          |       | Force streaming output               |
| `--no-stream`       |       | Disable streaming output             |
| `--max-steps <n>`   |       | Max command execution steps (default: 25) |
| `--timeout <secs>`  |       | Command timeout in seconds (default: 120) |
| `--config <path>`   |       | Custom config file path              |
| `--version`         |       | Show version                         |
| `--help`            |       | Show help                            |

## Keyboard Shortcuts

| Key      | Single-shot Mode | Interactive Mode         | Command Confirm |
| -------- | ---------------- | ------------------------ | --------------- |
| `Ctrl+C` | Exit             | Exit                     | Exit            |
| `ESC`    | Stop output      | Stop current output      | Cancel          |
| `Y/Enter`| -                | -                        | Execute         |
| `n`      | -                | -                        | Skip            |
| `a`      | -                | -                        | Execute all     |
| `c`      | -                | -                        | Cancel          |

In interactive mode, pressing `ESC` interrupts the current response but allows you to continue the conversation. Use `Ctrl+C` or type `/exit` to quit.

## License

MIT
