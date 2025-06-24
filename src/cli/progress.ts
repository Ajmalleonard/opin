import { createOscProgressController, supportsOscProgress } from "osc-progress";
import {
  clearActiveProgressLine,
  registerActiveProgressLine,
  unregisterActiveProgressLine,
} from "../terminal/progress-line.js";
import { isRich, theme } from "../terminal/theme.js";

const DEFAULT_DELAY_MS = 0;
const SPINNER_INTERVAL_MS = 80;
const PROGRESS_BAR_WIDTH = 10;
let activeProgress = 0;

const SPINNER_FRAMES = ["◜", "◠", "◝", "◞", "◡", "◟"] as const;
const PULSE_FRAMES = ["·  ", "·· ", "···", " ··", "  ·", "   "] as const;

type ProgressOptions = {
  label: string;
  indeterminate?: boolean;
  total?: number;
  enabled?: boolean;
  delayMs?: number;
  stream?: NodeJS.WriteStream;
  fallback?: "spinner" | "line" | "log" | "none";
};

export type ProgressReporter = {
  setLabel: (label: string) => void;
  setPercent: (percent: number) => void;
  tick: (delta?: number) => void;
  done: () => void;
};

export type ProgressTotalsUpdate = {
  completed: number;
  total: number;
  label?: string;
};

const noopReporter: ProgressReporter = {
  setLabel: () => {},
  setPercent: () => {},
  tick: () => {},
  done: () => {},
};

function resolveProgressBadge(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("build")) {
    return "BUILD";
  }
  if (normalized.includes("fetch") || normalized.includes("download")) {
    return "FETCH";
  }
  if (
    normalized.includes("check") ||
    normalized.includes("audit") ||
    normalized.includes("health")
  ) {
    return "CHECK";
  }
  if (normalized.includes("sync") || normalized.includes("update")) {
    return "SYNC";
  }
  if (normalized.includes("install")) {
    return "INSTALL";
  }
  if (normalized.includes("start") || normalized.includes("boot")) {
    return "BOOT";
  }
  return "RUN";
}

function formatProgressLabel(label: string): string {
  const badge = resolveProgressBadge(label);
  if (!isRich()) {
    return `[${badge}] ◈ ${label}`;
  }
  return `${theme.accentBright("◈")} ${theme.heading(`[${badge}]`)} ${theme.accent(label)}`;
}

function formatProgressBar(percent: number): string {
  const filled = Math.max(
    0,
    Math.min(PROGRESS_BAR_WIDTH, Math.round((percent / 100) * PROGRESS_BAR_WIDTH)),
  );
  const empty = Math.max(0, PROGRESS_BAR_WIDTH - filled);
  const fillChars = "█".repeat(filled);
  const emptyChars = "░".repeat(empty);
  if (!isRich()) {
    return `[${fillChars}${emptyChars}]`;
  }
  return `${theme.accentBright("[")}${theme.success(fillChars)}${theme.muted(
    emptyChars,
  )}${theme.accentBright("]")}`;
}

function formatProgressSuffix(params: {
  indeterminate: boolean;
  percent: number;
  frameIndex: number;
}): string {
  if (!params.indeterminate) {
    return `${formatProgressBar(params.percent)} ${params.percent}%`;
  }
  const frame = SPINNER_FRAMES[params.frameIndex % SPINNER_FRAMES.length];
  const pulse = PULSE_FRAMES[params.frameIndex % PULSE_FRAMES.length];
  if (!isRich()) {
    return `${frame} ${pulse}`;
  }
  return `${theme.info(frame)} ${theme.muted(pulse)}`;
}

export function createCliProgress(options: ProgressOptions): ProgressReporter {
  if (options.enabled === false) {
    return noopReporter;
  }
  if (activeProgress > 0) {
    return noopReporter;
  }

  const stream = options.stream ?? process.stderr;
  const isTty = stream.isTTY;
  const allowLog = !isTty && options.fallback === "log";
  if (!isTty && !allowLog) {
    return noopReporter;
  }

  const delayMs = typeof options.delayMs === "number" ? options.delayMs : DEFAULT_DELAY_MS;
  const canOsc = isTty && supportsOscProgress(process.env, isTty);
  const allowSpinner = isTty && (options.fallback === undefined || options.fallback === "spinner");
  const allowLine = isTty && options.fallback === "line";

  let started = false;
  let label = options.label;
  const total = options.total ?? null;
  let completed = 0;
  let percent = 0;
  let frameIndex = 0;
  let indeterminate =
    options.indeterminate ?? (options.total === undefined || options.total === null);

  activeProgress += 1;
  if (isTty) {
    registerActiveProgressLine(stream);
  }

  const controller = canOsc
    ? createOscProgressController({
        env: process.env,
        isTty: stream.isTTY,
        write: (chunk: string) => stream.write(chunk),
      })
    : null;

  const renderLine =
    allowSpinner || allowLine
      ? () => {
          if (!started) {
            return;
          }
          const suffix = formatProgressSuffix({ indeterminate, percent, frameIndex });
          clearActiveProgressLine();
          stream.write(`${formatProgressLabel(label)} ${suffix}`);
        }
      : null;
  const renderLog = allowLog
    ? (() => {
        let lastLine = "";
        let lastAt = 0;
        const throttleMs = 250;
        return () => {
          if (!started) {
            return;
          }
          const suffix = formatProgressSuffix({ indeterminate, percent, frameIndex });
          const nextLine = `${formatProgressLabel(label)} ${suffix}`;
          const now = Date.now();
          if (nextLine === lastLine && now - lastAt < throttleMs) {
            return;
          }
          lastLine = nextLine;
          lastAt = now;
          stream.write(`${nextLine}\n`);
        };
      })()
    : null;
  let timer: NodeJS.Timeout | null = null;
  let spinnerTimer: NodeJS.Timeout | null = null;

  const applyState = () => {
    if (!started) {
      return;
    }
    if (controller) {
      if (indeterminate) {
        controller.setIndeterminate(label);
      } else {
        controller.setPercent(label, percent);
      }
    }
    if (renderLine) {
      renderLine();
    }
    if (renderLog) {
      renderLog();
    }
  };

  const start = () => {
    if (started) {
      return;
    }
    started = true;
    if (allowSpinner && renderLine) {
      spinnerTimer = setInterval(() => {
        frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
        renderLine();
      }, SPINNER_INTERVAL_MS);
    }
    applyState();
  };

  if (delayMs === 0) {
    start();
  } else {
    timer = setTimeout(start, delayMs);
  }

  const setLabel = (next: string) => {
    label = next;
    applyState();
  };

  const setPercent = (nextPercent: number) => {
    percent = Math.max(0, Math.min(100, Math.round(nextPercent)));
    indeterminate = false;
    applyState();
  };

  const tick = (delta = 1) => {
    if (!total) {
      return;
    }
    completed = Math.min(total, completed + delta);
    const nextPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    setPercent(nextPercent);
  };

  const done = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (!started) {
      activeProgress = Math.max(0, activeProgress - 1);
      return;
    }
    if (controller) {
      controller.clear();
    }
    if (spinnerTimer) {
      clearInterval(spinnerTimer);
      spinnerTimer = null;
    }
    clearActiveProgressLine();
    if (isTty) {
      unregisterActiveProgressLine(stream);
    }
    activeProgress = Math.max(0, activeProgress - 1);
  };

  return { setLabel, setPercent, tick, done };
}

export async function withProgress<T>(
  options: ProgressOptions,
  work: (progress: ProgressReporter) => Promise<T>,
): Promise<T> {
  const progress = createCliProgress(options);
  try {
    return await work(progress);
  } finally {
    progress.done();
  }
}

export async function withProgressTotals<T>(
  options: ProgressOptions,
  work: (update: (update: ProgressTotalsUpdate) => void, progress: ProgressReporter) => Promise<T>,
): Promise<T> {
  return await withProgress(options, async (progress) => {
    const update = ({ completed, total, label }: ProgressTotalsUpdate) => {
      if (label) {
        progress.setLabel(label);
      }
      if (!Number.isFinite(total) || total <= 0) {
        return;
      }
      progress.setPercent((completed / total) * 100);
    };
    return await work(update, progress);
  });
}
