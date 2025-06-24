export type Logger = {
  debug: (obj: unknown, msg?: string) => void;
  info: (obj: unknown, msg?: string) => void;
  warn: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
};

export function createConsoleLogger(prefix?: string): Logger {
  const p = prefix ? `[${prefix}] ` : "";
  return {
    debug: () => {},
    info: (obj, msg) => {
      if (msg) console.log(`${p}${msg}`, typeof obj === "string" ? obj : "");
      else console.log(`${p}${typeof obj === "string" ? obj : JSON.stringify(obj)}`);
    },
    warn: (obj, msg) => {
      if (msg) console.warn(`${p}${msg}`, typeof obj === "string" ? obj : "");
      else console.warn(`${p}${typeof obj === "string" ? obj : JSON.stringify(obj)}`);
    },
    error: (obj, msg) => {
      if (msg) console.error(`${p}${msg}`, typeof obj === "string" ? obj : "");
      else console.error(`${p}${typeof obj === "string" ? obj : JSON.stringify(obj)}`);
    },
  };
}

export const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};
