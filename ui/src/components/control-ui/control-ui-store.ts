import type { AssistantIdentity } from "../../ui/assistant-identity";
import type { DevicePairingList } from "../../ui/controllers/devices";
import type { GatewayBrowserClient, GatewayHelloOk } from "../../ui/gateway";
import type { Tab } from "../../ui/navigation";
import type { UiSettings } from "../../ui/storage";
import type {
  ChannelsStatusSnapshot,
  ConfigSnapshot,
  ConfigUiHints,
  CronJob,
  CronRunLogEntry,
  CronStatus,
  HealthSnapshot,
  LogEntry,
  PresenceEntry,
  SessionsListResult,
  SessionsUsageResult,
  CostUsageSummary,
  SessionUsageTimeSeries,
  SkillStatusReport,
  StatusSummary,
  ChannelAccountSnapshot,
  SessionsUsageEntry,
} from "../../ui/types";
import type { GatewaySessionRow } from "../../ui/types";
import type { ChatAttachment, ChatQueueItem, CronFormState } from "../../ui/ui-types";
import { DEFAULT_CRON_FORM, DEFAULT_LOG_LEVEL_FILTERS } from "../../ui/app-defaults";
import { resolveInjectedAssistantIdentity } from "../../ui/assistant-identity";
import {
  loadChannels,
  logoutWhatsApp,
  startWhatsAppLogin,
  waitWhatsAppLogin,
  type ChannelsState,
} from "../../ui/controllers/channels";
import {
  abortChatRun,
  loadChatHistory,
  sendChatMessage,
  type ChatState,
} from "../../ui/controllers/chat";
import { handleChatEvent, type ChatEventPayload } from "../../ui/controllers/chat";
import {
  loadConfig,
  loadConfigSchema,
  applyConfig,
  runUpdate,
  saveConfig,
  updateConfigFormValue,
  type ConfigState,
} from "../../ui/controllers/config";
import {
  loadCronJobs,
  loadCronRuns,
  loadCronStatus,
  addCronJob,
  toggleCronJob,
  runCronJob,
  removeCronJob,
  type CronState,
} from "../../ui/controllers/cron";
import { loadDebug, callDebugMethod, type DebugState } from "../../ui/controllers/debug";
import {
  loadDevices,
  approveDevicePairing,
  rejectDevicePairing,
  rotateDeviceToken,
  revokeDeviceToken,
  type DevicesState,
} from "../../ui/controllers/devices";
import { loadLogs, type LogsState } from "../../ui/controllers/logs";
import { loadNodes, type NodesState } from "../../ui/controllers/nodes";
import { loadPresence, type PresenceState } from "../../ui/controllers/presence";
import {
  loadSessions,
  patchSession,
  deleteSession,
  type SessionsState,
} from "../../ui/controllers/sessions";
import {
  installSkill,
  loadSkills,
  saveSkillApiKey,
  updateSkillEnabled,
  type SkillsState,
} from "../../ui/controllers/skills";
import {
  loadUsage,
  loadSessionLogs,
  loadSessionTimeSeries,
  type UsageState,
} from "../../ui/controllers/usage";
import { GatewayBrowserClient as BrowserGatewayClient } from "../../ui/gateway";
import { normalizeBasePath, type Tab as NavTab } from "../../ui/navigation";
import { saveSettings } from "../../ui/storage";

type EventEntry = {
  ts: number;
  event: string;
  payload?: unknown;
};

type ControlUiState = ChatState &
  ChannelsState &
  ConfigState &
  CronState &
  DebugState &
  DevicesState &
  LogsState &
  NodesState &
  PresenceState &
  SessionsState &
  SkillsState &
  UsageState & {
    basePath: string;
    tab: NavTab;
    settings: UiSettings;
    sessionKey: string;
    password: string;
    connected: boolean;
    hello: GatewayHelloOk | null;
    lastError: string | null;
    eventLog: EventEntry[];
    assistantName: string;
    assistantAvatar: string | null;
    assistantAgentId: string | null;
    client: BrowserGatewayClient | null;
    chatMessage: string;
    chatQueue: ChatQueueItem[];
    chatAttachments: ChatAttachment[];
    chatFocusMode: boolean;
    chatShowThinking: boolean;
    splitRatio: number;
    navCollapsed: boolean;
    navGroupsCollapsed: Record<string, boolean>;
    applySessionKey: string;
    configUiHints: ConfigUiHints;
    configSchemaVersion: string | null;
    configFormMode: "raw" | "form";
    configSearchQuery: string;
    configActiveSection: string | null;
    configActiveSubsection: string | null;
    configFormDirty: boolean;
    configValid: boolean | null;
    configIssues: unknown[];
    configRaw: string;
    configRawOriginal: string;
    configSnapshot: ConfigSnapshot | null;
    configSchema: unknown;
    configForm: Record<string, unknown> | null;
    configFormOriginal: Record<string, unknown> | null;
    configSaving: boolean;
    configApplying: boolean;
    updateRunning: boolean;
    usageSelectedSessions: string[];
    usageSelectedDays: string[];
    usageSelectedHours: number[];
    usageChartMode: "tokens" | "cost";
    usageDailyChartMode: "total" | "by-type";
    usageTimeSeriesMode: "cumulative" | "per-turn";
    usageTimeSeriesBreakdownMode: "total" | "by-type";
    usageSessionSort: "tokens" | "cost" | "recent" | "messages" | "errors";
    usageSessionSortDir: "asc" | "desc";
    usageRecentSessions: string[];
    usageTimeZone: "local" | "utc";
    usageContextExpanded: boolean;
    usageHeaderPinned: boolean;
    usageSessionsTab: "all" | "recent";
    usageVisibleColumns: string[];
    usageLogFilterRoles: Array<"user" | "assistant" | "tool" | "system">;
    usageLogFilterTools: string[];
    usageLogFilterHasTools: boolean;
    usageLogFilterQuery: string;
    logsFilterText: string;
    logsLevelFilters: Record<string, boolean>;
    logsAutoFollow: boolean;
    configError: string | null;
    channelAccounts: Record<string, ChannelAccountSnapshot[]>;
    channelOrder: string[];
    devicesList: DevicePairingList | null;
    presenceStatus: string | null;
    presenceError: string | null;
    sessionsError: string | null;
    sessionsFilterActive: string;
    sessionsFilterLimit: string;
    sessionsIncludeGlobal: boolean;
    sessionsIncludeUnknown: boolean;
    skillsFilter: string;
    skillsBusyKey: string | null;
    skillEdits: Record<string, string>;
    skillMessages: Record<string, { kind: "success" | "error"; message: string }>;
    chatThinkingLevel: string | null;
    chatLoading: boolean;
    chatSending: boolean;
    chatMessages: unknown[];
    chatStream: string | null;
    chatStreamStartedAt: number | null;
    chatRunId: string | null;
    chatManualRefreshInFlight: boolean;
  };

const DEFAULT_SETTINGS: UiSettings = {
  gatewayUrl: "",
  token: "",
  sessionKey: "main",
  lastActiveSessionKey: "main",
  theme: "dark",
  chatFocusMode: false,
  chatShowThinking: true,
  splitRatio: 0.6,
  navCollapsed: false,
  navGroupsCollapsed: {},
};

function nowDate(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function createEmptyState(): ControlUiState {
  const assistant = resolveInjectedAssistantIdentity();
  return {
    basePath: "",
    tab: "chat",
    settings: { ...DEFAULT_SETTINGS },
    sessionKey: DEFAULT_SETTINGS.sessionKey,
    password: "",
    connected: false,
    hello: null,
    lastError: null,
    eventLog: [],
    assistantName: assistant.name,
    assistantAvatar: assistant.avatar,
    assistantAgentId: assistant.agentId ?? null,
    client: null,
    chatMessage: "",
    chatQueue: [],
    chatAttachments: [],
    chatFocusMode: false,
    chatShowThinking: true,
    splitRatio: 0.6,
    navCollapsed: false,
    navGroupsCollapsed: {},
    configUiHints: {},
    configSchemaVersion: null,
    configFormMode: "raw",
    configSearchQuery: "",
    configActiveSection: null,
    configActiveSubsection: null,
    configFormDirty: false,
    configValid: null,
    configIssues: [],
    configRaw: "{\n}\n",
    configRawOriginal: "{\n}\n",
    configSnapshot: null,
    configSchema: null,
    configForm: null,
    configFormOriginal: null,
    configLoading: false,
    configSaving: false,
    configApplying: false,
    configSchemaLoading: false,
    updateRunning: false,
    applySessionKey: "main",
    usageSelectedSessions: [],
    usageSelectedDays: [],
    usageSelectedHours: [],
    usageChartMode: "tokens",
    usageDailyChartMode: "total",
    usageTimeSeriesMode: "cumulative",
    usageTimeSeriesBreakdownMode: "total",
    usageSessionSort: "recent",
    usageSessionSortDir: "desc",
    usageRecentSessions: [],
    usageTimeZone: "local",
    usageContextExpanded: false,
    usageHeaderPinned: false,
    usageSessionsTab: "all",
    usageVisibleColumns: ["session", "tokens", "cost"],
    usageLogFilterRoles: ["user", "assistant", "tool", "system"],
    usageLogFilterTools: [],
    usageLogFilterHasTools: false,
    usageLogFilterQuery: "",
    logsFilterText: "",
    logsLevelFilters: { ...DEFAULT_LOG_LEVEL_FILTERS },
    logsAutoFollow: true,
    configError: null,
    channelAccounts: {},
    channelOrder: [],
    devicesList: null,
    presenceLoading: false,
    presenceEntries: [],
    presenceStatus: null,
    presenceError: null,
    sessionsError: null,
    sessionsFilterActive: "",
    sessionsFilterLimit: "100",
    sessionsIncludeGlobal: true,
    sessionsIncludeUnknown: true,
    skillsFilter: "",
    skillsBusyKey: null,
    skillEdits: {},
    skillMessages: {},
    chatThinkingLevel: null,
    chatLoading: false,
    chatSending: false,
    chatMessages: [],
    chatStream: null,
    chatStreamStartedAt: null,
    chatRunId: null,
    chatManualRefreshInFlight: false,
    cronLoading: false,
    cronJobs: [],
    cronStatus: null,
    cronError: null,
    cronForm: { ...DEFAULT_CRON_FORM },
    cronRunsJobId: null,
    cronRuns: [],
    cronBusy: false,
    debugLoading: false,
    debugStatus: null,
    debugHealth: null,
    debugModels: [],
    debugHeartbeat: null,
    debugCallMethod: "system-presence",
    debugCallParams: "{}",
    debugCallResult: null,
    debugCallError: null,
    logsLoading: false,
    logsError: null,
    logsCursor: null,
    logsFile: null,
    logsEntries: [],
    logsTruncated: false,
    logsLastFetchAt: null,
    logsLimit: 250,
    logsMaxBytes: 250_000,
    usageLoading: false,
    usageResult: null,
    usageCostSummary: null,
    usageError: null,
    usageStartDate: nowDate(7),
    usageEndDate: nowDate(0),
    usageTimeSeries: null,
    usageTimeSeriesLoading: false,
    usageSessionLogs: null,
    usageSessionLogsLoading: false,
    nodesLoading: false,
    nodes: [],
    nodesError: null,
    devicesLoading: false,
    devicesError: null,
    execApprovalsLoading: false,
    execApprovalsSaving: false,
    execApprovalsDirty: false,
    execApprovalsSnapshot: null,
    execApprovalsForm: null,
    execApprovalsSelectedAgent: null,
    execApprovalsTarget: "gateway",
    execApprovalsTargetNodeId: null,
    execApprovalQueue: [],
    execApprovalBusy: false,
    execApprovalError: null,
    pendingGatewayUrl: null,
    channelsLoading: false,
    channelsSnapshot: null,
    channelsError: null,
    channelsLastSuccess: null,
    whatsappLoginMessage: null,
    whatsappLoginQrDataUrl: null,
    whatsappLoginConnected: null,
    whatsappBusy: false,
    nostrProfileFormState: null,
    nostrProfileAccountId: null,
  } as unknown as ControlUiState;
}

export type ControlUiStore = ControlUiState & {
  touch: () => void;
  setBasePath: (next: string) => void;
  setTab: (next: NavTab) => void;
  applyLoadedSettings: (next: UiSettings) => void;
  updateSetting: <K extends keyof UiSettings>(key: K, value: UiSettings[K]) => void;
  updatePassword: (next: string) => void;
  consumeLaunchParams: () => void;
  connect: () => void;
  disconnect: () => void;
  refreshTab: (tab?: NavTab) => Promise<void>;
  refreshChat: () => Promise<void>;
  refreshOverview: () => Promise<void>;
  refreshChannels: (probe?: boolean) => Promise<void>;
  startWhatsAppLogin: (force: boolean) => Promise<void>;
  waitWhatsAppLogin: () => Promise<void>;
  logoutWhatsApp: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  refreshCron: () => Promise<void>;
  refreshSkills: () => Promise<void>;
  refreshNodes: () => Promise<void>;
  refreshConfig: () => Promise<void>;
  refreshDebug: () => Promise<void>;
  refreshLogs: (reset?: boolean) => Promise<void>;
  sendChat: (text?: string) => Promise<void>;
  abortChat: () => Promise<void>;
  clearChatDraft: () => void;
  selectUsageSession: (sessionKey: string) => Promise<void>;
  selectConfigRaw: (raw: string) => void;
  saveConfig: () => Promise<void>;
  applyConfig: () => Promise<void>;
  runUpdate: () => Promise<void>;
  addCronJob: () => Promise<void>;
  toggleCronJob: (job: CronJob, enabled: boolean) => Promise<void>;
  runCronJob: (job: CronJob) => Promise<void>;
  removeCronJob: (job: CronJob) => Promise<void>;
  loadCronRuns: (jobId: string) => Promise<void>;
  updateSkillEnabled: (skillKey: string, enabled: boolean) => Promise<void>;
  saveSkillApiKey: (skillKey: string) => Promise<void>;
  installSkill: (skillKey: string, name: string, installId: string) => Promise<void>;
  loadDevices: () => Promise<void>;
  approveDevice: (requestId: string) => Promise<void>;
  rejectDevice: (requestId: string) => Promise<void>;
  rotateDeviceToken: (params: {
    deviceId: string;
    role: string;
    scopes?: string[];
  }) => Promise<void>;
  revokeDeviceToken: (params: { deviceId: string; role: string }) => Promise<void>;
  patchSession: (
    key: string,
    patch: {
      label?: string | null;
      thinkingLevel?: string | null;
      verboseLevel?: string | null;
      reasoningLevel?: string | null;
    },
  ) => Promise<void>;
  deleteSession: (key: string) => Promise<void>;
  callDebugMethod: () => Promise<void>;
};

function consumeBrowserParams(store: ControlUiStore) {
  if (typeof window === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  let changed = false;

  const token = params.get("token") ?? hashParams.get("token");
  const password = params.get("password") ?? hashParams.get("password");
  const session = params.get("session") ?? hashParams.get("session");
  const gatewayUrl = params.get("gatewayUrl") ?? hashParams.get("gatewayUrl");

  if (typeof token === "string" && token.trim()) {
    store.updateSetting("token", token.trim());
    params.delete("token");
    hashParams.delete("token");
    changed = true;
  }

  if (typeof password === "string" && password.trim()) {
    store.updatePassword(password.trim());
    params.delete("password");
    hashParams.delete("password");
    changed = true;
  }

  if (typeof session === "string" && session.trim()) {
    store.updateSetting("sessionKey", session.trim());
    store.updateSetting("lastActiveSessionKey", session.trim());
    params.delete("session");
    hashParams.delete("session");
    changed = true;
  }

  if (typeof gatewayUrl === "string" && gatewayUrl.trim()) {
    store.updateSetting("gatewayUrl", gatewayUrl.trim());
    params.delete("gatewayUrl");
    hashParams.delete("gatewayUrl");
    changed = true;
  }

  if (!changed) {
    return;
  }

  url.search = params.toString();
  const nextHash = hashParams.toString();
  url.hash = nextHash ? `#${nextHash}` : "";
  window.history.replaceState({}, "", url.toString());
}

export function createControlUiStore(onChange: () => void): ControlUiStore {
  const state = createEmptyState();
  let reconnectTimer: number | null = null;

  const notify = () => onChange();

  const store: ControlUiStore = {
    ...state,
    setBasePath(next) {
      const normalized = normalizeBasePath(next);
      if (store.basePath !== normalized) {
        store.basePath = normalized;
        notify();
      }
    },
    touch() {
      notify();
    },
    setTab(next) {
      if (store.tab !== next) {
        store.tab = next;
        notify();
      }
    },
    applyLoadedSettings(next) {
      store.settings = {
        ...DEFAULT_SETTINGS,
        ...next,
        theme: "dark",
        lastActiveSessionKey:
          next.lastActiveSessionKey?.trim() || next.sessionKey?.trim() || "main",
      };
      store.sessionKey = store.settings.sessionKey;
      store.chatFocusMode = store.settings.chatFocusMode;
      store.chatShowThinking = store.settings.chatShowThinking;
      store.splitRatio = store.settings.splitRatio;
      store.navCollapsed = store.settings.navCollapsed;
      store.navGroupsCollapsed = store.settings.navGroupsCollapsed;
      store.applySessionKey = store.settings.lastActiveSessionKey;
      saveSettings(store.settings);
      notify();
    },
    updateSetting(key, value) {
      if (key === "sessionKey") {
        const next = String(value ?? "").trim() || "main";
        store.settings = {
          ...store.settings,
          sessionKey: next,
          lastActiveSessionKey: next,
        };
        store.sessionKey = next;
        store.applySessionKey = next;
      } else if (key === "lastActiveSessionKey") {
        const next = String(value ?? "").trim() || store.settings.sessionKey || "main";
        store.settings = {
          ...store.settings,
          lastActiveSessionKey: next,
        };
        store.sessionKey = next;
        store.applySessionKey = next;
      } else {
        store.settings = {
          ...store.settings,
          [key]: value,
        };
      }
      store.chatFocusMode = store.settings.chatFocusMode;
      store.chatShowThinking = store.settings.chatShowThinking;
      store.splitRatio = store.settings.splitRatio;
      store.navCollapsed = store.settings.navCollapsed;
      store.navGroupsCollapsed = store.settings.navGroupsCollapsed;
      saveSettings(store.settings);
      notify();
    },
    updatePassword(next) {
      store.password = next;
      notify();
    },
    consumeLaunchParams() {
      consumeBrowserParams(store);
    },
    connect() {
      if (typeof window === "undefined") {
        return;
      }
      store.lastError = null;
      store.hello = null;
      store.connected = false;
      store.client?.stop();
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      store.client = new BrowserGatewayClient({
        url: store.settings.gatewayUrl,
        token: store.settings.token.trim() ? store.settings.token : undefined,
        password: store.password.trim() ? store.password : undefined,
        clientName: "opin-control-ui",
        mode: "webchat",
        onHello: (hello) => {
          store.connected = true;
          store.hello = hello;
          store.lastError = null;
          notify();
          void store.refreshTab(store.tab);
        },
        onClose: ({ code, reason }) => {
          store.connected = false;
          if (code !== 1012) {
            store.lastError = `disconnected (${code}): ${reason || "no reason"}`;
          }
          notify();
        },
        onEvent: (evt) => {
          store.eventLog = [
            { ts: Date.now(), event: evt.event, payload: evt.payload },
            ...store.eventLog,
          ].slice(0, 200);
          if (evt.event === "presence" && evt.payload && typeof evt.payload === "object") {
            const payload = evt.payload as { presence?: PresenceEntry[] };
            if (Array.isArray(payload.presence)) {
              store.presenceEntries = payload.presence;
            }
          }
          if (evt.event === "chat") {
            const payload = evt.payload as ChatEventPayload | undefined;
            const state = handleChatEvent(store, payload);
            if (state === "final" || state === "error" || state === "aborted") {
              void store.refreshChat();
            }
          }
          notify();
        },
      });
      store.client.start();
      notify();
    },
    disconnect() {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      store.client?.stop();
      store.client = null;
      store.connected = false;
      notify();
    },
    async refreshTab(tab = store.tab) {
      switch (tab) {
        case "chat":
          await store.refreshChat();
          break;
        case "overview":
          await store.refreshOverview();
          break;
        case "channels":
          await store.refreshChannels(true);
          break;
        case "instances":
          await loadPresence(store);
          break;
        case "sessions":
          await store.refreshSessions();
          break;
        case "usage":
          await store.refreshUsage();
          break;
        case "cron":
          await store.refreshCron();
          break;
        case "skills":
          await store.refreshSkills();
          break;
        case "nodes":
          await store.refreshNodes();
          break;
        case "config":
          await store.refreshConfig();
          break;
        case "debug":
          await store.refreshDebug();
          break;
        case "logs":
          await store.refreshLogs(true);
          break;
      }
      notify();
    },
    async refreshChat() {
      await loadChatHistory(store);
      notify();
    },
    async refreshOverview() {
      await Promise.all([
        loadChannels(store, false),
        loadPresence(store),
        loadSessions(store),
        loadCronStatus(store),
        loadDebug(store),
      ]);
      notify();
    },
    async refreshChannels(probe = true) {
      await loadChannels(store, probe);
      notify();
    },
    async startWhatsAppLogin(force) {
      await startWhatsAppLogin(store, force);
      notify();
    },
    async waitWhatsAppLogin() {
      await waitWhatsAppLogin(store);
      notify();
    },
    async logoutWhatsApp() {
      await logoutWhatsApp(store);
      notify();
    },
    async refreshSessions() {
      await loadSessions(store);
      notify();
    },
    async refreshUsage() {
      await loadUsage(store);
      notify();
    },
    async refreshCron() {
      await Promise.all([loadCronStatus(store), loadCronJobs(store)]);
      notify();
    },
    async refreshSkills() {
      await loadSkills(store);
      notify();
    },
    async refreshNodes() {
      await Promise.all([loadNodes(store), loadDevices(store)]);
      notify();
    },
    async refreshConfig() {
      await Promise.all([loadConfigSchema(store), loadConfig(store)]);
      notify();
    },
    async refreshDebug() {
      await loadDebug(store);
      notify();
    },
    async refreshLogs(reset = false) {
      await loadLogs(store, { reset });
      notify();
    },
    async sendChat(text?: string) {
      const msg = text !== undefined ? text : store.chatMessage;
      await sendChatMessage(store, msg, text !== undefined ? [] : store.chatAttachments);
      if (text === undefined) {
        store.chatMessage = "";
        store.chatAttachments = [];
      }
      notify();
    },
    async abortChat() {
      await abortChatRun(store);
      notify();
    },
    clearChatDraft() {
      store.chatMessage = "";
      notify();
    },
    async selectUsageSession(sessionKey: string) {
      store.usageSelectedSessions = [sessionKey];
      await Promise.all([
        loadSessionTimeSeries(store, sessionKey),
        loadSessionLogs(store, sessionKey),
      ]);
      notify();
    },
    selectConfigRaw(raw: string) {
      store.configRaw = raw;
      notify();
    },
    async saveConfig() {
      await saveConfig(store);
      notify();
    },
    async applyConfig() {
      await applyConfig(store);
      notify();
    },
    async runUpdate() {
      await runUpdate(store);
      notify();
    },
    async addCronJob() {
      await addCronJob(store);
      notify();
    },
    async toggleCronJob(job, enabled) {
      await toggleCronJob(store, job, enabled);
      notify();
    },
    async runCronJob(job) {
      await runCronJob(store, job);
      notify();
    },
    async removeCronJob(job) {
      await removeCronJob(store, job);
      notify();
    },
    async loadCronRuns(jobId) {
      await loadCronRuns(store, jobId);
      notify();
    },
    async updateSkillEnabled(skillKey, enabled) {
      await updateSkillEnabled(store, skillKey, enabled);
      notify();
    },
    async saveSkillApiKey(skillKey) {
      await saveSkillApiKey(store, skillKey);
      notify();
    },
    async installSkill(skillKey, name, installId) {
      await installSkill(store, skillKey, name, installId);
      notify();
    },
    async loadDevices() {
      await loadDevices(store);
      notify();
    },
    async approveDevice(requestId) {
      await approveDevicePairing(store, requestId);
      notify();
    },
    async rejectDevice(requestId) {
      await rejectDevicePairing(store, requestId);
      notify();
    },
    async rotateDeviceToken(params) {
      await rotateDeviceToken(store, params);
      notify();
    },
    async revokeDeviceToken(params) {
      await revokeDeviceToken(store, params);
      notify();
    },
    async patchSession(key, patch) {
      await patchSession(store, key, patch);
      notify();
    },
    async deleteSession(key) {
      await deleteSession(store, key);
      notify();
    },
    async callDebugMethod() {
      await callDebugMethod(store);
      notify();
    },
  };

  return store;
}

export function applyStaticSettingsFromParams(store: ControlUiStore, url: URL) {
  const params = url.searchParams;
  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  let changed = false;

  const token = params.get("token") ?? hashParams.get("token");
  const password = params.get("password") ?? hashParams.get("password");
  const session = params.get("session") ?? hashParams.get("session");
  const gatewayUrl = params.get("gatewayUrl") ?? hashParams.get("gatewayUrl");

  if (typeof token === "string" && token.trim()) {
    store.updateSetting("token", token.trim());
    params.delete("token");
    hashParams.delete("token");
    changed = true;
  }

  if (typeof password === "string" && password.trim()) {
    store.updatePassword(password.trim());
    params.delete("password");
    hashParams.delete("password");
    changed = true;
  }

  if (typeof session === "string" && session.trim()) {
    store.updateSetting("sessionKey", session.trim());
    params.delete("session");
    hashParams.delete("session");
    changed = true;
  }

  if (typeof gatewayUrl === "string" && gatewayUrl.trim()) {
    store.updateSetting("gatewayUrl", gatewayUrl.trim());
    params.delete("gatewayUrl");
    hashParams.delete("gatewayUrl");
    changed = true;
  }

  if (!changed) {
    return;
  }

  url.search = params.toString();
  const nextHash = hashParams.toString();
  url.hash = nextHash ? `#${nextHash}` : "";
  window.history.replaceState({}, "", url.toString());
}
