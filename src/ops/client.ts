import type { OpinConfig } from "../config/config.js";

export type OpsClientConfig = {
  baseUrl: string;
  token?: string;
  mailBaseUrl?: string;
  threadBaseUrl?: string;
  fetchImpl?: typeof fetch;
};

export type OpsLoginResult = {
  token?: string | null;
  requires2FA?: boolean;
  [key: string]: unknown;
};

export class OpsHttpError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "OpsHttpError";
    this.status = status;
    this.body = body;
  }
}

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const buildUrl = (baseUrl: string, path: string) => {
  const normalizedBase = stripTrailingSlash(baseUrl.trim());
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const pickErrorMessage = (status: number, body: unknown, fallback: string) => {
  if (isObject(body)) {
    const candidate = body.error ?? body.message;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }
  return `${fallback} (${status})`;
};

export const getOpsConfig = (config: OpinConfig): OpsClientConfig | null => {
  const baseUrl = config.ops?.baseUrl?.trim();
  if (!baseUrl) {
    return null;
  }
  return {
    baseUrl,
    token: config.ops?.token?.trim() || undefined,
    mailBaseUrl: config.ops?.mailBaseUrl?.trim() || undefined,
    threadBaseUrl: config.ops?.threadBaseUrl?.trim() || undefined,
  };
};

export class OpsClient {
  readonly baseUrl: string;
  readonly mailBaseUrl: string;
  readonly threadBaseUrl: string;
  readonly token?: string;
  readonly fetchImpl: typeof fetch;

  constructor(config: OpsClientConfig) {
    const baseUrl = config.baseUrl.trim();
    if (!baseUrl) {
      throw new Error("Ops base URL is required");
    }
    this.baseUrl = stripTrailingSlash(baseUrl);
    this.mailBaseUrl = stripTrailingSlash(config.mailBaseUrl?.trim() || this.baseUrl);
    this.threadBaseUrl = stripTrailingSlash(config.threadBaseUrl?.trim() || this.baseUrl);
    this.token = config.token?.trim() || undefined;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async login(email: string, password: string): Promise<OpsLoginResult> {
    const response = await this.fetchImpl(buildUrl(this.baseUrl, "/session/access"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return (await this.parseResponse(response, "Ops login failed")) as OpsLoginResult;
  }

  async getSessionMe() {
    return this.requestJson("GET", this.baseUrl, "/session/me");
  }

  async getWorkspace() {
    return this.requestJson("GET", this.baseUrl, "/admin/workspace");
  }

  async getSystem() {
    const checkedAt = new Date().toISOString();

    const [sessionResult, mailboxResult] = await Promise.allSettled([
      this.getSessionMe(),
      this.requestJson("GET", this.mailBaseUrl, "/admin/mailbox/security"),
    ]);

    const sessionOk = sessionResult.status === "fulfilled";
    const mailboxPayload = mailboxResult.status === "fulfilled" ? mailboxResult.value : undefined;
    const mailGatewayOk =
      typeof mailboxPayload === "object" &&
      mailboxPayload !== null &&
      !Array.isArray(mailboxPayload) &&
      "ok" in mailboxPayload
        ? mailboxPayload.ok === true
        : false;

    return {
      checkedAt,
      nest: {
        ok: sessionOk,
        error:
          sessionOk || sessionResult.reason == null
            ? undefined
            : sessionResult.reason instanceof Error
              ? sessionResult.reason.message
              : String(sessionResult.reason),
      },
      core: {
        ok: true,
        skipped: true,
        reason: "No core health check configured.",
      },
      mailGateway: {
        ok: mailGatewayOk,
        error:
          mailboxResult.status === "fulfilled" || mailboxResult.reason == null
            ? undefined
            : mailboxResult.reason instanceof Error
              ? mailboxResult.reason.message
              : String(mailboxResult.reason),
      },
      mailboxSecurity: mailboxPayload,
    };
  }

  async listTasks() {
    return this.requestJson("GET", this.baseUrl, "/admin/tasks");
  }

  async createTask(payload: unknown) {
    return this.requestJson("POST", this.baseUrl, "/admin/tasks", payload);
  }

  async updateTask(taskId: string, payload: unknown) {
    return this.requestJson("PATCH", this.baseUrl, `/admin/tasks/${taskId}`, payload);
  }

  async startTask(taskId: string) {
    return this.requestJson("POST", this.baseUrl, `/admin/tasks/${taskId}/start`);
  }

  async assignTask(taskId: string, payload: unknown) {
    return this.requestJson("POST", this.baseUrl, `/admin/tasks/${taskId}/assign`, payload);
  }

  async addTaskComment(taskId: string, payload: unknown) {
    return this.requestJson("POST", this.baseUrl, `/admin/tasks/${taskId}/comments`, payload);
  }

  async addTaskChecklistItem(taskId: string, payload: unknown) {
    return this.requestJson("POST", this.baseUrl, `/admin/tasks/${taskId}/checklist`, payload);
  }

  async listInvoices() {
    return this.requestJson("GET", this.baseUrl, "/admin/invoices");
  }

  async createInvoice(payload: unknown) {
    return this.requestJson("POST", this.baseUrl, "/admin/invoices", payload);
  }

  async reviewInvoice(invoiceId: string, payload: unknown) {
    return this.requestJson("POST", this.baseUrl, `/admin/invoices/${invoiceId}/review`, payload);
  }

  async resendInvoice(invoiceId: string, payload: unknown) {
    return this.requestJson("POST", this.baseUrl, `/admin/invoices/${invoiceId}/resend`, payload);
  }

  async listBillings() {
    return this.requestJson("GET", this.baseUrl, "/admin/billings");
  }

  async remindBilling(subscriptionId: string) {
    return this.requestJson("POST", this.baseUrl, `/admin/billings/${subscriptionId}/remind`);
  }

  async sweepBillings() {
    return this.requestJson("POST", this.baseUrl, "/admin/billings/automation/sweep");
  }

  async listMailbox(query?: URLSearchParams) {
    const suffix = query && [...query.keys()].length > 0 ? `?${query.toString()}` : "";
    return this.requestJson("GET", this.mailBaseUrl, `/admin/mailbox${suffix}`);
  }

  async composeMailbox(payload: unknown) {
    return this.requestJson("POST", this.mailBaseUrl, "/admin/mailbox/compose", payload);
  }

  async listThreads() {
    return this.requestJson("GET", this.threadBaseUrl, "/api/admin/threads");
  }

  async listThreadMessages(threadId: string, cursor?: string) {
    const suffix = cursor?.trim() ? `?cursor=${encodeURIComponent(cursor.trim())}` : "";
    return this.requestJson(
      "GET",
      this.threadBaseUrl,
      `/api/admin/threads/${threadId}/messages${suffix}`,
    );
  }

  async sendThreadMessage(threadId: string, payload: unknown) {
    return this.requestJson(
      "POST",
      this.threadBaseUrl,
      `/api/admin/threads/${threadId}/messages`,
      payload,
    );
  }

  private async requestJson(method: string, baseUrl: string, path: string, body?: unknown) {
    const headers = this.buildAuthHeaders(body !== undefined);
    const response = await this.fetchImpl(buildUrl(baseUrl, path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return this.parseResponse(response, `Ops request failed: ${method} ${path}`);
  }

  private buildAuthHeaders(includeJson: boolean) {
    const headers: Record<string, string> = {};
    if (includeJson) {
      headers["Content-Type"] = "application/json";
    }
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
      headers.Cookie = `jwt=${this.token}`;
    }
    return headers;
  }

  private async parseResponse(response: Response, fallbackMessage: string) {
    const body = await this.readResponseBody(response);
    if (!response.ok) {
      throw new OpsHttpError(
        pickErrorMessage(response.status, body, fallbackMessage),
        response.status,
        body,
      );
    }
    return body;
  }

  private async readResponseBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text.trim()) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}
