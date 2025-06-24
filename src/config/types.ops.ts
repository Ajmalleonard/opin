export type OpsConfig = {
  /** Base backend URL for auth, workspace, invoices, and billing actions. */
  baseUrl?: string;
  /** Optional dedicated mailbox API base URL. Defaults to baseUrl. */
  mailBaseUrl?: string;
  /** Optional dedicated thread backend base URL. Defaults to baseUrl. */
  threadBaseUrl?: string;
  /** Bearer/JWT token used for Ops requests. */
  token?: string;
  /** Markdown knowledge base directory used by company roles. */
  knowledgeBaseDir?: string;
  /** Role workspace directory with ROLE.md, HEARTBEAT.md, and TOOLS.md files. */
  roleWorkspacesDir?: string;
  /** Action ids allowed to run without an explicit CLI approval flag. */
  allowlistedActions?: string[];
};
