export interface ShellInfo {
  os: "Windows" | "macOS" | "Linux";
  shell: string;
}

/**
 * Detect current OS and shell environment
 */
export function getShellInfo(): ShellInfo {
  const platform = process.platform;

  if (platform === "win32") {
    // Detect PowerShell vs cmd.exe
    const isPowerShell = !!process.env.PSModulePath;
    return {
      os: "Windows",
      shell: isPowerShell ? "PowerShell" : "cmd.exe",
    };
  } else if (platform === "darwin") {
    return {
      os: "macOS",
      shell: process.env.SHELL || "zsh",
    };
  } else {
    return {
      os: "Linux",
      shell: process.env.SHELL || "bash",
    };
  }
}

/**
 * Get system context string for AI model
 */
export function getSystemContext(): string {
  const { os, shell } = getShellInfo();

  if (os === "Windows") {
    return `IMPORTANT: You are on ${os} using ${shell}.
- Use Windows commands (dir, cd, type, copy, del, etc.)
- Do NOT use Unix commands (ls, pwd, cat, cp, rm, etc.)
- For PowerShell, you can also use cmdlets like Get-ChildItem, Get-Location, etc.`;
  }

  return `Current environment: ${os}, Shell: ${shell}. Use appropriate commands for this shell.`;
}
