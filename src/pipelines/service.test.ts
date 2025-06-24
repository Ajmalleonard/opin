import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createPipelineState, addPipeline, listPipelines, getPipeline, removePipeline, startRun, getRun, listRuns, completeRun, cancelRun } from "./service.js";

let tmpDir: string;
let storePath: string;

const noopLog = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pipeline-svc-test-"));
  storePath = path.join(tmpDir, "pipelines.json");
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

function makeDeps() {
  return { storePath, log: noopLog, nowMs: () => 1000 };
}

describe("addPipeline / listPipelines / getPipeline", () => {
  it("adds and retrieves a pipeline", async () => {
    const state = createPipelineState(makeDeps());
    const p = await addPipeline(state, {
      id: "p1",
      name: "Test Pipeline",
      steps: [{ kind: "agent", id: "s1", task: "do something" }],
    });
    expect(p.id).toBe("p1");
    expect(p.createdAtMs).toBe(1000);

    const listed = await listPipelines(state);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.name).toBe("Test Pipeline");

    const fetched = await getPipeline(state, "p1");
    expect(fetched?.id).toBe("p1");
  });

  it("returns null for missing pipeline", async () => {
    const state = createPipelineState(makeDeps());
    const result = await getPipeline(state, "missing");
    expect(result).toBeNull();
  });
});

describe("removePipeline", () => {
  it("removes pipeline and its runs", async () => {
    const state = createPipelineState(makeDeps());
    await addPipeline(state, { id: "p1", name: "P1", steps: [] });
    await startRun(state, { pipelineId: "p1" });
    const removed = await removePipeline(state, "p1");
    expect(removed).toBe(true);
    expect(await listPipelines(state)).toHaveLength(0);
    expect(await listRuns(state)).toHaveLength(0);
  });

  it("returns false for missing pipeline", async () => {
    const state = createPipelineState(makeDeps());
    expect(await removePipeline(state, "missing")).toBe(false);
  });
});

describe("startRun / getRun / listRuns", () => {
  it("starts a run and retrieves it", async () => {
    const state = createPipelineState(makeDeps());
    await addPipeline(state, { id: "p1", name: "P1", steps: [] });
    const run = await startRun(state, { pipelineId: "p1", input: { key: "value" } });
    expect(run.status).toBe("running");
    expect(run.input).toEqual({ key: "value" });
    expect(run.context.variables).toEqual({ key: "value" });

    const fetched = await getRun(state, run.id);
    expect(fetched?.id).toBe(run.id);

    const allRuns = await listRuns(state);
    expect(allRuns).toHaveLength(1);

    const filtered = await listRuns(state, "p1");
    expect(filtered).toHaveLength(1);
  });

  it("throws for missing pipeline", async () => {
    const state = createPipelineState(makeDeps());
    await expect(startRun(state, { pipelineId: "missing" })).rejects.toThrow("Pipeline not found");
  });
});

describe("completeRun", () => {
  it("marks run as completed with output", async () => {
    const state = createPipelineState(makeDeps());
    await addPipeline(state, { id: "p1", name: "P1", steps: [] });
    const run = await startRun(state, { pipelineId: "p1" });
    await completeRun(state, run.id, "completed", { result: "ok" });
    const updated = await getRun(state, run.id);
    expect(updated?.status).toBe("completed");
    expect(updated?.output).toEqual({ result: "ok" });
    expect(updated?.completedAtMs).toBe(1000);
  });

  it("marks run as failed with error", async () => {
    const state = createPipelineState(makeDeps());
    await addPipeline(state, { id: "p1", name: "P1", steps: [] });
    const run = await startRun(state, { pipelineId: "p1" });
    await completeRun(state, run.id, "failed", undefined, "step s1 failed");
    const updated = await getRun(state, run.id);
    expect(updated?.status).toBe("failed");
    expect(updated?.error).toBe("step s1 failed");
  });
});

describe("cancelRun", () => {
  it("cancels a running pipeline", async () => {
    const state = createPipelineState(makeDeps());
    await addPipeline(state, { id: "p1", name: "P1", steps: [] });
    const run = await startRun(state, { pipelineId: "p1" });
    const cancelled = await cancelRun(state, run.id);
    expect(cancelled).toBe(true);
    const updated = await getRun(state, run.id);
    expect(updated?.status).toBe("cancelled");
  });

  it("returns false for non-running pipeline", async () => {
    const state = createPipelineState(makeDeps());
    await addPipeline(state, { id: "p1", name: "P1", steps: [] });
    const run = await startRun(state, { pipelineId: "p1" });
    await completeRun(state, run.id, "completed");
    expect(await cancelRun(state, run.id)).toBe(false);
  });
});

describe("events", () => {
  it("emits run_started and run_completed events", async () => {
    const events: unknown[] = [];
    const state = createPipelineState({
      ...makeDeps(),
      onEvent: (evt) => events.push(evt),
    });
    await addPipeline(state, { id: "p1", name: "P1", steps: [] });
    const run = await startRun(state, { pipelineId: "p1" });
    await completeRun(state, run.id, "completed", { ok: true });
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ kind: "run_started", runId: run.id });
    expect(events[1]).toMatchObject({ kind: "run_completed", runId: run.id });
  });
});
