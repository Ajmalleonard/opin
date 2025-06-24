import type { OpinConfig } from "../config/config.js";

export type OpsActionRisk = "read" | "internal-write" | "client-facing" | "billing" | "system";

export type OpsActionDefinition = {
  id: string;
  title: string;
  command: string;
  description: string;
  risk: OpsActionRisk;
  approvalRequired: boolean;
  roles: string[];
};

export const OPS_ACTIONS: OpsActionDefinition[] = [
  {
    id: "workspace.read",
    title: "Read Workspace",
    command: "opin ops workspace",
    description: "Fetch visitors, bookings, reports, team, support, and activity metrics.",
    risk: "read",
    approvalRequired: false,
    roles: ["ceo", "ops", "support", "sales"],
  },
  {
    id: "system.read",
    title: "Read System Health",
    command: "opin ops system",
    description: "Check backend, core, and mailbox gateway health.",
    risk: "read",
    approvalRequired: false,
    roles: ["ceo", "ops"],
  },
  {
    id: "heartbeat.run",
    title: "Run Business Heartbeat",
    command: "opin ops heartbeat run",
    description:
      "Build a deterministic report across workspace, tasks, invoices, billing, and system health.",
    risk: "read",
    approvalRequired: false,
    roles: ["ceo", "ops", "finance", "support", "sales"],
  },
  {
    id: "tasks.create",
    title: "Create Team Task",
    command: "opin ops tasks create",
    description: "Create a task when AI needs a human owner, decision, or execution step.",
    risk: "internal-write",
    approvalRequired: false,
    roles: ["ceo", "ops", "support", "finance", "sales"],
  },
  {
    id: "tasks.update",
    title: "Update Team Task",
    command: "opin ops tasks update",
    description: "Update task fields from a JSON payload.",
    risk: "internal-write",
    approvalRequired: false,
    roles: ["ops"],
  },
  {
    id: "tasks.comment",
    title: "Comment On Team Task",
    command: "opin ops tasks comment",
    description: "Add context, decisions, or progress to an existing team task.",
    risk: "internal-write",
    approvalRequired: false,
    roles: ["ceo", "ops", "support", "finance", "sales"],
  },
  {
    id: "threads.send",
    title: "Send Team Thread Message",
    command: "opin ops threads send",
    description: "Ask the team for context or notify an internal thread.",
    risk: "internal-write",
    approvalRequired: false,
    roles: ["ceo", "ops", "support", "sales"],
  },
  {
    id: "invoices.create",
    title: "Create Invoice Draft",
    command: "opin ops invoices create",
    description: "Create an invoice from approved service and client details.",
    risk: "internal-write",
    approvalRequired: false,
    roles: ["finance"],
  },
  {
    id: "invoices.review",
    title: "Review Invoice",
    command: "opin ops invoices review",
    description: "Run invoice AI review and optionally apply suggested draft improvements.",
    risk: "internal-write",
    approvalRequired: false,
    roles: ["finance"],
  },
  {
    id: "invoices.resend",
    title: "Resend Invoice",
    command: "opin ops invoices resend --approve",
    description: "Resend an invoice to the client.",
    risk: "client-facing",
    approvalRequired: true,
    roles: ["finance", "ceo"],
  },
  {
    id: "billings.remind",
    title: "Send Billing Reminder",
    command: "opin ops billings remind --approve",
    description: "Send a billing reminder to a client.",
    risk: "billing",
    approvalRequired: true,
    roles: ["finance"],
  },
  {
    id: "billings.sweep",
    title: "Run Billing Sweep",
    command: "opin ops billings sweep --approve",
    description: "Run billing automation across due soon and overdue billing items.",
    risk: "billing",
    approvalRequired: true,
    roles: ["finance", "ops"],
  },
  {
    id: "mailbox.compose",
    title: "Send Mailbox Email",
    command: "opin ops mailbox compose --approve",
    description: "Send a client-facing email from a configured mailbox alias.",
    risk: "client-facing",
    approvalRequired: true,
    roles: ["support", "sales", "ceo"],
  },
];

export const listOpsActions = () => OPS_ACTIONS;

export const getOpsAction = (id: string) => OPS_ACTIONS.find((action) => action.id === id);

export const isOpsActionAllowlisted = (config: OpinConfig, id: string) =>
  Boolean(config.ops?.allowlistedActions?.includes(id));

export const isOpsActionApproved = (config: OpinConfig, id: string, approved: boolean) =>
  approved || isOpsActionAllowlisted(config, id);
