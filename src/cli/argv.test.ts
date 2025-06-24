import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it("detects help/version flags", () => {
    expect(hasHelpOrVersion(["node", "opin", "--help"])).toBe(true);
    expect(hasHelpOrVersion(["node", "opin", "-V"])).toBe(true);
    expect(hasHelpOrVersion(["node", "opin", "status"])).toBe(false);
  });

  it("extracts command path ignoring flags and terminator", () => {
    expect(getCommandPath(["node", "opin", "status", "--json"], 2)).toEqual(["status"]);
    expect(getCommandPath(["node", "opin", "agents", "list"], 2)).toEqual(["agents", "list"]);
    expect(getCommandPath(["node", "opin", "status", "--", "ignored"], 2)).toEqual(["status"]);
  });

  it("returns primary command", () => {
    expect(getPrimaryCommand(["node", "opin", "agents", "list"])).toBe("agents");
    expect(getPrimaryCommand(["node", "opin"])).toBeNull();
  });

  it("parses boolean flags and ignores terminator", () => {
    expect(hasFlag(["node", "opin", "status", "--json"], "--json")).toBe(true);
    expect(hasFlag(["node", "opin", "--", "--json"], "--json")).toBe(false);
  });

  it("extracts flag values with equals and missing values", () => {
    expect(getFlagValue(["node", "opin", "status", "--timeout", "5000"], "--timeout")).toBe("5000");
    expect(getFlagValue(["node", "opin", "status", "--timeout=2500"], "--timeout")).toBe("2500");
    expect(getFlagValue(["node", "opin", "status", "--timeout"], "--timeout")).toBeNull();
    expect(getFlagValue(["node", "opin", "status", "--timeout", "--json"], "--timeout")).toBe(null);
    expect(getFlagValue(["node", "opin", "--", "--timeout=99"], "--timeout")).toBeUndefined();
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "opin", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "opin", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "opin", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it("parses positive integer flag values", () => {
    expect(getPositiveIntFlagValue(["node", "opin", "status"], "--timeout")).toBeUndefined();
    expect(
      getPositiveIntFlagValue(["node", "opin", "status", "--timeout"], "--timeout"),
    ).toBeNull();
    expect(
      getPositiveIntFlagValue(["node", "opin", "status", "--timeout", "5000"], "--timeout"),
    ).toBe(5000);
    expect(
      getPositiveIntFlagValue(["node", "opin", "status", "--timeout", "nope"], "--timeout"),
    ).toBeUndefined();
  });

  it("builds parse argv from raw args", () => {
    const nodeArgv = buildParseArgv({
      programName: "opin",
      rawArgs: ["node", "opin", "status"],
    });
    expect(nodeArgv).toEqual(["node", "opin", "status"]);

    const versionedNodeArgv = buildParseArgv({
      programName: "opin",
      rawArgs: ["node-22", "opin", "status"],
    });
    expect(versionedNodeArgv).toEqual(["node-22", "opin", "status"]);

    const versionedNodeWindowsArgv = buildParseArgv({
      programName: "opin",
      rawArgs: ["node-22.2.0.exe", "opin", "status"],
    });
    expect(versionedNodeWindowsArgv).toEqual(["node-22.2.0.exe", "opin", "status"]);

    const versionedNodePatchlessArgv = buildParseArgv({
      programName: "opin",
      rawArgs: ["node-22.2", "opin", "status"],
    });
    expect(versionedNodePatchlessArgv).toEqual(["node-22.2", "opin", "status"]);

    const versionedNodeWindowsPatchlessArgv = buildParseArgv({
      programName: "opin",
      rawArgs: ["node-22.2.exe", "opin", "status"],
    });
    expect(versionedNodeWindowsPatchlessArgv).toEqual(["node-22.2.exe", "opin", "status"]);

    const versionedNodeWithPathArgv = buildParseArgv({
      programName: "opin",
      rawArgs: ["/usr/bin/node-22.2.0", "opin", "status"],
    });
    expect(versionedNodeWithPathArgv).toEqual(["/usr/bin/node-22.2.0", "opin", "status"]);

    const nodejsArgv = buildParseArgv({
      programName: "opin",
      rawArgs: ["nodejs", "opin", "status"],
    });
    expect(nodejsArgv).toEqual(["nodejs", "opin", "status"]);

    const nonVersionedNodeArgv = buildParseArgv({
      programName: "opin",
      rawArgs: ["node-dev", "opin", "status"],
    });
    expect(nonVersionedNodeArgv).toEqual(["node", "opin", "node-dev", "opin", "status"]);

    const directArgv = buildParseArgv({
      programName: "opin",
      rawArgs: ["opin", "status"],
    });
    expect(directArgv).toEqual(["node", "opin", "status"]);

    const bunArgv = buildParseArgv({
      programName: "opin",
      rawArgs: ["bun", "src/entry.ts", "status"],
    });
    expect(bunArgv).toEqual(["bun", "src/entry.ts", "status"]);
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "opin",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "opin", "status"]);
  });

  it("decides when to migrate state", () => {
    expect(shouldMigrateState(["node", "opin", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "opin", "health"])).toBe(false);
    expect(shouldMigrateState(["node", "opin", "sessions"])).toBe(false);
    expect(shouldMigrateState(["node", "opin", "memory", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "opin", "agent", "--message", "hi"])).toBe(false);
    expect(shouldMigrateState(["node", "opin", "agents", "list"])).toBe(true);
    expect(shouldMigrateState(["node", "opin", "message", "send"])).toBe(true);
  });

  it("reuses command path for migrate state decisions", () => {
    expect(shouldMigrateStateFromPath(["status"])).toBe(false);
    expect(shouldMigrateStateFromPath(["agents", "list"])).toBe(true);
  });
});
