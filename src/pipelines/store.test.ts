import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadPipelineStore, savePipelineStore } from "./store.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pipeline-store-test-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("loadPipelineStore", () => {
  it("returns empty store when file does not exist", async () => {
    const store = await loadPipelineStore(path.join(tmpDir, "missing.json"));
    expect(store).toEqual({ pipelines: {}, runs: {} });
  });

  it("loads existing store file", async () => {
    const filePath = path.join(tmpDir, "store.json");
    const data = {
      pipelines: { p1: { id: "p1", name: "test", steps: [] } },
      runs: { r1: { id: "r1", pipelineId: "p1", status: "completed", steps: [], context: { variables: {}, stepOutputs: {}, runId: "r1", pipelineId: "p1" } } },
    };
    await fs.writeFile(filePath, JSON.stringify(data), "utf-8");
    const store = await loadPipelineStore(filePath);
    expect(store.pipelines.p1?.name).toBe("test");
    expect(store.runs.r1?.status).toBe("completed");
  });

  it("handles corrupted JSON gracefully", async () => {
    const filePath = path.join(tmpDir, "bad.json");
    await fs.writeFile(filePath, "not json", "utf-8");
    await expect(loadPipelineStore(filePath)).rejects.toThrow();
  });
});

describe("savePipelineStore", () => {
  it("creates directory and writes file", async () => {
    const filePath = path.join(tmpDir, "sub", "store.json");
    await savePipelineStore(filePath, { pipelines: {}, runs: {} });
    const raw = await fs.readFile(filePath, "utf-8");
    expect(JSON.parse(raw)).toEqual({ pipelines: {}, runs: {} });
  });

  it("creates backup file", async () => {
    const filePath = path.join(tmpDir, "store.json");
    await savePipelineStore(filePath, { pipelines: {}, runs: {} });
    const backup = await fs.readFile(`${filePath}.bak`, "utf-8");
    expect(JSON.parse(backup)).toEqual({ pipelines: {}, runs: {} });
  });

  it("round-trips data correctly", async () => {
    const filePath = path.join(tmpDir, "store.json");
    const data = {
      pipelines: { p1: { id: "p1", name: "My Pipeline", steps: [] } },
      runs: {},
    };
    await savePipelineStore(filePath, data);
    const loaded = await loadPipelineStore(filePath);
    expect(loaded.pipelines.p1?.name).toBe("My Pipeline");
  });
});
