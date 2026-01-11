import { emitKeypressEvents } from "node:readline";

const ESC = "\x1b";

export interface KeyboardController {
  abort: () => void;
  cleanup: () => void;
}

export interface InterruptibleControllerOptions {
  onInterrupt?: () => void;
}

/**
 * Setup keyboard listener for Ctrl+C and ESC
 * @param onInterrupt - Called when Ctrl+C or ESC is pressed
 * @returns Controller with abort and cleanup functions
 */
export function setupKeyboardListener(onInterrupt: () => void): KeyboardController {
  const abortController = new AbortController();

  // Only setup if stdin is a TTY
  if (!process.stdin.isTTY) {
    return {
      abort: () => abortController.abort(),
      cleanup: () => {},
    };
  }

  // Enable keypress events
  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  const keypressHandler = (
    _str: string,
    key: { name?: string; ctrl?: boolean; sequence?: string }
  ) => {
    // Ctrl+C
    if (key.ctrl && key.name === "c") {
      onInterrupt();
    }
    // ESC key
    if (key.sequence === ESC) {
      onInterrupt();
    }
  };

  process.stdin.on("keypress", keypressHandler);

  const cleanup = () => {
    process.stdin.removeListener("keypress", keypressHandler);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
  };

  return {
    abort: () => {
      abortController.abort();
      cleanup();
    },
    cleanup,
  };
}

/**
 * Create an abort controller with keyboard interrupt support
 */
export function createInterruptibleController(options?: InterruptibleControllerOptions): {
  controller: AbortController;
  keyboard: KeyboardController;
} {
  const controller = new AbortController();
  const keyboard = setupKeyboardListener(() => {
    options?.onInterrupt?.();
    controller.abort();
  });

  return { controller, keyboard };
}
