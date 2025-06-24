import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createPipelineState, addPipeline } from "./service.js";
import { createPipelineExecutor } from "./executor.js";

let tmpDir: string;
let storePath: string;

const noopLog = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pipeline-exec-test-"));
  storePath = path.join(tmpDir, "pipelines.json");
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

function makeDeps(runAgentStep?: (params: any) => Promise<any>) {
  return {
    log: noopLog,
    nowMs: () => 1000,
    runAgentStep: runAgentStep ?? vi.fn(async () => ({ output: { result: "done" } })),
  };
}

describe("executor - single agent step", () => {
  it("executes a single agent step and completes", async () => {
    const state = createPipelineState({ storePath, log: noopLog });
    const agentStep = vi.fn(async () => ({ output: { answer: 42 } }));
    const executor = createPipelineExecutor(state, makeDeps(agentStep));

    await addPipeline(state, {
      id: "p1",
      name: "Simple",
      steps: [{ kind: "agent", id: "s1", task: "calculate" }],
    });

    const run = await executor.execute({ id: "p1", name: "Simple", steps: [{ kind: "agent", id: "s1", task: "calculate" }] });
    expect(run.status).toBe("completed");
    expect(run.steps).toHaveLength(1);
    expect(run.steps[0]?.status).toBe("completed");
    expect(run.steps[0]?.output).toEqual({ answer: 42 });
    expect(agentStep).toHaveBeenCalledWith(expect.objectContaining({ task: "calculate" }));
  });
});

describe("executor - multiple sequential steps", () => {
  it("chains steps and passes context", async () => {
    const state = createPipelineState({ storePath, log: noopLog });
    const agentStep = vi.fn(async (params: any) => {
      if (params.task.includes("step1")) return { output: { value: 10 } };
      return { output: { final: true } };
    });
    const executor = createPipelineExecutor(state, makeDeps(agentStep));

    const pipeline = {
      id: "p1",
      name: "Chain",
      steps: [
        { kind: "agent" as const, id: "s1", task: "step1" },
        { kind: "agent" as const, id: "s2", task: "step2 uses {{stepOutputs.s1}}" },
      ],
    };
    await addPipeline(state, pipeline);

    const run = await executor.execute(pipeline);
    expect(run.status).toBe("completed");
    expect(run.steps).toHaveLength(2);
    expect(run.steps[0]?.status).toBe("completed");
    expect(run.steps[1]?.status).toBe("completed");
  });
});

describe("executor - condition step", () => {
  it("executes then branch when condition matches", async () => {
    const state = createPipelineState({ storePath, log: noopLog });
    const agentStep = vi.fn(async () => ({ output: { ok: true } }));
    const executor = createPipelineExecutor(state, makeDeps(agentStep));

    const pipeline = {
      id: "p1",
      name: "Conditional",
      steps: [
        {
          kind: "condition" as const,
          id: "c1",
          conditions: [{ field: "variables.runDeploy", operator: "eq" as const, value: true }],
          thenSteps: [
            { kind: "agent" as const, id: "deploy", task: "deploying" },
          ],
          elseSteps: [
            { kind: "agent" as const, id: "skip", task: "skipping" },
          ],
        },
      ],
    };
    await addPipeline(state, pipeline);

    const run = await executor.execute(pipeline, { runDeploy: true });
    expect(run.status).toBe("completed");
    expect(agentStep).toHaveBeenCalledWith(expect.objectContaining({ task: "deploying" }));
  });

  it("executes else branch when condition does not match", async () => {
    const state = createPipelineState({ storePath, log: noopLog });
    const agentStep = vi.fn(async () => ({ output: { ok: true } }));
    const executor = createPipelineExecutor(state, makeDeps(agentStep));

    const pipeline = {
      id: "p1",
      name: "Conditional",
      steps: [
        {
          kind: "condition" as const,
          id: "c1",
          conditions: [{ field: "variables.runDeploy", operator: "eq" as const, value: true }],
          thenSteps: [{ kind: "agent" as const, id: "deploy", task: "deploying" }],
          elseSteps: [{ kind: "agent" as const, id: "skip", task: "skipping" }],
        },
      ],
    };
    await addPipeline(state, pipeline);

    const run = await executor.execute(pipeline, { runDeploy: false });
    expect(run.status).toBe("completed");
    expect(agentStep).toHaveBeenCalledWith(expect.objectContaining({ task: "skipping" }));
  });
});

describe("executor - parallel step", () => {
  it("runs parallel steps concurrently", async () => {
    const state = createPipelineState({ storePath, log: noopLog });
    const executionOrder: string[] = [];
    const agentStep = vi.fn(async (params: any) => {
      executionOrder.push(params.task);
      return { output: { task: params.task } };
    });
    const executor = createPipelineExecutor(state, makeDeps(agentStep));

    const pipeline = {
      id: "p1",
      name: "Parallel",
      steps: [
        {
          kind: "parallel" as const,
          id: "par1",
          steps: [
            { kind: "agent" as const, id: "a", task: "taskA" },
            { kind: "agent" as const, id: "b", task: "taskB" },
          ],
        },
      ],
    };
    await addPipeline(state, pipeline);

    const run = await executor.execute(pipeline);
    expect(run.status).toBe("completed");
    expect(executionOrder).toContain("taskA");
    expect(executionOrder).toContain("taskB");
  });
});

describe("executor - loop step", () => {
  it("iterates over array items", async () => {
    const state = createPipelineState({ storePath, log: noopLog });
    const processed: unknown[] = [];
    const agentStep = vi.fn(async (params: any) => {
      processed.push(params.context.variables.item);
      return { output: { processed: params.context.variables.item } };
    });
    const executor = createPipelineExecutor(state, makeDeps(agentStep));

    const pipeline = {
      id: "p1",
      name: "Loop",
      steps: [
        {
          kind: "loop" as const,
          id: "l1",
          collectionField: "variables.items",
          itemVar: "item",
          steps: [
            { kind: "agent" as const, id: "proc", task: "process {{item}}" },
          ],
        },
      ],
    };
    await addPipeline(state, pipeline);

    const run = await executor.execute(pipeline, { items: ["a", "b", "c"] });
    expect(run.status).toBe("completed");
    expect(processed).toEqual(["a", "b", "c"]);
  });
});

describe("executor - retry policy", () => {
  it("retries failed steps up to maxRetries", async () => {
    const state = createPipelineState({ storePath, log: noopLog });
    let attempts = 0;
    const agentStep = vi.fn(async () => {
      attempts++;
      if (attempts < 3) throw new Error("transient failure");
      return { output: { success: true } };
    });
    const executor = createPipelineExecutor(state, makeDeps(agentStep));

    const pipeline = {
      id: "p1",
      name: "Retry",
      steps: [
        {
          kind: "agent" as const,
          id: "s1",
          task: "flaky task",
          retry: { maxRetries: 3, backoffMs: 1, maxBackoffMs: 1 },
        },
      ],
    };
    await addPipeline(state, pipeline);

    const run = await executor.execute(pipeline);
    expect(run.status).toBe("completed");
    expect(attempts).toBe(3);
  });

  it("fails after exhausting retries", async () => {
    const state = createPipelineState({ storePath, log: noopLog });
    const agentStep = vi.fn(async () => {
      throw new Error("permanent failure");
    });
    const executor = createPipelineExecutor(state, makeDeps(agentStep));

    const pipeline = {
      id: "p1",
      name: "Fail",
      steps: [
        {
          kind: "agent" as const,
          id: "s1",
          task: "doomed task",
          retry: { maxRetries: 2, backoffMs: 1, maxBackoffMs: 1 },
        },
      ],
    };
    await addPipeline(state, pipeline);

    const run = await executor.execute(pipeline);
    expect(run.status).toBe("failed");
    expect(run.error).toBe("permanent failure");
    expect(agentStep).toHaveBeenCalledTimes(3);
  });
});

describe("executor - template resolution", () => {
  it("resolves variable templates in task", async () => {
    const state = createPipelineState({ storePath, log: noopLog });
    let receivedTask = "";
    const agentStep = vi.fn(async (params: any) => {
      receivedTask = params.task;
      return { output: {} };
    });
    const executor = createPipelineExecutor(state, makeDeps(agentStep));

    const pipeline = {
      id: "p1",
      name: "Template",
      steps: [
        { kind: "agent" as const, id: "s1", task: "deploy {{variables.env}} to {{variables.region}}" },
      ],
    };
    await addPipeline(state, pipeline);

    await executor.execute(pipeline, { env: "prod", region: "us-east-1" });
    expect(receivedTask).toBe("deploy prod to us-east-1");
  });
});

describe("executor - event emission", () => {
  it("emits step lifecycle events", async () => {
    const events: unknown[] = [];
    const state = createPipelineState({ storePath, log: noopLog, onEvent: (e) => events.push(e) });
    const agentStep = vi.fn(async () => ({ output: { ok: true } }));
    const executor = createPipelineExecutor(state, { ...makeDeps(agentStep), onEvent: (e) => events.push(e) });

    const pipeline = {
      id: "p1",
      name: "Events",
      steps: [{ kind: "agent" as const, id: "s1", task: "do" }],
    };
    await addPipeline(state, pipeline);

    await executor.execute(pipeline);
    const kinds = events.map((e: any) => e.kind);
    expect(kinds).toContain("run_started");
    expect(kinds).toContain("step_started");
    expect(kinds).toContain("step_completed");
    expect(kinds).toContain("run_completed");
  });
});
