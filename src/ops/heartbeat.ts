import { getOpsAction } from "./actions.js";

export type OpsHeartbeatStatus = "green" | "attention" | "urgent";

export type OpsHeartbeatFinding = {
  area: string;
  severity: OpsHeartbeatStatus;
  message: string;
  action?: string;
  actionId?: string;
};

export type OpsHeartbeatInput = {
  checkedAt?: string;
  workspace?: unknown;
  system?: unknown;
  tasks?: unknown;
  invoices?: unknown;
  billings?: unknown;
  mailbox?: unknown;
  errors?: Record<string, string>;
};

export type OpsHeartbeatReport = {
  checkedAt: string;
  status: OpsHeartbeatStatus;
  findings: OpsHeartbeatFinding[];
  suggestedActions: string[];
  suggestedActionIds: string[];
  needsApproval: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getPath = (value: unknown, path: string[]) => {
  let current = value;
  for (const segment of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
};

const numberAt = (value: unknown, path: string[]) => {
  const candidate = getPath(value, path);
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : 0;
};

const booleanAt = (value: unknown, path: string[]) => getPath(value, path) === true;

const pushIfPositive = (
  findings: OpsHeartbeatFinding[],
  value: number,
  area: string,
  severity: OpsHeartbeatStatus,
  singular: string,
  plural: string,
  action: string,
  actionId?: string,
) => {
  if (value <= 0) {
    return;
  }
  findings.push({
    area,
    severity,
    message: `${value} ${value === 1 ? singular : plural}.`,
    action,
    actionId,
  });
};

const maxStatus = (findings: OpsHeartbeatFinding[]): OpsHeartbeatStatus => {
  if (findings.some((finding) => finding.severity === "urgent")) {
    return "urgent";
  }
  if (findings.some((finding) => finding.severity === "attention")) {
    return "attention";
  }
  return "green";
};

export function buildOpsHeartbeatReport(input: OpsHeartbeatInput): OpsHeartbeatReport {
  const findings: OpsHeartbeatFinding[] = [];

  for (const [area, message] of Object.entries(input.errors ?? {})) {
    findings.push({
      area,
      severity: "attention",
      message,
      action: "Check connector configuration, auth, or service health.",
      actionId: "system.read",
    });
  }

  if (input.system) {
    if (!booleanAt(input.system, ["nest", "ok"])) {
      findings.push({
        area: "system",
        severity: "urgent",
        message: "Primary backend session check is unhealthy.",
        action: "Check Ops backend auth and service health.",
        actionId: "system.read",
      });
    }
    const coreOk = getPath(input.system, ["core", "ok"]);
    if (coreOk !== undefined && coreOk !== true) {
      findings.push({
        area: "system",
        severity: "attention",
        message: "Core API health check is not green.",
        action: "Inspect core health before running automation.",
        actionId: "system.read",
      });
    }
    const mailGatewayOk = getPath(input.system, ["mailGateway", "ok"]);
    if (mailGatewayOk === false) {
      findings.push({
        area: "mailbox",
        severity: "attention",
        message: "Mailbox gateway health is not green.",
        action: "Check mail credentials and message delivery settings.",
        actionId: "system.read",
      });
    }
  }

  pushIfPositive(
    findings,
    numberAt(input.workspace, ["metrics", "support", "unresolved"]),
    "support",
    "urgent",
    "unresolved support session",
    "unresolved support sessions",
    "Assign Support or create a client follow-up task.",
    "tasks.create",
  );
  pushIfPositive(
    findings,
    numberAt(input.workspace, ["metrics", "reports", "open"]),
    "reports",
    "attention",
    "open report",
    "open reports",
    "Review new reports and convert real work into team tasks.",
    "tasks.create",
  );
  pushIfPositive(
    findings,
    numberAt(input.tasks, ["metrics", "blocked"]),
    "tasks",
    "urgent",
    "blocked task",
    "blocked tasks",
    "Ask the owner or assignee what decision is missing.",
    "threads.send",
  );
  pushIfPositive(
    findings,
    numberAt(input.tasks, ["metrics", "overdue"]),
    "tasks",
    "urgent",
    "overdue task",
    "overdue tasks",
    "Create a recovery plan or notify the assignee.",
    "tasks.comment",
  );
  pushIfPositive(
    findings,
    numberAt(input.invoices, ["metrics", "overdue"]),
    "finance",
    "urgent",
    "overdue invoice",
    "overdue invoices",
    "Draft a reminder, then request approval before sending.",
    "invoices.resend",
  );
  pushIfPositive(
    findings,
    numberAt(input.billings, ["metrics", "overdue"]),
    "billing",
    "urgent",
    "overdue billing item",
    "overdue billing items",
    "Prepare a billing escalation and ask Finance to approve.",
    "billings.remind",
  );
  pushIfPositive(
    findings,
    numberAt(input.billings, ["metrics", "dueSoon"]),
    "billing",
    "attention",
    "billing item due soon",
    "billing items due soon",
    "Queue reminders for review.",
    "billings.sweep",
  );

  const suggestedActions = findings
    .map((finding) => finding.action)
    .filter((action): action is string => Boolean(action));
  const suggestedActionIds = findings
    .map((finding) => finding.actionId)
    .filter((actionId): actionId is string => Boolean(actionId));
  const needsApproval = suggestedActionIds
    .filter((actionId) => getOpsAction(actionId)?.approvalRequired)
    .filter((actionId, index, actionIds) => actionIds.indexOf(actionId) === index);

  return {
    checkedAt: input.checkedAt ?? new Date().toISOString(),
    status: maxStatus(findings),
    findings,
    suggestedActions: [...new Set(suggestedActions)],
    suggestedActionIds: [...new Set(suggestedActionIds)],
    needsApproval,
  };
}
