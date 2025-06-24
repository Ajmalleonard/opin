import type { Logger } from "../infra/logger.js";
import path from "node:path";
import os from "node:os";
import { createPipelineState, addPipeline, listPipelines, getPipeline, removePipeline, startRun, getRun, listRuns, cancelRun, completeRun } from "../pipelines/service.js";
import { listRoles, getRole } from "../agents/roles.js";
import { listIdentities, getIdentity, registerIdentity, clearAll } from "../agents/agent-identity.js";
import type { PipelineCreate, PipelineStep } from "../pipelines/types.js";

export type PipelineCommandOpts = {
  json?: boolean;
  storePath?: string;
};

function defaultStorePath(): string {
  return path.join(os.homedir(), ".opin", "pipelines.json");
}

function createLogger(): Logger {
  return {
    debug: () => {},
    info: () => {},
    warn: (...args: unknown[]) => console.warn("[pipeline]", ...args),
    error: (...args: unknown[]) => console.error("[pipeline]", ...args),
  };
}

function output(data: unknown, json?: boolean): void {
  if (json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    printTable(data);
  }
}

function printTable(data: unknown): void {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      console.log("  (none)");
      return;
    }
    for (const item of data) {
      if (typeof item === "object" && item !== null) {
        const obj = item as Record<string, unknown>;
        const lines = Object.entries(obj)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `  ${k}: ${formatValue(v)}`);
        console.log(lines.join("\n"));
        console.log("");
      } else {
        console.log(`  ${String(item)}`);
      }
    }
  } else if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        console.log(`  ${k}: ${formatValue(v)}`);
      }
    }
  } else {
    console.log(String(data));
  }
}

function formatValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object" && v !== null) return JSON.stringify(v);
  return String(v);
}

export async function pipelineListCommand(opts: PipelineCommandOpts): Promise<void> {
  const state = createPipelineState({ storePath: opts.storePath ?? defaultStorePath(), log: createLogger() });
  const pipelines = await listPipelines(state);
  output(pipelines.map((p) => ({ id: p.id, name: p.name, steps: p.steps.length, description: p.description })), opts.json);
}

export async function pipelineGetCommand(id: string, opts: PipelineCommandOpts): Promise<void> {
  const state = createPipelineState({ storePath: opts.storePath ?? defaultStorePath(), log: createLogger() });
  const pipeline = await getPipeline(state, id);
  if (!pipeline) {
    console.error(`Pipeline not found: ${id}`);
    process.exit(1);
  }
  output(pipeline, opts.json);
}

export async function pipelineCreateCommand(
  params: { id: string; name: string; description?: string; stepsFile?: string },
  opts: PipelineCommandOpts,
): Promise<void> {
  const state = createPipelineState({ storePath: opts.storePath ?? defaultStorePath(), log: createLogger() });

  let steps: PipelineStep[] = [];
  if (params.stepsFile) {
    const fs = await import("node:fs/promises");
    const raw = await fs.readFile(params.stepsFile, "utf-8");
    steps = JSON.parse(raw) as PipelineStep[];
  }

  const pipeline = await addPipeline(state, {
    id: params.id,
    name: params.name,
    description: params.description,
    steps,
  });
  output({ created: true, pipeline }, opts.json);
}

export async function pipelineRemoveCommand(id: string, opts: PipelineCommandOpts): Promise<void> {
  const state = createPipelineState({ storePath: opts.storePath ?? defaultStorePath(), log: createLogger() });
  const removed = await removePipeline(state, id);
  if (!removed) {
    console.error(`Pipeline not found: ${id}`);
    process.exit(1);
  }
  output({ removed: true, id }, opts.json);
}

export async function pipelineRunCommand(
  params: { pipelineId: string; input?: string },
  opts: PipelineCommandOpts,
): Promise<void> {
  const state = createPipelineState({ storePath: opts.storePath ?? defaultStorePath(), log: createLogger() });
  let input: Record<string, unknown> | undefined;
  if (params.input) {
    input = JSON.parse(params.input);
  }
  const run = await startRun(state, { pipelineId: params.pipelineId, input, trigger: "manual" });
  output({ runId: run.id, status: run.status, pipelineId: run.pipelineId }, opts.json);
}

export async function pipelineRunsCommand(pipelineId: string | undefined, opts: PipelineCommandOpts): Promise<void> {
  const state = createPipelineState({ storePath: opts.storePath ?? defaultStorePath(), log: createLogger() });
  const runs = await listRuns(state, pipelineId);
  output(
    runs.map((r) => ({
      id: r.id,
      pipelineId: r.pipelineId,
      status: r.status,
      startedAt: r.startedAtMs ? new Date(r.startedAtMs).toISOString() : undefined,
      completedAt: r.completedAtMs ? new Date(r.completedAtMs).toISOString() : undefined,
      steps: r.steps.length,
    })),
    opts.json,
  );
}

export async function pipelineStatusCommand(runId: string, opts: PipelineCommandOpts): Promise<void> {
  const state = createPipelineState({ storePath: opts.storePath ?? defaultStorePath(), log: createLogger() });
  const run = await getRun(state, runId);
  if (!run) {
    console.error(`Run not found: ${runId}`);
    process.exit(1);
  }
  output(run, opts.json);
}

export async function pipelineCancelCommand(runId: string, opts: PipelineCommandOpts): Promise<void> {
  const state = createPipelineState({ storePath: opts.storePath ?? defaultStorePath(), log: createLogger() });
  const cancelled = await cancelRun(state, runId);
  if (!cancelled) {
    console.error(`Cannot cancel run: ${runId} (not found or not running)`);
    process.exit(1);
  }
  output({ cancelled: true, runId }, opts.json);
}

export async function pipelineRolesCommand(roleId: string | undefined, opts: PipelineCommandOpts): Promise<void> {
  if (roleId) {
    const role = getRole(roleId);
    if (!role) {
      console.error(`Role not found: ${roleId}`);
      process.exit(1);
    }
    output(role, opts.json);
  } else {
    const roles = listRoles();
    output(
      roles.map((r) => ({ id: r.id, name: r.name, title: r.title, canSpawn: r.canSpawnSubagents, canPipeline: r.canManagePipelines })),
      opts.json,
    );
  }
}

export async function pipelineIdentityCommand(agentId: string | undefined, opts: PipelineCommandOpts): Promise<void> {
  if (agentId) {
    const identity = getIdentity(agentId);
    if (!identity) {
      console.error(`Identity not found: ${agentId}`);
      process.exit(1);
    }
    output(identity, opts.json);
  } else {
    output(listIdentities(), opts.json);
  }
}
