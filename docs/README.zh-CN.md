# hai

> 在终端中向 AI 打个招呼

[![npm version](https://badge.fury.io/js/%40aiany%2Fhai.svg)](https://www.npmjs.com/package/@aiany/hai)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

**hai**（发音同 "hi"）是 "Hi AI" 的简称，让你在终端中随时使用 AI。执行命令或提问——hai 一下就行。

```bash
$ hai 磁盘空间还有多少
# → 自动运行 `df -h`，并解释结果

$ hai Docker 是什么
# → 直接回答你的问题
```

无需复杂配置，无需切换模式，无需引号，描述你想要的就行。

## 为什么选择 hai？

你有浏览器里的 ChatGPT，有编程用的 Claude Code——但在终端里需要快速帮助时呢？

| | Claude Code / Codex | hai |
|---|---------------------|-----|
| 定位 | 完整开发环境 | 快速 AI 助手 |
| 启动 | 需要配置 | 即装即用 |
| 心态 | "进入工作区" | "Hai 一下就走" |

hai 专为那些 "这个命令怎么用来着" 的时刻而生。

## 功能特性

- **Agent 模式** - AI 根据你的意图自动执行 shell 命令
- **多 AI 提供商** - 支持 OpenAI、Anthropic Claude、Google Gemini 及任意 OpenAI 兼容 API
- **配置文件管理** - 为不同模型和提供商配置多个 profile
- **交互模式** - 在终端中进行多轮对话
- **管道支持** - 处理来自 stdin 或文件的输入
- **预定义提示词** - 使用 `{{input}}` 占位符创建可复用的提示词模板
- **思考模式** - 为支持的模型启用扩展思考（Claude、o1/o3）
- **流式输出** - 实时响应流，支持彩色输出
- **快捷键** - 使用 ESC 或 Ctrl+C 中断输出

## 安装

```bash
npm install -g @aiany/hai
```

## 快速开始

```bash
# 设置 API Key
export OPENAI_API_KEY=your-key

# 执行命令
hai 列出大文件
hai 杀掉占用 3000 端口的进程

# 提问
hai chmod 755 是什么意思
hai 如何撤销上次 git 提交
```

## 使用方式

### 基础用法

```bash
# 单次提问（引号可选）
hai 法国的首都是哪里
hai "法国的首都是哪里？"

# 交互模式
hai -i

# 带初始消息的交互模式
hai -i 你好
```

> **注意：** Shell 特殊字符如 `?`、`*`、`!` 需要使用引号或转义。
> 例如：`hai "你是谁？"` 或 `hai 你是谁\?`

### Agent 模式

默认情况下，hai 以 agent 模式运行，AI 可以执行 shell 命令来帮助你：

```bash
# AI 会运行 `ls -la` 来回答
hai 这个目录里有什么文件？

# AI 会检查 git status 和 logs
hai 显示这个项目的最近改动

# AI 会运行构建命令
hai 构建并测试这个项目
```

执行命令前，你会看到确认提示：

```
▶ ls -la
  Execute? (Yes/no/all/cancel)
```

- **Y/回车** - 执行此命令
- **n** - 跳过此命令
- **a** - 执行所有后续命令（不再询问）
- **c/ESC** - 取消并停止 agent

使用 `-y` 启用自动模式（无需确认）：

```bash
hai -y 列出所有 TypeScript 文件
```

使用 `--chat` 禁用 agent 模式，仅对话：

```bash
hai --chat 解释一下 ls 命令
```

### 管道输入

```bash
# 管道文本
echo "Hello" | hai "翻译成中文"

# 管道文件内容
cat code.js | hai "解释这段代码"
```

### 文件输入

```bash
# 单个文件
hai "审查这段代码" -f main.ts

# 多个文件
hai "比较这些文件" -f a.ts -f b.ts
```

### 切换配置

```bash
# 使用指定 profile
hai -u claude 你好

# 启用思考模式
hai --think 解释量子纠缠
```

### 预定义提示词

```bash
# 使用预定义的提示词模板
hai -p translate "Hello world"
```

## 配置

配置文件位置：`~/.config/hai/settings.json`

```json
{
  "profiles": [
    {
      "name": "claude",
      "provider": "anthropic",
      "model": "claude-opus-4-5",
      "apiKey": "$ANTHROPIC_API_KEY",
      "default": true,
      "options": {
        "think": true
      }
    },
    {
      "name": "gpt",
      "provider": "openai",
      "model": "gpt-5.2-pro",
      "apiKey": "$OPENAI_API_KEY"
    }
  ],
  "prompts": {
    "translate": "翻译成英文：{{input}}",
    "explain": "用简单的话解释：{{input}}"
  },
  "options": {
    "stream": true,
    "mode": "auto",
    "maxSteps": 25,
    "timeout": 120
  }
}
```

### 选项说明

| 选项       | 类型    | 默认值 | 描述                          |
| ---------- | ------- | ------ | ----------------------------- |
| `stream`   | boolean | `true` | 在 TTY 模式启用流式输出       |
| `think`    | boolean | `false`| 启用思考模式                  |
| `mode`     | string  | `auto` | `auto`（agent）或 `chat`（纯文本）|
| `maxSteps` | integer | `25`   | 最大命令执行步数              |
| `timeout`  | integer | `120`  | 命令超时时间（秒）            |

### 提供商

| 提供商              | 描述                    |
| ------------------- | ----------------------- |
| `openai`            | OpenAI Responses API    |
| `openai-compatible` | OpenAI Chat Completions API |
| `anthropic`         | Anthropic Claude        |
| `gemini`            | Google Gemini           |

## CLI 选项

| 选项               | 简写  | 描述                              |
| ------------------ | ----- | --------------------------------- |
| `--interact`       | `-i`  | 交互模式                          |
| `--yes`            | `-y`  | 自动模式（自动确认）              |
| `--chat`           |       | 对话模式（禁用命令执行）          |
| `--prompt <name>`  | `-p`  | 使用预定义提示词                  |
| `--use <name>`     | `-u`  | 使用指定 profile                  |
| `--file <path>`    | `-f`  | 输入文件（可多次使用）            |
| `--think`          |       | 启用思考模式                      |
| `--no-think`       |       | 禁用思考模式                      |
| `--stream`         |       | 强制流式输出                      |
| `--no-stream`      |       | 禁用流式输出                      |
| `--max-steps <n>`  |       | 最大命令执行步数（默认：25）      |
| `--timeout <secs>` |       | 命令超时时间（默认：120秒）       |
| `--debug`          |       | 显示完整错误堆栈信息              |
| `--config <path>`  |       | 自定义配置文件路径                |
| `--version`        |       | 显示版本                          |
| `--help`           |       | 显示帮助                          |

## 快捷键

| 按键      | 单次模式     | 交互模式        | 命令确认 |
| --------- | ------------ | --------------- | -------- |
| `Ctrl+C`  | 退出         | 退出            | 退出     |
| `ESC`     | 停止输出     | 停止当前输出    | 取消     |
| `Y/回车`  | -            | -               | 执行     |
| `n`       | -            | -               | 跳过     |
| `a`       | -            | -               | 全部执行 |
| `c`       | -            | -               | 取消     |

在交互模式中，按 `ESC` 可中断当前响应但保持对话。使用 `Ctrl+C` 或输入 `/exit` 退出。

## 许可证

[GPL-3.0](../LICENSE)
