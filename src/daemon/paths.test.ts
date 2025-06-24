import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveGatewayStateDir } from "./paths.js";

describe("resolveGatewayStateDir", () => {
  it("uses the default state dir when no overrides are set", () => {
    const env = { HOME: "/Users/test" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".opin"));
  });

  it("appends the profile suffix when set", () => {
    const env = { HOME: "/Users/test", OPIN_PROFILE: "rescue" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".opin-rescue"));
  });

  it("treats default profiles as the base state dir", () => {
    const env = { HOME: "/Users/test", OPIN_PROFILE: "Default" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".opin"));
  });

  it("uses OPIN_STATE_DIR when provided", () => {
    const env = { HOME: "/Users/test", OPIN_STATE_DIR: "/var/lib/opin" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/var/lib/opin"));
  });

  it("falls back to OPIN_STATE_DIR when OPIN_STATE_DIR is missing", () => {
    const env = { HOME: "/Users/test", OPIN_STATE_DIR: "/var/lib/opin" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/var/lib/opin"));
  });

  it("expands ~ in OPIN_STATE_DIR", () => {
    const env = { HOME: "/Users/test", OPIN_STATE_DIR: "~/opin-state" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/Users/test/opin-state"));
  });

  it("preserves Windows absolute paths without HOME", () => {
    const env = { OPIN_STATE_DIR: "C:\\State\\opin" };
    expect(resolveGatewayStateDir(env)).toBe("C:\\State\\opin");
  });
});
