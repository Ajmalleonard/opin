import type { Logger } from "../infra/logger.js";
import type {
  PipelineConditionExpr,
  PipelineContext,
  PipelineDefinition,
  PipelineEvent,
  PipelineRun,
  PipelineStep,
  PipelineAgentStep,
} from "./types.js";
import type { PipelineState } from "./service.js";
import {
  startRun,
  updateStepRun,
  completeRun,
  getRun,
} from "./service.js";

export type PipelineExecutorDeps = {
  log: Logger;
  nowMs?: () => number;
  onEvent?: (evt: PipelineEvent) => void;
  runAgentStep: (params: {
    task: string;
    model?: string;
    thinking?: string;
    role?: string;
    timeoutSeconds?: number;
    context: PipelineContext;
  }) => Promise<{ output: Record<string, unknown>; sessionKey?: string }>;
};

export type PipelineExecutor = {
  execute: (
    pipeline: PipelineDefinition,
    input?: Record<string, unknown>,
    trigger?: string,
  ) => Promise<PipelineRun>;
};

export function createPipelineExecutor(
  state: PipelineState,
  deps: PipelineExecutorDeps,
): PipelineExecutor {
  return {
    execute: async (pipeline, input, trigger) => {
      const run = await startRun(state, {
        pipelineId: pipeline.id,
        input,
        trigger: trigger as any,
      });

      try {
        const output = await executeSteps(state, deps, run, pipeline.steps, run.context);
        await completeRun(state, run.id, "completed", output);
        return (await getRun(state, run.id))!;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        deps.log.error(`Pipeline run ${run.id} failed: ${msg}`);
        await completeRun(state, run.id, "failed", undefined, msg);
        return (await getRun(state, run.id))!;
      }
    },
  };
}

async function executeSteps(
  state: PipelineState,
  deps: PipelineExecutorDeps,
  run: PipelineRun,
  steps: PipelineStep[],
  context: PipelineContext,
): Promise<Record<string, unknown>> {
  let lastOutput: Record<string, unknown> = {};

  for (const step of steps) {
    if (run.status === "cancelled") break;
    context.currentStepId = step.id;

    deps.onEvent?.({ kind: "step_started", runId: run.id, stepId: step.id });
    await updateStepRun(state, run.id, step.id, {
      status: "running",
      startedAtMs: (deps.nowMs ?? Date.now)(),
    });

    try {
      const result = await executeStep(state, deps, run, step, context);
      lastOutput = result;

      await updateStepRun(state, run.id, step.id, {
        status: "completed",
        completedAtMs: (deps.nowMs ?? Date.now)(),
        output: result,
      });
      deps.onEvent?.({ kind: "step_completed", runId: run.id, stepId: step.id, output: result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await updateStepRun(state, run.id, step.id, {
        status: "failed",
        completedAtMs: (deps.nowMs ?? Date.now)(),
        error: msg,
      });
      deps.onEvent?.({ kind: "step_failed", runId: run.id, stepId: step.id, error: msg });
      throw err;
    }
  }

  return lastOutput;
}

async function executeStep(
  state: PipelineState,
  deps: PipelineExecutorDeps,
  run: PipelineRun,
  step: PipelineStep,
  context: PipelineContext,
): Promise<Record<string, unknown>> {
  switch (step.kind) {
    case "agent":
      return executeAgentStep(state, deps, run, step, context);
    case "condition":
      return executeConditionStep(state, deps, run, step, context);
    case "parallel":
      return executeParallelStep(state, deps, run, step, context);
    case "loop":
      return executeLoopStep(state, deps, run, step, context);
  }
}

async function executeAgentStep(
  state: PipelineState,
  deps: PipelineExecutorDeps,
  run: PipelineRun,
  step: PipelineAgentStep,
  context: PipelineContext,
): Promise<Record<string, unknown>> {
  const resolvedTask = resolveTemplate(step.task, context);
  let attempt = 0;
  const maxRetries = step.retry?.maxRetries ?? 0;

  while (true) {
    try {
      const result = await deps.runAgentStep({
        task: resolvedTask,
        model: step.model,
        thinking: step.thinking,
        role: step.role,
        timeoutSeconds: step.timeoutSeconds,
        context,
      });

      context.stepOutputs[step.id] = result.output;
      if (result.sessionKey) {
        await updateStepRun(state, run.id, step.id, { sessionKey: result.sessionKey });
      }

      return result.output;
    } catch (err: unknown) {
      attempt++;
      if (attempt > maxRetries) throw err;
      const backoff = Math.min(
        step.retry?.backoffMs ?? 1000 * Math.pow(2, attempt - 1),
        step.retry?.maxBackoffMs ?? 30_000,
      );
      deps.log.warn(`Step ${step.id} attempt ${attempt} failed, retrying in ${backoff}ms`);
      await sleep(backoff);
    }
  }
}

async function executeConditionStep(
  state: PipelineState,
  deps: PipelineExecutorDeps,
  run: PipelineRun,
  step: Extract<PipelineStep, { kind: "condition" }>,
  context: PipelineContext,
): Promise<Record<string, unknown>> {
  const matched = evaluateConditions(step.conditions, context);
  deps.log.info(`Condition step ${step.id}: ${matched ? "then" : "else"}`);

  if (matched) {
    return executeSteps(state, deps, run, step.thenSteps, context);
  } else if (step.elseSteps?.length) {
    return executeSteps(state, deps, run, step.elseSteps, context);
  }
  return { condition: false };
}

async function executeParallelStep(
  state: PipelineState,
  deps: PipelineExecutorDeps,
  run: PipelineRun,
  step: Extract<PipelineStep, { kind: "parallel" }>,
  context: PipelineContext,
): Promise<Record<string, unknown>> {
  const maxConcurrency = step.maxConcurrency ?? step.steps.length;
  const results: Record<string, unknown> = {};

  for (let i = 0; i < step.steps.length; i += maxConcurrency) {
    const batch = step.steps.slice(i, i + maxConcurrency);
    const batchResults = await Promise.all(
      batch.map(async (s) => {
        const childContext = { ...context, currentStepId: s.id };
        const output = await executeStep(state, deps, run, s, childContext);
        return { id: s.id, output };
      }),
    );
    for (const r of batchResults) {
      results[r.id] = r.output;
      context.stepOutputs[r.id] = r.output;
    }
  }

  return results;
}

async function executeLoopStep(
  state: PipelineState,
  deps: PipelineExecutorDeps,
  run: PipelineRun,
  step: Extract<PipelineStep, { kind: "loop" }>,
  context: PipelineContext,
): Promise<Record<string, unknown>> {
  const collection = resolveField(step.collectionField, context);
  if (!Array.isArray(collection)) {
    throw new Error(`Loop step ${step.id}: field ${step.collectionField} is not an array`);
  }

  const maxIterations = step.maxIterations ?? collection.length;
  const items = collection.slice(0, maxIterations);
  const results: unknown[] = [];

  for (const item of items) {
    const loopContext = {
      ...context,
      variables: { ...context.variables, [step.itemVar]: item },
    };
    const output = await executeSteps(state, deps, run, step.steps, loopContext);
    results.push(output);
  }

  return { items: results };
}

function evaluateConditions(
  conditions: PipelineConditionExpr[],
  context: PipelineContext,
): boolean {
  for (const cond of conditions) {
    const value = resolveField(cond.field, context);
    const matched = evaluateSingleCondition(value, cond.operator, cond.value);
    if (!matched) return false;
  }
  return true;
}

function evaluateSingleCondition(
  value: unknown,
  operator: PipelineConditionExpr["operator"],
  expected?: unknown,
): boolean {
  switch (operator) {
    case "eq": return value === expected;
    case "neq": return value !== expected;
    case "gt": return typeof value === "number" && typeof expected === "number" && value > expected;
    case "lt": return typeof value === "number" && typeof expected === "number" && value < expected;
    case "gte": return typeof value === "number" && typeof expected === "number" && value >= expected;
    case "lte": return typeof value === "number" && typeof expected === "number" && value <= expected;
    case "contains": return typeof value === "string" && typeof expected === "string" && value.includes(expected);
    case "exists": return value !== undefined && value !== null;
    case "not_exists": return value === undefined || value === null;
    default: return false;
  }
}

function resolveField(field: string, context: PipelineContext): unknown {
  if (field.startsWith("variables.")) {
    return context.variables[field.slice("variables.".length)];
  }
  if (field.startsWith("stepOutputs.")) {
    return context.stepOutputs[field.slice("stepOutputs.".length)];
  }
  return context.variables[field] ?? context.stepOutputs[field];
}

function resolveTemplate(template: string, context: PipelineContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_match, key: string) => {
    const val = resolveField(key.trim(), context);
    if (val === undefined || val === null) return "";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
