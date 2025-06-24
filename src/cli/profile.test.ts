import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs(["node", "opin", "gateway", "--dev", "--allow-unconfigured"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "opin", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "opin", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "opin", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "opin", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "opin", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "opin", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (dev first)", () => {
    const res = parseCliProfileArgs(["node", "opin", "--dev", "--profile", "work", "status"]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (profile first)", () => {
    const res = parseCliProfileArgs(["node", "opin", "--profile", "work", "--dev", "status"]);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".opin-dev");
    expect(env.OPIN_PROFILE).toBe("dev");
    expect(env.OPIN_PROFILE).toBe("dev");
    expect(env.OPIN_STATE_DIR).toBe(expectedStateDir);
    expect(env.OPIN_STATE_DIR).toBe(expectedStateDir);
    expect(env.OPIN_CONFIG_PATH).toBe(path.join(expectedStateDir, "opin.json"));
    expect(env.OPIN_CONFIG_PATH).toBe(path.join(expectedStateDir, "opin.json"));
    expect(env.OPIN_GATEWAY_PORT).toBe("19001");
    expect(env.OPIN_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      OPIN_STATE_DIR: "/custom",
      OPIN_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.OPIN_STATE_DIR).toBe("/custom");
    expect(env.OPIN_STATE_DIR).toBe("/custom");
    expect(env.OPIN_GATEWAY_PORT).toBe("19099");
    expect(env.OPIN_GATEWAY_PORT).toBe("19099");
    expect(env.OPIN_CONFIG_PATH).toBe(path.join("/custom", "opin.json"));
    expect(env.OPIN_CONFIG_PATH).toBe(path.join("/custom", "opin.json"));
  });

  it("uses OPIN_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      OPIN_HOME: "/srv/opin-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/opin-home");
    expect(env.OPIN_STATE_DIR).toBe(path.join(resolvedHome, ".opin-work"));
    expect(env.OPIN_CONFIG_PATH).toBe(path.join(resolvedHome, ".opin-work", "opin.json"));
  });
});

describe("formatCliCommand", () => {
  it("returns command unchanged when no profile is set", () => {
    expect(formatCliCommand("opin doctor --fix", {})).toBe("opin doctor --fix");
  });

  it("returns command unchanged when profile is default", () => {
    expect(formatCliCommand("opin doctor --fix", { OPIN_PROFILE: "default" })).toBe(
      "opin doctor --fix",
    );
  });

  it("returns command unchanged when profile is Default (case-insensitive)", () => {
    expect(formatCliCommand("opin doctor --fix", { OPIN_PROFILE: "Default" })).toBe(
      "opin doctor --fix",
    );
  });

  it("returns command unchanged when profile is invalid", () => {
    expect(formatCliCommand("opin doctor --fix", { OPIN_PROFILE: "bad profile" })).toBe(
      "opin doctor --fix",
    );
  });

  it("returns command unchanged when --profile is already present", () => {
    expect(formatCliCommand("opin --profile work doctor --fix", { OPIN_PROFILE: "work" })).toBe(
      "opin --profile work doctor --fix",
    );
  });

  it("returns command unchanged when --dev is already present", () => {
    expect(formatCliCommand("opin --dev doctor", { OPIN_PROFILE: "dev" })).toBe(
      "opin --dev doctor",
    );
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("opin doctor --fix", { OPIN_PROFILE: "work" })).toBe(
      "opin --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("opin doctor --fix", { OPIN_PROFILE: "  jbopin  " })).toBe(
      "opin --profile jbopin doctor --fix",
    );
  });

  it("handles command with no args after opin", () => {
    expect(formatCliCommand("opin", { OPIN_PROFILE: "test" })).toBe("opin --profile test");
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm opin doctor", { OPIN_PROFILE: "work" })).toBe(
      "pnpm opin --profile work doctor",
    );
  });
});
