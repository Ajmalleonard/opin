import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveStorePath } from "./paths.js";

describe("resolveStorePath", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses OPIN_HOME for tilde expansion", () => {
    vi.stubEnv("OPIN_HOME", "/srv/opin-home");
    vi.stubEnv("HOME", "/home/other");

    const resolved = resolveStorePath("~/.opin/agents/{agentId}/sessions/sessions.json", {
      agentId: "research",
    });

    expect(resolved).toBe(
      path.resolve("/srv/opin-home/.opin/agents/research/sessions/sessions.json"),
    );
  });
});
