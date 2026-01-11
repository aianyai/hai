import { tool } from "ai";
import { z } from "zod";
import { spawn } from "child_process";
import { displayCommand, displayOutput, type ConfirmResult } from "../confirm.js";

const MAX_OUTPUT_LENGTH = 50 * 1024; // 50KB

export interface ShellToolOptions {
  cwd: string;
  autoConfirm: boolean;
  timeout: number; // in milliseconds
  onConfirm: (command: string) => Promise<ConfirmResult>;
  onCancel?: () => void; // Called when user cancels to abort the agent
  abortSignal?: AbortSignal;
}

export interface ExecResult {
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * Execute a shell command with abort support
 */
function executeCommand(command: string, options: ShellToolOptions): Promise<ExecResult> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      shell: true,
      cwd: options.cwd,
      timeout: options.timeout,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    // Handle abort signal
    const abortHandler = () => {
      child.kill();
      resolve({ success: false, error: "Command aborted by user" });
    };
    options.abortSignal?.addEventListener("abort", abortHandler);

    child.on("close", (code) => {
      options.abortSignal?.removeEventListener("abort", abortHandler);

      // Combine and truncate output
      let output = stdout + (stderr ? `\n[stderr]\n${stderr}` : "");
      if (output.length > MAX_OUTPUT_LENGTH) {
        output = output.slice(0, MAX_OUTPUT_LENGTH) + "\n...(output truncated)";
      }

      if (code === 0) {
        resolve({ success: true, output: output || "(no output)" });
      } else {
        resolve({
          success: false,
          error: `Command exited with code ${code}`,
          output,
        });
      }
    });

    child.on("error", (err) => {
      options.abortSignal?.removeEventListener("abort", abortHandler);
      resolve({ success: false, error: err.message });
    });
  });
}

export function createShellTool(options: ShellToolOptions) {
  // Track "yes to all" state for this tool instance
  let yesToAll = false;

  return tool({
    description: `Execute a shell command in the current directory. Use this when the user needs to run commands, check files, build projects, etc. Use commands appropriate for the current OS and shell. IMPORTANT: Use non-interactive commands only. Avoid commands that require user input (like vim, nano, less, or interactive prompts). Use flags like -y or --yes for auto-confirmation when available.`,
    inputSchema: z.object({
      command: z.string().describe("The shell command to execute"),
    }),
    execute: async ({ command }) => {
      if (options.autoConfirm || yesToAll) {
        // Auto mode or "yes to all": show command before executing
        displayCommand(command);
      } else {
        // Confirm mode: ask user
        const result = await options.onConfirm(command);
        if (result === "no") {
          return { success: false, error: "User rejected the command" };
        }
        if (result === "cancel") {
          options.onCancel?.();
          return { success: false, error: "User cancelled" };
        }
        if (result === "all") {
          yesToAll = true;
        }
      }

      const execResult = await executeCommand(command, options);

      // Display output to user (stderr so it doesn't go to pipe)
      if (execResult.output) {
        displayOutput(execResult.output);
      }

      return execResult;
    },
  });
}
