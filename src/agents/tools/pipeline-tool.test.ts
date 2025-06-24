import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createPipelineState, addPipeline } from "../../pipelines/service.js";
import { registerIdentity, addContact, clearAll } from "../agent-identity.js";
import { createPipelineTool } from "./pipeline-tool.js";

let tmpDir: string;
let storePath: string;

const noopLog = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pipeline-tool-test-"));
  storePath = path.join(tmpDir, "pipelines.json");
  clearAll();
});

async function makeTool() {
  const state = createPipelineState({ storePath, log: noopLog });
  return { tool: createPipelineTool({ state }), state };
}

describe("pipeline tool - list", () => {
  it("lists pipelines", async () => {
    const { tool, state } = await makeTool();
    await addPipeline(state, { id: "p1", name: "Test", steps: [] });
    const result = await tool.execute("call1", { action: "list" });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.pipelines).toHaveLength(1);
  });
});

describe("pipeline tool - create", () => {
  it("creates a pipeline", async () => {
    const { tool } = await makeTool();
    const result = await tool.execute("call1", {
      action: "create",
      pipelineId: "p1",
      name: "My Pipeline",
      steps: [{ kind: "agent", id: "s1", task: "do stuff" }],
    });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.created).toBe(true);
    expect(parsed.pipeline.name).toBe("My Pipeline");
  });
});

describe("pipeline tool - run", () => {
  it("starts a run", async () => {
    const { tool, state } = await makeTool();
    await addPipeline(state, { id: "p1", name: "Test", steps: [] });
    const result = await tool.execute("call1", {
      action: "run",
      pipelineId: "p1",
      input: { key: "value" },
    });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.run.status).toBe("running");
    expect(parsed.run.input).toEqual({ key: "value" });
  });
});

describe("pipeline tool - roles", () => {
  it("lists roles", async () => {
    const { tool } = await makeTool();
    const result = await tool.execute("call1", { action: "roles" });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.roles.length).toBeGreaterThanOrEqual(9);
    expect(parsed.roles.some((r: any) => r.id === "ceo")).toBe(true);
  });

  it("gets specific role", async () => {
    const { tool } = await makeTool();
    const result = await tool.execute("call1", { action: "roles", role: "cto" });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.role.name).toBe("CTO");
  });
});

describe("pipeline tool - identity", () => {
  it("lists identities", async () => {
    registerIdentity({ agentId: "a1", name: "Atlas", role: "ceo", createdAtMs: 1 });
    const { tool } = await makeTool();
    const result = await tool.execute("call1", { action: "identity" });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.identities).toHaveLength(1);
  });

  it("gets specific identity", async () => {
    registerIdentity({ agentId: "a1", name: "Atlas", role: "ceo", createdAtMs: 1 });
    const { tool } = await makeTool();
    const result = await tool.execute("call1", { action: "identity", agentId: "a1" });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.identity.name).toBe("Atlas");
  });
});

describe("pipeline tool - contacts", () => {
  it("lists contacts", async () => {
    addContact("a1", { agentId: "a2", name: "Bolt", role: "engineer", status: "active" });
    const { tool } = await makeTool();
    const result = await tool.execute("call1", { action: "contacts", agentId: "a1" });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.contacts).toHaveLength(1);
  });

  it("adds a contact", async () => {
    const { tool } = await makeTool();
    const result = await tool.execute("call1", {
      action: "contacts",
      agentId: "a1",
      contactId: "a2",
      contactName: "Bolt",
      contactRole: "engineer",
    });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.added).toBe(true);
  });
});
