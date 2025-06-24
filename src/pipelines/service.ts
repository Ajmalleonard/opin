import type { Logger } from "../infra/logger.js";
import type {
  PipelineContext,
  PipelineCreate,
  PipelineDefinition,
  PipelineEvent,
  PipelineRun,
  PipelineRunCreate,
  PipelineRunStatus,
  PipelineStepRun,
  PipelineStepStatus,
} from "./types.js";
import { loadPipelineStore, savePipelineStore, type PipelineStoreFile } from "./store.js";

export type PipelineStateDeps = {
  storePath: string;
  log: Logger;
  nowMs?: () => number;
  onEvent?: (evt: PipelineEvent) => void;
};

export type PipelineState = {
  deps: PipelineStateDeps;
  store: PipelineStoreFile | null;
  op: Promise<unknown>;
};

function now(state: PipelineState): number {
  return (state.deps.nowMs ?? Date.now)();
}

function emit(state: PipelineState, evt: PipelineEvent): void {
  state.deps.onEvent?.(evt);
}

async function locked<T>(state: PipelineState, fn: () => Promise<T>): Promise<T> {
  const next = state.op.then(fn, fn);
  state.op = next;
  return next;
}

async function ensureLoaded(state: PipelineState): Promise<PipelineStoreFile> {
  if (!state.store) {
    state.store = await loadPipelineStore(state.deps.storePath);
  }
  return state.store;
}

async function persist(state: PipelineState): Promise<void> {
  if (state.store) {
    await savePipelineStore(state.deps.storePath, state.store);
  }
}

export function createPipelineState(deps: PipelineStateDeps): PipelineState {
  return {
    deps: { ...deps, nowMs: deps.nowMs ?? (() => Date.now()) },
    store: null,
    op: Promise.resolve(),
  };
}

export async function addPipeline(
  state: PipelineState,
  input: PipelineCreate,
): Promise<PipelineDefinition> {
  return locked(state, async () => {
    const store = await ensureLoaded(state);
    const ts = now(state);
    const pipeline: PipelineDefinition = {
      ...input,
      createdAtMs: ts,
      updatedAtMs: ts,
    };
    store.pipelines[pipeline.id] = pipeline;
    await persist(state);
    state.deps.log.info(`Pipeline added: ${pipeline.id} (${pipeline.name})`);
    return pipeline;
  });
}

export async function removePipeline(
  state: PipelineState,
  id: string,
): Promise<boolean> {
  return locked(state, async () => {
    const store = await ensureLoaded(state);
    if (!store.pipelines[id]) return false;
    delete store.pipelines[id];
    for (const runId of Object.keys(store.runs)) {
      if (store.runs[runId]?.pipelineId === id) {
        delete store.runs[runId];
      }
    }
    await persist(state);
    state.deps.log.info(`Pipeline removed: ${id}`);
    return true;
  });
}

export async function listPipelines(
  state: PipelineState,
): Promise<PipelineDefinition[]> {
  return locked(state, async () => {
    const store = await ensureLoaded(state);
    return Object.values(store.pipelines);
  });
}

export async function getPipeline(
  state: PipelineState,
  id: string,
): Promise<PipelineDefinition | null> {
  return locked(state, async () => {
    const store = await ensureLoaded(state);
    return store.pipelines[id] ?? null;
  });
}

function generateRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function startRun(
  state: PipelineState,
  input: PipelineRunCreate,
): Promise<PipelineRun> {
  return locked(state, async () => {
    const store = await ensureLoaded(state);
    const pipeline = store.pipelines[input.pipelineId];
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${input.pipelineId}`);
    }
    const ts = now(state);
    const runId = generateRunId();
    const context: PipelineContext = {
      variables: input.input ?? {},
      stepOutputs: {},
      runId,
      pipelineId: input.pipelineId,
    };
    const run: PipelineRun = {
      id: runId,
      pipelineId: input.pipelineId,
      status: "running",
      startedAtMs: ts,
      input: input.input,
      steps: [],
      trigger: input.trigger ?? "manual",
      context,
    };
    store.runs[runId] = run;
    await persist(state);
    emit(state, { kind: "run_started", runId, pipelineId: input.pipelineId });
    state.deps.log.info(`Pipeline run started: ${runId} for ${input.pipelineId}`);
    return run;
  });
}

export async function updateStepRun(
  state: PipelineState,
  runId: string,
  stepId: string,
  patch: Partial<PipelineStepRun>,
): Promise<void> {
  return locked(state, async () => {
    const store = await ensureLoaded(state);
    const run = store.runs[runId];
    if (!run) return;
    const existing = run.steps.find((s) => s.stepId === stepId);
    if (existing) {
      Object.assign(existing, patch);
    } else {
      run.steps.push({ stepId, status: "pending", ...patch });
    }
    await persist(state);
  });
}

export async function completeRun(
  state: PipelineState,
  runId: string,
  status: PipelineRunStatus,
  output?: Record<string, unknown>,
  error?: string,
): Promise<void> {
  return locked(state, async () => {
    const store = await ensureLoaded(state);
    const run = store.runs[runId];
    if (!run) return;
    run.status = status;
    run.completedAtMs = now(state);
    if (output !== undefined) run.output = output;
    if (error !== undefined) run.error = error;
    await persist(state);
    if (status === "completed") {
      emit(state, { kind: "run_completed", runId, pipelineId: run.pipelineId, output });
    } else {
      emit(state, { kind: "run_failed", runId, pipelineId: run.pipelineId, error: error ?? "unknown" });
    }
    state.deps.log.info(`Pipeline run ${status}: ${runId}`);
  });
}

export async function getRun(
  state: PipelineState,
  runId: string,
): Promise<PipelineRun | null> {
  return locked(state, async () => {
    const store = await ensureLoaded(state);
    return store.runs[runId] ?? null;
  });
}

export async function listRuns(
  state: PipelineState,
  pipelineId?: string,
): Promise<PipelineRun[]> {
  return locked(state, async () => {
    const store = await ensureLoaded(state);
    const all = Object.values(store.runs);
    if (pipelineId) return all.filter((r) => r.pipelineId === pipelineId);
    return all;
  });
}

export async function cancelRun(
  state: PipelineState,
  runId: string,
): Promise<boolean> {
  return locked(state, async () => {
    const store = await ensureLoaded(state);
    const run = store.runs[runId];
    if (!run || run.status !== "running") return false;
    run.status = "cancelled";
    run.completedAtMs = now(state);
    await persist(state);
    state.deps.log.info(`Pipeline run cancelled: ${runId}`);
    return true;
  });
}
