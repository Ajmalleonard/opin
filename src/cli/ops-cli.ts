import type { Command } from "commander";
import JSON5 from "json5";
import fs from "node:fs/promises";
import { writeConfigFile, loadConfig, type OpinConfig } from "../config/config.js";
import { danger, info, success } from "../globals.js";
import { getOpsAction, isOpsActionApproved, listOpsActions } from "../ops/actions.js";
import { OpsClient, OpsHttpError, getOpsConfig, type OpsClientConfig } from "../ops/client.js";
import { buildOpsHeartbeatReport } from "../ops/heartbeat.js";
import {
  listOpsKnowledgeBaseEntries,
  readOpsKnowledgeBaseEntry,
  resolveOpsKnowledgeBaseDir,
} from "../ops/knowledge-base.js";
import {
  listOpsRoleWorkspaces,
  readOpsRoleWorkspaceFile,
  resolveOpsRoleWorkspacesDir,
  type OpsRoleFile,
} from "../ops/roles.js";
import { defaultRuntime } from "../runtime.js";
import { runCommandWithRuntime } from "./cli-utils.js";

type OpsOpts = {
  baseUrl?: string;
  mailBaseUrl?: string;
  threadBaseUrl?: string;
  token?: string;
  save?: boolean;
  json?: boolean;
};

type ApprovalOpts = {
  approve?: boolean;
};

const getCommandOpts = (command: Command | null | undefined): OpsOpts => {
  if (!command?.opts) {
    return {};
  }
  return command.opts() as OpsOpts;
};

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const buildClient = (opts: OpsOpts, config = loadConfig()) => {
  const saved = getOpsConfig(config);
  const baseUrl = normalizeOptionalString(opts.baseUrl) ?? saved?.baseUrl;
  if (!baseUrl) {
    throw new Error("Ops base URL is required. Pass --base-url or set ops.baseUrl.");
  }
  const clientConfig: OpsClientConfig = {
    baseUrl,
    mailBaseUrl: normalizeOptionalString(opts.mailBaseUrl) ?? saved?.mailBaseUrl,
    threadBaseUrl: normalizeOptionalString(opts.threadBaseUrl) ?? saved?.threadBaseUrl,
    token: normalizeOptionalString(opts.token) ?? saved?.token,
  };
  return new OpsClient(clientConfig);
};

const requireTokenClient = (opts: OpsOpts, config = loadConfig()) => {
  const client = buildClient(opts, config);
  if (!client.token) {
    throw new Error("Ops token is required. Pass --token or run `opin ops login --save`.");
  }
  return client;
};

const printResult = (value: unknown, asJson = true) => {
  if (typeof value === "string") {
    defaultRuntime.log(value);
    return;
  }
  if (asJson || value === null || typeof value !== "object") {
    defaultRuntime.log(JSON.stringify(value ?? null, null, 2));
    return;
  }
  defaultRuntime.log(String(value));
};

const saveOpsConfig = async (
  config: OpinConfig,
  updates: { baseUrl?: string; mailBaseUrl?: string; threadBaseUrl?: string; token?: string },
) => {
  const next: OpinConfig = {
    ...config,
    ops: {
      ...config.ops,
      ...Object.fromEntries(
        Object.entries(updates).filter(([, value]) => typeof value === "string" && value.trim()),
      ),
    },
  };
  await writeConfigFile(next);
};

const readPayload = async (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Payload cannot be empty");
  }
  if (trimmed.startsWith("@")) {
    const filePath = trimmed.slice(1).trim();
    if (!filePath) {
      throw new Error("Payload file path is empty");
    }
    const fileContents = await fs.readFile(filePath, "utf8");
    return JSON5.parse(fileContents);
  }
  return JSON5.parse(trimmed);
};

const collectOption = (value: string, previous: string[] = []) => {
  previous.push(value);
  return previous;
};

const parseTags = (raw: unknown) => {
  const values = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
};

const requireActionApproval = (actionId: string, opts: ApprovalOpts, config = loadConfig()) => {
  if (isOpsActionApproved(config, actionId, Boolean(opts.approve))) {
    return;
  }
  const action = getOpsAction(actionId);
  if (action) {
    throw new Error(
      `Action ${action.id} (${action.title}) needs approval. Pass --approve or add it to ops.allowlistedActions.`,
    );
  }
  throw new Error(
    `Action ${actionId} needs approval. Pass --approve or add it to ops.allowlistedActions.`,
  );
};

const parseRoleFile = (value: unknown): OpsRoleFile => {
  const raw = normalizeOptionalString(value) ?? "role";
  if (raw === "role" || raw === "heartbeat" || raw === "tools") {
    return raw;
  }
  throw new Error("--file must be role, heartbeat, or tools.");
};

const captureSnapshot = async <T>(
  area: string,
  errors: Record<string, string>,
  run: () => Promise<T>,
) => {
  try {
    return await run();
  } catch (err) {
    errors[area] = err instanceof Error ? err.message : String(err);
    return undefined;
  }
};

const handleOpsError = (err: unknown) => {
  if (err instanceof OpsHttpError) {
    defaultRuntime.error(danger(`${err.message}`));
    if (err.body !== undefined) {
      defaultRuntime.error(JSON.stringify(err.body, null, 2));
    }
    defaultRuntime.exit(1);
    return;
  }
  defaultRuntime.error(danger(String(err)));
  defaultRuntime.exit(1);
};

export function registerOpsCli(program: Command) {
  const ops = program
    .command("ops")
    .description("Ops connector and action commands")
    .option("--base-url <url>", "Ops backend base URL")
    .option("--mail-base-url <url>", "Dedicated mailbox API base URL")
    .option("--thread-base-url <url>", "Dedicated threads backend base URL")
    .option("--token <token>", "Ops JWT/token")
    .option("--json", "Output JSON", false);

  ops
    .command("login")
    .description("Log into Ops and optionally save the token/config")
    .requiredOption("--email <email>", "Ops account email")
    .requiredOption("--password <password>", "Ops account password")
    .option("--save", "Save token and URL settings into Opin config", false)
    .action(async (opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const parent = getCommandOpts(command.parent);
          const client = buildClient(parent);
          const result = await client.login(opts.email as string, opts.password as string);
          if (result.requires2FA) {
            printResult(result, true);
            return;
          }
          if (!result.token || typeof result.token !== "string") {
            throw new Error("Ops login succeeded but did not return a token.");
          }
          if (opts.save) {
            const currentConfig = loadConfig();
            await saveOpsConfig(currentConfig, {
              baseUrl: client.baseUrl,
              mailBaseUrl: client.mailBaseUrl === client.baseUrl ? undefined : client.mailBaseUrl,
              threadBaseUrl:
                client.threadBaseUrl === client.baseUrl ? undefined : client.threadBaseUrl,
              token: result.token,
            });
            defaultRuntime.log(success("Saved Ops credentials to config."));
          }
          printResult(result, true);
        },
        handleOpsError,
      );
    });

  ops
    .command("status")
    .description("Check Ops auth and workspace access")
    .action(async (_opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const parent = getCommandOpts(command.parent);
          const client = requireTokenClient(parent);
          const [session, workspace] = await Promise.all([
            client.getSessionMe(),
            client.getWorkspace(),
          ]);
          printResult(
            {
              ok: true,
              baseUrl: client.baseUrl,
              mailBaseUrl: client.mailBaseUrl,
              threadBaseUrl: client.threadBaseUrl,
              session,
              workspaceSummary:
                typeof workspace === "object" &&
                workspace &&
                "metrics" in (workspace as Record<string, unknown>)
                  ? (workspace as Record<string, unknown>).metrics
                  : workspace,
            },
            true,
          );
        },
        handleOpsError,
      );
    });

  ops
    .command("workspace")
    .description("Fetch the Ops workspace snapshot")
    .action(async (_opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent));
          printResult(await client.getWorkspace(), true);
        },
        handleOpsError,
      );
    });

  ops
    .command("system")
    .description("Fetch Ops system health")
    .action(async (_opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent));
          printResult(await client.getSystem(), true);
        },
        handleOpsError,
      );
    });

  const tasks = ops.command("tasks").description("Team task actions");

  tasks
    .command("list")
    .description("List team task snapshot data")
    .action(async (_opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(await client.listTasks(), true);
        },
        handleOpsError,
      );
    });

  tasks
    .command("create")
    .description("Create a team task when Ops needs human execution")
    .option("--payload <json-or-@file>", "Task payload JSON or @file")
    .option("--title <title>", "Task title")
    .option("--description <text>", "Task description")
    .option("--priority <priority>", "Task priority")
    .option("--assignee-id <id>", "Assignee user id")
    .option("--assignee-name <name>", "Assignee display name")
    .option("--due-date <date>", "Due date")
    .option("--tag <tag>", "Task tag (repeat or comma-separated)", collectOption, [])
    .action(async (opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          const payload = opts.payload
            ? await readPayload(opts.payload as string)
            : {
                title: normalizeOptionalString(opts.title),
                description: normalizeOptionalString(opts.description),
                priority: normalizeOptionalString(opts.priority) ?? "medium",
                source: "manual",
                assigneeId: normalizeOptionalString(opts.assigneeId),
                assigneeName: normalizeOptionalString(opts.assigneeName),
                dueDate: normalizeOptionalString(opts.dueDate),
                tags: parseTags(opts.tag),
              };
          if (
            typeof payload !== "object" ||
            payload === null ||
            !normalizeOptionalString((payload as Record<string, unknown>).title)
          ) {
            throw new Error("Task creation requires --payload with title or --title.");
          }
          printResult(await client.createTask(payload), true);
        },
        handleOpsError,
      );
    });

  tasks
    .command("update")
    .description("Update a team task from JSON or @file payload")
    .argument("<taskId>", "Task id")
    .requiredOption("--payload <json-or-@file>", "Task update payload JSON or @file")
    .action(async (taskId: string, opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(
            await client.updateTask(taskId, await readPayload(opts.payload as string)),
            true,
          );
        },
        handleOpsError,
      );
    });

  tasks
    .command("start")
    .description("Mark a team task as started")
    .argument("<taskId>", "Task id")
    .action(async (taskId: string, _opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(await client.startTask(taskId), true);
        },
        handleOpsError,
      );
    });

  tasks
    .command("assign")
    .description("Assign a team task")
    .argument("<taskId>", "Task id")
    .requiredOption("--user-id <id>", "Assignee user id")
    .requiredOption("--user-name <name>", "Assignee name")
    .option("--role <role>", "Assignment role")
    .action(async (taskId: string, opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(
            await client.assignTask(taskId, {
              userId: opts.userId,
              userName: opts.userName,
              role: normalizeOptionalString(opts.role),
            }),
            true,
          );
        },
        handleOpsError,
      );
    });

  tasks
    .command("comment")
    .description("Add a comment to a team task")
    .argument("<taskId>", "Task id")
    .requiredOption("--body <text>", "Comment body")
    .action(async (taskId: string, opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(await client.addTaskComment(taskId, { body: opts.body }), true);
        },
        handleOpsError,
      );
    });

  tasks
    .command("checklist-add")
    .description("Add a checklist item to a team task")
    .argument("<taskId>", "Task id")
    .requiredOption("--label <label>", "Checklist label")
    .action(async (taskId: string, opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(await client.addTaskChecklistItem(taskId, { label: opts.label }), true);
        },
        handleOpsError,
      );
    });

  const invoices = ops.command("invoices").description("Invoice actions");

  invoices
    .command("list")
    .description("List invoice snapshot data")
    .action(async (_opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(await client.listInvoices(), true);
        },
        handleOpsError,
      );
    });

  invoices
    .command("create")
    .description("Create an invoice from JSON or @file payload")
    .requiredOption("--payload <json-or-@file>", "Invoice payload JSON or @file")
    .action(async (opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(await client.createInvoice(await readPayload(opts.payload as string)), true);
        },
        handleOpsError,
      );
    });

  invoices
    .command("review")
    .description("Run invoice AI review")
    .argument("<invoiceId>", "Invoice id")
    .option("--instruction <text>", "Review instruction")
    .option("--tone <tone>", "Review tone")
    .option("--apply", "Apply review suggestions", false)
    .action(async (invoiceId: string, opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(
            await client.reviewInvoice(invoiceId, {
              instruction: normalizeOptionalString(opts.instruction),
              tone: normalizeOptionalString(opts.tone),
              apply: Boolean(opts.apply),
            }),
            true,
          );
        },
        handleOpsError,
      );
    });

  invoices
    .command("resend")
    .description("Resend an invoice to the client")
    .argument("<invoiceId>", "Invoice id")
    .option("--subject <subject>", "Override subject")
    .option("--context-note <text>", "Context note")
    .option("--approve", "Approve this client-facing send", false)
    .action(async (invoiceId: string, opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          requireActionApproval("invoices.resend", opts);
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(
            await client.resendInvoice(invoiceId, {
              subject: normalizeOptionalString(opts.subject),
              contextNote: normalizeOptionalString(opts.contextNote),
            }),
            true,
          );
        },
        handleOpsError,
      );
    });

  const billings = ops.command("billings").description("Billing actions");

  billings
    .command("list")
    .description("List billing snapshot data")
    .action(async (_opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(await client.listBillings(), true);
        },
        handleOpsError,
      );
    });

  billings
    .command("remind")
    .description("Send a billing reminder")
    .argument("<subscriptionId>", "Subscription id")
    .option("--approve", "Approve this client-facing reminder", false)
    .action(async (subscriptionId: string, opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          requireActionApproval("billings.remind", opts);
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(await client.remindBilling(subscriptionId), true);
        },
        handleOpsError,
      );
    });

  billings
    .command("sweep")
    .description("Run billing automation sweep")
    .option("--approve", "Approve billing automation actions", false)
    .action(async (opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          requireActionApproval("billings.sweep", opts);
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(await client.sweepBillings(), true);
        },
        handleOpsError,
      );
    });

  const mailbox = ops.command("mailbox").description("Mailbox actions");

  mailbox
    .command("list")
    .description("List mailbox messages")
    .option("--alias <alias>", "Mailbox alias")
    .option("--folder <folder>", "Mailbox folder")
    .option("--query <query>", "Search query")
    .action(async (opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries({
            alias: normalizeOptionalString(opts.alias),
            folder: normalizeOptionalString(opts.folder),
            query: normalizeOptionalString(opts.query),
          })) {
            if (value) {
              params.set(key, value);
            }
          }
          printResult(await client.listMailbox(params), true);
        },
        handleOpsError,
      );
    });

  mailbox
    .command("compose")
    .description("Send a mailbox message")
    .requiredOption("--from-alias <alias>", "From alias")
    .requiredOption("--to <email>", "Recipient email")
    .requiredOption("--subject <subject>", "Message subject")
    .requiredOption("--body <text>", "Message body")
    .option("--approve", "Approve this client-facing email", false)
    .action(async (opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          requireActionApproval("mailbox.compose", opts);
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(
            await client.composeMailbox({
              fromAlias: opts.fromAlias,
              to: opts.to,
              subject: opts.subject,
              body: opts.body,
            }),
            true,
          );
        },
        handleOpsError,
      );
    });

  const threads = ops.command("threads").description("Team threads");

  threads
    .command("list")
    .description("List threads")
    .action(async (_opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(await client.listThreads(), true);
        },
        handleOpsError,
      );
    });

  threads
    .command("messages")
    .description("List thread messages")
    .argument("<threadId>", "Thread id")
    .option("--cursor <cursor>", "Pagination cursor")
    .action(async (threadId: string, opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(
            await client.listThreadMessages(threadId, normalizeOptionalString(opts.cursor)),
            true,
          );
        },
        handleOpsError,
      );
    });

  threads
    .command("send")
    .description("Send a thread message")
    .argument("<threadId>", "Thread id")
    .requiredOption("--body <text>", "Message body")
    .action(async (threadId: string, opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          printResult(await client.sendThreadMessage(threadId, { body: opts.body }), true);
        },
        handleOpsError,
      );
    });

  const actions = ops.command("actions").description("Ops action catalog");

  actions
    .command("list")
    .description("List available Ops actions")
    .option("--role <role>", "Filter by role id")
    .option("--approval-required", "Only show actions that require approval", false)
    .action(async (opts) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const role = normalizeOptionalString(opts.role);
          const approvalRequired = Boolean(opts.approvalRequired);
          const filtered = listOpsActions().filter((action) => {
            if (role && !action.roles.includes(role)) {
              return false;
            }
            if (approvalRequired && !action.approvalRequired) {
              return false;
            }
            return true;
          });
          printResult(filtered, true);
        },
        handleOpsError,
      );
    });

  actions
    .command("show")
    .description("Show one Ops action definition")
    .argument("<actionId>", "Action id")
    .action(async (actionId: string) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const action = getOpsAction(actionId);
          if (!action) {
            throw new Error(`Unknown Ops action: ${actionId}`);
          }
          printResult(action, true);
        },
        handleOpsError,
      );
    });

  const knowledge = ops.command("knowledge").description("Company knowledge base");

  knowledge
    .command("path")
    .description("Show the company knowledge base directory")
    .action(async () => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          defaultRuntime.log(resolveOpsKnowledgeBaseDir(loadConfig()));
        },
        handleOpsError,
      );
    });

  const roles = ops.command("roles").description("Company role workspaces");

  roles
    .command("path")
    .description("Show the role workspace directory")
    .action(async () => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          defaultRuntime.log(resolveOpsRoleWorkspacesDir(loadConfig()));
        },
        handleOpsError,
      );
    });

  roles
    .command("list")
    .description("List role workspaces")
    .action(async () => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          printResult(await listOpsRoleWorkspaces(resolveOpsRoleWorkspacesDir(loadConfig())), true);
        },
        handleOpsError,
      );
    });

  roles
    .command("show")
    .description("Show a role workspace file")
    .argument("<role>", "Role id")
    .option("--file <file>", "File to show (role|heartbeat|tools)", "role")
    .action(async (role: string, opts) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const dir = resolveOpsRoleWorkspacesDir(loadConfig());
          defaultRuntime.log(await readOpsRoleWorkspaceFile(dir, role, parseRoleFile(opts.file)));
        },
        handleOpsError,
      );
    });

  const heartbeat = ops.command("heartbeat").description("Business heartbeat");

  heartbeat
    .command("run")
    .description("Check business snapshots and summarize what needs attention")
    .option("--silent-green", "Print nothing when the heartbeat is green", false)
    .action(async (opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = requireTokenClient(getCommandOpts(command.parent?.parent));
          const errors: Record<string, string> = {};
          const [workspace, system, tasksSnapshot, invoicesSnapshot, billingsSnapshot] =
            await Promise.all([
              captureSnapshot("workspace", errors, () => client.getWorkspace()),
              captureSnapshot("system", errors, () => client.getSystem()),
              captureSnapshot("tasks", errors, () => client.listTasks()),
              captureSnapshot("invoices", errors, () => client.listInvoices()),
              captureSnapshot("billings", errors, () => client.listBillings()),
            ]);
          const report = buildOpsHeartbeatReport({
            workspace,
            system,
            tasks: tasksSnapshot,
            invoices: invoicesSnapshot,
            billings: billingsSnapshot,
            errors,
          });
          if (opts.silentGreen && report.status === "green") {
            return;
          }
          printResult(report, true);
        },
        handleOpsError,
      );
    });

  knowledge
    .command("list")
    .description("List company knowledge base entries")
    .action(async () => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const dir = resolveOpsKnowledgeBaseDir(loadConfig());
          printResult(await listOpsKnowledgeBaseEntries(dir), true);
        },
        handleOpsError,
      );
    });

  knowledge
    .command("show")
    .description("Show a company knowledge base entry")
    .argument("<name>", "Markdown file name")
    .action(async (name: string) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const dir = resolveOpsKnowledgeBaseDir(loadConfig());
          defaultRuntime.log(await readOpsKnowledgeBaseEntry(dir, name));
        },
        handleOpsError,
      );
    });

  ops
    .command("config")
    .description("Show the resolved Ops connector config")
    .action(async (_opts, command) => {
      await runCommandWithRuntime(
        defaultRuntime,
        async () => {
          const client = buildClient(getCommandOpts(command.parent));
          printResult(
            {
              baseUrl: client.baseUrl,
              mailBaseUrl: client.mailBaseUrl,
              threadBaseUrl: client.threadBaseUrl,
              tokenConfigured: Boolean(client.token),
              knowledgeBaseDir: resolveOpsKnowledgeBaseDir(loadConfig()),
              roleWorkspacesDir: resolveOpsRoleWorkspacesDir(loadConfig()),
            },
            true,
          );
        },
        handleOpsError,
      );
    });

  ops.addHelpText(
    "after",
    `\n${info("Examples:")}
  opin ops --base-url http://127.0.0.1:2222 login --email admin@example.com --password secret --save
  opin ops tasks create --title "Review proposal" --description "Needs a human approval pass" --priority high --tag sales
  opin ops invoices create --payload @invoice.json
  opin ops mailbox compose --from-alias ops --to client@example.com --subject "Update" --body "We shipped it." --approve
  opin ops actions list --role finance --approval-required
  opin ops knowledge list
  opin ops roles show ceo --file heartbeat
  opin ops heartbeat run
`,
  );
}
