# hai CLI

AI chat command-line tool built with Vercel AI SDK 6.

## Tech Stack

- Node.js >= 18
- TypeScript (NodeNext module resolution)
- Vercel AI SDK 6
- ESLint 9 (flat config) + Prettier

## Development Commands

```bash
npm run build      # Build the project
npm run dev        # Development mode (watch)
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint checking
npm run lint:fix   # ESLint auto-fix
npm run format     # Prettier formatting
```

## Code Standards

### Dependencies

- Use latest versions of all dependencies
- AI SDK must be version 6

### Type Checking

- No type relaxation or skip rules allowed
- No `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`
- No `eslint-disable` comments in code
- Type issues must be properly fixed, not suppressed

### Error Handling

- Use `{ cause: error }` in catch blocks to preserve error chain
- Never ignore error information

### Comments

- Use JSDoc format for function/class documentation
- Comments must be in English
- Keep comments clear and concise

### Tooling

- Use **Context7** to query latest SDK/library documentation when encountering type or API issues
- Use **LSP** for code navigation, finding references, and refactoring operations
- Do not rely on outdated memory

### Documentation

- When functionality or CLI interface changes, ask user if README.md should be updated

### Git

- Use conventional commit messages (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`)

### CLI Design

- Prefer graceful degradation over errors (e.g., fallback to safe mode instead of requiring flags)
- Flags should be composable when logically compatible
- Confirmation prompts: highlight shortcuts, dim the rest, show full words after selection
- Avoid box-drawing UI that breaks on line wrap

## Configuration

Location: `~/.config/hai/settings.json`

Supports multiple profiles, predefined prompts, streaming output, and thinking mode.

When the settings.json interface changes (e.g., new fields, type changes), update `settings.schema.json` accordingly.
