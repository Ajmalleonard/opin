export type PipelineStepKind = "agent" | "condition" | "parallel" | "loop";

export type PipelineStepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export type PipelineRunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export type PipelineTriggerKind = "manual" | "cron" | "event" | "webhook";

export type PipelineOutputSchema = {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
};

export type PipelineRetryPolicy = {
  maxRetries?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
};

export type PipelineConditionExpr = {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "exists" | "not_exists";
  value?: unknown;
};

export type PipelineAgentStep = {
  kind: "agent";
  id: string;
  label?: string;
  task: string;
  model?: string;
  thinking?: "none" | "low" | "medium" | "high";
  timeoutSeconds?: number;
  role?: string;
  outputSchema?: PipelineOutputSchema;
  retry?: PipelineRetryPolicy;
  inputMapping?: Record<string, string>;
  condition?: PipelineConditionExpr[];
};

export type PipelineConditionStep = {
  kind: "condition";
  id: string;
  label?: string;
  conditions: PipelineConditionExpr[];
  thenSteps: PipelineStep[];
  elseSteps?: PipelineStep[];
};

export type PipelineParallelStep = {
  kind: "parallel";
  id: string;
  label?: string;
  steps: PipelineStep[];
  maxConcurrency?: number;
};

export type PipelineLoopStep = {
  kind: "loop";
  id: string;
  label?: string;
  collectionField: string;
  itemVar: string;
  steps: PipelineStep[];
  maxIterations?: number;
};

export type PipelineStep =
  | PipelineAgentStep
  | PipelineConditionStep
  | PipelineParallelStep
  | PipelineLoopStep;

export type PipelineDefinition = {
  id: string;
  name: string;
  description?: string;
  version?: string;
  steps: PipelineStep[];
  trigger?: PipelineTriggerKind;
  inputSchema?: PipelineOutputSchema;
  tags?: string[];
  createdAtMs?: number;
  updatedAtMs?: number;
};

export type PipelineStepRun = {
  stepId: string;
  status: PipelineStepStatus;
  startedAtMs?: number;
  completedAtMs?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  attemptCount?: number;
  sessionKey?: string;
};

export type PipelineRun = {
  id: string;
  pipelineId: string;
  status: PipelineRunStatus;
  startedAtMs?: number;
  completedAtMs?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  steps: PipelineStepRun[];
  trigger?: PipelineTriggerKind;
  context: PipelineContext;
};

export type PipelineContext = {
  variables: Record<string, unknown>;
  stepOutputs: Record<string, unknown>;
  runId: string;
  pipelineId: string;
  currentStepId?: string;
};

export type PipelineCreate = Omit<PipelineDefinition, "createdAtMs" | "updatedAtMs">;

export type PipelineRunCreate = {
  pipelineId: string;
  input?: Record<string, unknown>;
  trigger?: PipelineTriggerKind;
};

export type PipelineEvent =
  | { kind: "run_started"; runId: string; pipelineId: string }
  | { kind: "step_started"; runId: string; stepId: string }
  | { kind: "step_completed"; runId: string; stepId: string; output?: unknown }
  | { kind: "step_failed"; runId: string; stepId: string; error: string }
  | { kind: "run_completed"; runId: string; pipelineId: string; output?: unknown }
  | { kind: "run_failed"; runId: string; pipelineId: string; error: string };
