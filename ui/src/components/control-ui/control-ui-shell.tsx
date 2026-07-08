"use client";

import type { ReactNode } from "react";
import { Button, Card, Input, Separator, Tabs, TextArea } from "@heroui/react";
import { useRouter } from "next/navigation";
import type { SessionsUsageEntry } from "../../ui/types";
import { extractText, extractThinking } from "../../ui/chat/message-extract";
import { normalizeMessage, normalizeRoleForGrouping } from "../../ui/chat/message-normalizer";
import {
  formatDurationHuman,
  formatList,
  formatMs,
  formatRelativeTimestamp,
  toNumber,
} from "../../ui/format";
import { pathForTab, subtitleForTab, titleForTab, type Tab } from "../../ui/navigation";
import { useControlUiStore } from "./control-ui-provider";
import { Markdown } from "./markdown";

const TABS: Tab[] = [
  "chat",
  "overview",
  "channels",
  "instances",
  "sessions",
  "usage",
  "cron",
  "skills",
  "nodes",
  "config",
  "debug",
  "logs",
];

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return String(value);
  }
}

function getGatewayAuthLabel(token: string, password: string) {
  if (token.trim()) {
    return "token";
  }
  if (password.trim()) {
    return "password";
  }
  return "not set";
}

function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card variant="secondary" className="border border-white/10 bg-white/5 shadow-none">
      <Card.Header className="space-y-1">
        <Card.Description>{label}</Card.Description>
        <Card.Title>{value}</Card.Title>
      </Card.Header>
      {note ? <Card.Content className="text-sm text-white/65">{note}</Card.Content> : null}
    </Card>
  );
}

function PanelCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card variant="secondary" className="border border-white/10 bg-white/5 shadow-none">
      <Card.Header className="space-y-1">
        <Card.Title>{title}</Card.Title>
        {description ? <Card.Description>{description}</Card.Description> : null}
      </Card.Header>
      <Card.Content className="space-y-4">{children}</Card.Content>
      {footer ? <Card.Footer>{footer}</Card.Footer> : null}
    </Card>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
      {children}
    </div>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[32rem] overflow-auto rounded-2xl border border-white/10 bg-black/35 p-4 text-xs leading-6 text-white/80">
      {formatJson(value)}
    </pre>
  );
}

function SessionKeyBadge({ value }: { value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/75">
      {value}
    </span>
  );
}

function MessageCard({ message }: { message: unknown }) {
  const normalized = normalizeMessage(message);
  const text = extractText(message);
  const thinking = extractThinking(message);
  const role = normalizeRoleForGrouping(normalized.role);
  const time = new Date(normalized.timestamp).toLocaleString();
  const isAssistant = role === "assistant";
  const content = text?.trim();

  return (
    <Card
      variant="secondary"
      className={`border ${isAssistant ? "border-cyan-400/20 bg-cyan-400/5" : "border-white/10 bg-white/5"} shadow-none`}
    >
      <Card.Header className="flex-row items-center justify-between gap-4">
        <div>
          <Card.Title className="capitalize">{role}</Card.Title>
          <Card.Description>{time}</Card.Description>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/50">
          {normalized.content.length} blocks
        </span>
      </Card.Header>
      <Card.Content className="space-y-3">
        {content ? <Markdown content={content} className="prose prose-invert max-w-none" /> : null}
        {!content ? <JsonBlock value={normalized.content} /> : null}
        {thinking ? (
          <details className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
            <summary className="cursor-pointer text-white/80">Thinking</summary>
            <Markdown
              content={thinking}
              className="prose prose-invert mt-3 max-w-none opacity-80"
            />
          </details>
        ) : null}
      </Card.Content>
    </Card>
  );
}

function ChannelAccountCard({
  channel,
  account,
}: {
  channel: string;
  account: Record<string, unknown>;
}) {
  const accountId = String(account.accountId ?? account.id ?? "account");
  const statusBits = [
    account.enabled === false ? "disabled" : null,
    account.configured === false ? "unconfigured" : null,
    account.linked === false ? "unlinked" : null,
    account.running === false ? "stopped" : null,
    account.connected === false ? "offline" : null,
  ].filter(Boolean) as string[];

  return (
    <Card variant="secondary" className="border border-white/10 bg-white/5 shadow-none">
      <Card.Header className="space-y-1">
        <Card.Title className="capitalize">{String(account.name ?? accountId)}</Card.Title>
        <Card.Description>
          {channel} · {accountId}
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-2 text-sm text-white/70">
        <div>Status: {statusBits.length ? statusBits.join(", ") : "healthy"}</div>
        {account.lastError ? (
          <div className="text-rose-300">Last error: {String(account.lastError)}</div>
        ) : null}
        <div className="text-xs text-white/45">
          {account.webhookUrl ? `Webhook ${String(account.webhookUrl)}` : null}
        </div>
      </Card.Content>
    </Card>
  );
}

function LogEntryCard({ entry }: { entry: Record<string, unknown> }) {
  return (
    <Card variant="secondary" className="border border-white/10 bg-white/5 shadow-none">
      <Card.Header className="space-y-1">
        <Card.Title className="capitalize">{String(entry.level ?? "info")}</Card.Title>
        <Card.Description>
          {String(entry.time ?? entry.ts ?? "n/a")}{" "}
          {entry.subsystem ? `· ${String(entry.subsystem)}` : ""}
        </Card.Description>
      </Card.Header>
      <Card.Content className="text-sm text-white/75">
        {String(entry.message ?? entry.raw ?? "")}
      </Card.Content>
    </Card>
  );
}
function resolveSessionRows(currentKey: string, sessions: any) {
  const rows = sessions?.sessions ?? [];
  if (rows.some((row: any) => row.key === currentKey)) {
    return rows;
  }
  return [
    {
      key: currentKey,
      kind: "unknown",
      updatedAt: null,
    },
    ...rows,
  ];
}

function resolveSessionDisplayName(key: string, row?: any): string {
  if (!row) {
    return key;
  }
  const label = row.label?.trim();
  const displayName = row.displayName?.trim();
  if (label && label !== key) {
    return label;
  }
  if (displayName && displayName !== key) {
    return displayName;
  }
  return key;
}

export function ControlUiShell({ activeTab }: { activeTab: Tab }) {
  const store = useControlUiStore();
  const router = useRouter();
  const navCollapsed = store.settings.navCollapsed ?? false;
  const isChat = activeTab === "chat";

  // Sidebar categories & tabs mapping:
  const GROUPS = [
    {
      label: "Chat",
      tabs: ["chat"] as Tab[],
    },
    {
      label: "Control",
      tabs: ["overview", "channels", "instances", "sessions", "usage", "cron"] as Tab[],
    },
    {
      label: "Agent",
      tabs: ["skills", "nodes"] as Tab[],
    },
    {
      label: "Settings",
      tabs: ["config", "debug", "logs"] as Tab[],
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white font-sans selection:bg-cyan-500/30 selection:text-white">
      {/* 1. Global Navigation Sidebar (Column 1) */}
      <aside
        className={`flex flex-col h-full bg-neutral-950/40 border-r border-white/10 backdrop-blur-xl transition-all duration-300 ease-in-out shrink-0 ${
          navCollapsed ? "w-0 opacity-0 pointer-events-none border-none" : "w-[252px] opacity-100"
        }`}
      >
        {/* Brand/Logo Section */}
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg tracking-tight text-white">OpinCore</span>
            <span className="rounded-full bg-neutral-800 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-neutral-400">
              Beta
            </span>
          </div>
          <div className="h-px bg-white/10 w-full" />
        </div>

        {/* Vertical Tab Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-6 scrollbar-none">
          {GROUPS.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.tabs.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        store.setTab(tab);
                        router.push(pathForTab(tab, store.basePath));
                      }}
                      className={`w-full text-left px-4 py-2 text-sm rounded-full transition-all duration-200 ${
                        isActive
                          ? "bg-white text-black font-semibold"
                          : "text-white/65 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {titleForTab(tab)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Gateway Status & Expandable Config Drawer */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-black/20">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${store.connected ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`}
              />
              <span className="text-xs font-medium text-white/70">Gateway</span>
            </div>
            <span className="text-[10px] font-mono text-white/40">
              {store.connected ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          <details className="group rounded-2xl border border-white/10 bg-neutral-900/50 p-2.5 text-xs">
            <summary className="cursor-pointer font-medium text-white/70 px-2 py-1 flex items-center justify-between select-none">
              <span>Gateway Settings</span>
              <span className="text-white/40 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-2 space-y-2.5 p-1">
              <div className="space-y-1">
                <span className="text-[10px] text-white/45">URL</span>
                <input
                  value={store.settings.gatewayUrl}
                  onChange={(e) => store.updateSetting("gatewayUrl", e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-white/30"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-white/45">Token</span>
                <input
                  value={store.settings.token}
                  onChange={(e) => store.updateSetting("token", e.target.value)}
                  type="password"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-white/30"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-white/45">Password</span>
                <input
                  value={store.password}
                  onChange={(e) => store.updatePassword(e.target.value)}
                  type="password"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-white/30"
                />
              </div>
              <button
                onClick={() => store.connect()}
                className="w-full py-2 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors mt-2"
              >
                Connect
              </button>
            </div>
          </details>
        </div>
      </aside>

      {/* 2. Main Content & Views (Column 2 or 2+3 for Chat) */}
      <main className="flex-1 flex h-full overflow-hidden min-w-0 bg-black">
        {isChat ? (
          <div className="flex flex-1 h-full overflow-hidden min-w-0">
            {/* Chat Session List (Column 2) */}
            <aside className="w-[260px] border-r border-white/10 flex flex-col h-full bg-black shrink-0">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-white/45 uppercase tracking-wider font-semibold">
                    Start chat
                  </div>
                  <div className="text-sm font-semibold text-white truncate max-w-[130px]">
                    {store.settings.sessionKey || "main"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      store.updateSetting("navCollapsed", !store.settings.navCollapsed)
                    }
                    className="p-1.5 hover:bg-white/5 rounded-full border border-white/10 text-white/70 hover:text-white"
                    title="Toggle navigation sidebar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => store.sendChat("/new")}
                    className="px-3 py-1.5 bg-white text-black text-xs font-semibold rounded-full hover:bg-neutral-200 transition-colors"
                  >
                    New
                  </button>
                </div>
              </div>

              {/* Sessions list rows */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
                {resolveSessionRows(store.settings.sessionKey || "main", store.sessionsResult).map(
                  (row: any) => {
                    const isActive = row.key === store.settings.sessionKey;
                    const displayName = resolveSessionDisplayName(row.key, row) ?? row.key;
                    const updated = row.updatedAt
                      ? new Date(row.updatedAt).toLocaleTimeString()
                      : null;
                    return (
                      <button
                        key={row.key}
                        onClick={() => store.updateSetting("sessionKey", row.key)}
                        className={`w-full text-left p-3 rounded-2xl flex flex-col gap-1 transition-all ${
                          isActive
                            ? "bg-white/10 border border-white/10"
                            : "hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <span
                          className={`text-sm truncate w-full ${isActive ? "text-white font-medium" : "text-white/75"}`}
                        >
                          {displayName}
                        </span>
                        {updated && <span className="text-[10px] text-white/35">{updated}</span>}
                      </button>
                    );
                  },
                )}
              </div>
            </aside>

            {/* Chat Conversation & Composer Workspace (Column 3) */}
            <div className="flex-1 flex flex-col h-full relative min-w-0 bg-black">
              {/* Scrollable messages container */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-28 scrollbar-none">
                {store.chatLoading ? (
                  <div className="text-center py-10 text-white/40 text-sm">Loading history…</div>
                ) : store.chatMessages.length === 0 ? (
                  <div className="text-center py-20 text-white/40 text-sm">
                    No messages yet. Send a message to start a session.
                  </div>
                ) : (
                  store.chatMessages.map((message, idx) => {
                    const normalized = normalizeMessage(message);
                    const text = extractText(message);
                    const thinking = extractThinking(message);
                    const role = normalizeRoleForGrouping(normalized.role);
                    const isAssistant = role === "assistant";
                    const content = text?.trim();

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col gap-1 ${isAssistant ? "items-start" : "items-end"}`}
                      >
                        <div className="text-[10px] text-white/40 px-2 capitalize">{role}</div>
                        <div
                          className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                            isAssistant
                              ? "bg-white/5 border border-white/10 text-white/90"
                              : "bg-white text-black font-normal"
                          }`}
                        >
                          {content && (
                            <Markdown
                              content={content}
                              className="prose prose-invert max-w-none break-words"
                            />
                          )}
                          {!content && <JsonBlock value={normalized.content} />}
                          {thinking && (
                            <details className="mt-2 rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white/70">
                              <summary className="cursor-pointer text-white/80 select-none">
                                Thinking
                              </summary>
                              <Markdown
                                content={thinking}
                                className="prose prose-invert mt-2 max-w-none opacity-80 break-words"
                              />
                            </details>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Streaming Assistant message */}
                {store.chatStream && (
                  <div className="flex flex-col gap-1 items-start">
                    <div className="text-[10px] text-white/40 px-2 capitalize">
                      Assistant (Streaming)
                    </div>
                    <div className="max-w-[75%] px-4 py-3 rounded-2xl text-sm bg-white/5 border border-white/10 text-white/90">
                      <Markdown
                        content={store.chatStream}
                        className="prose prose-invert max-w-none break-words"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Absolutely Bottom Compose capsule container */}
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <div className="flex flex-col w-full bg-neutral-900/90 backdrop-blur-md border border-white/10 rounded-3xl p-2.5">
                  <div className="flex items-center gap-2">
                    <textarea
                      value={store.chatMessage}
                      onChange={(e) => {
                        store.chatMessage = e.target.value;
                        store.touch();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (store.chatMessage.trim()) {
                            void store.sendChat();
                          }
                        }
                      }}
                      placeholder="Type a message..."
                      rows={1}
                      className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none focus:ring-0 resize-none px-2 max-h-24 scrollbar-none"
                      style={{ height: "auto" }}
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      {store.chatRunId && (
                        <button
                          onClick={() => store.abortChat()}
                          className="px-3 py-1.5 bg-neutral-800 border border-white/10 hover:bg-neutral-700 text-xs font-semibold rounded-full transition-colors"
                        >
                          Abort
                        </button>
                      )}
                      <button
                        onClick={() => store.sendChat()}
                        disabled={!store.chatMessage.trim() && store.chatAttachments.length === 0}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          store.chatMessage.trim()
                            ? "bg-white text-black hover:opacity-90 active:scale-95"
                            : "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5"
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 19V5m0 0l-7 7m7-7l7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-y-auto px-8 py-8 gap-6 scrollbar-none">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                {titleForTab(activeTab)}
              </h1>
              <p className="text-sm text-white/60">{subtitleForTab(activeTab)}</p>
            </div>
            <div className="h-px bg-white/10 w-full" />
            <div className="flex-1">
              {activeTab === "overview"
                ? renderOverviewPanel(store, router)
                : activeTab === "channels"
                  ? renderChannelsPanel(store)
                  : activeTab === "instances"
                    ? renderInstancesPanel(store)
                    : activeTab === "sessions"
                      ? renderSessionsPanel(store)
                      : activeTab === "usage"
                        ? renderUsagePanel(store)
                        : activeTab === "cron"
                          ? renderCronPanel(store)
                          : activeTab === "skills"
                            ? renderSkillsPanel(store)
                            : activeTab === "nodes"
                              ? renderNodesPanel(store)
                              : activeTab === "config"
                                ? renderConfigPanel(store)
                                : activeTab === "debug"
                                  ? renderDebugPanel(store)
                                  : renderLogsPanel(store)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function renderOverviewPanel(
  store: ReturnType<typeof useControlUiStore>,
  router: ReturnType<typeof useRouter>,
) {
  const uptime =
    store.hello?.snapshot && typeof store.hello.snapshot === "object"
      ? formatDurationHuman((store.hello.snapshot as { uptimeMs?: number }).uptimeMs ?? 0)
      : "n/a";
  const tickMs = store.hello?.policy?.tickIntervalMs
    ? `${store.hello.policy.tickIntervalMs}ms`
    : "n/a";

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label="Gateway"
          value={store.connected ? "Online" : "Offline"}
          note={`Uptime ${uptime}`}
        />
        <StatCard
          label="Session"
          value={store.settings.sessionKey || "main"}
          note={`Last active ${store.settings.lastActiveSessionKey || "main"}`}
        />
        <StatCard
          label="Auth"
          value={getGatewayAuthLabel(store.settings.token, store.password)}
          note={`Tick interval ${tickMs}`}
        />
        <StatCard
          label="Last error"
          value={store.lastError ? "Attention" : "Clear"}
          note={store.lastError ?? "No connection issues detected."}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <PanelCard
          title="Connection snapshot"
          description="The live hello payload from the local gateway."
        >
          <JsonBlock value={store.hello} />
        </PanelCard>
        <PanelCard title="Quick links" description="Jump into the most common control surfaces.">
          <div className="grid gap-3 sm:grid-cols-2">
            {(["channels", "sessions", "config", "logs"] as Tab[]).map((tab) => (
              <Button
                key={tab}
                variant="secondary"
                className="justify-start border border-white/10"
                onPress={() => router.push(pathForTab(tab, store.basePath))}
              >
                {titleForTab(tab)}
              </Button>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}

function renderChannelsPanel(store: ReturnType<typeof useControlUiStore>) {
  const snapshot = store.channelsSnapshot as {
    channelOrder?: string[];
    channelLabels?: Record<string, string>;
    channelAccounts?: Record<string, Array<Record<string, unknown>>>;
  } | null;
  const channelEntries = snapshot?.channelOrder?.length
    ? snapshot.channelOrder
    : Object.keys(snapshot?.channelAccounts ?? {});

  return (
    <div className="space-y-5">
      <PanelCard
        title="Channels"
        description="Inspect the current channel availability snapshot and start or stop logins."
        footer={
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onPress={() => store.refreshChannels(true)}>
              Probe channels
            </Button>
            <Button variant="secondary" onPress={() => store.refreshChannels(false)}>
              Refresh
            </Button>
            <Button variant="secondary" onPress={() => store.refreshTab("overview")}>
              Sync overview
            </Button>
          </div>
        }
      >
        <JsonBlock value={store.channelsSnapshot} />
      </PanelCard>

      <div className="grid gap-4 xl:grid-cols-2">
        {channelEntries.map((channel) => {
          const accounts = snapshot?.channelAccounts?.[channel] ?? [];
          return (
            <PanelCard
              key={channel}
              title={String(snapshot?.channelLabels?.[channel] ?? channel)}
              description={`Accounts: ${accounts.length}`}
            >
              <div className="grid gap-3">
                {accounts.length === 0 ? (
                  <div className="text-sm text-white/55">No accounts configured.</div>
                ) : (
                  accounts.map((account, index) => (
                    <ChannelAccountCard key={index} channel={channel} account={account} />
                  ))
                )}
              </div>
            </PanelCard>
          );
        })}
      </div>

      <PanelCard
        title="WhatsApp session"
        description="Local WhatsApp web login status and actions."
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onPress={() => store.startWhatsAppLogin(false)}>
            Start login
          </Button>
          <Button variant="secondary" onPress={() => store.waitWhatsAppLogin()}>
            Wait for login
          </Button>
          <Button variant="secondary" onPress={() => store.logoutWhatsApp()}>
            Logout
          </Button>
        </div>
        <div className="space-y-2 text-sm text-white/70">
          <div>Message: {store.whatsappLoginMessage ?? "none"}</div>
          <div>
            Connected:{" "}
            {store.whatsappLoginConnected == null
              ? "unknown"
              : store.whatsappLoginConnected
                ? "yes"
                : "no"}
          </div>
        </div>
      </PanelCard>
    </div>
  );
}

function renderInstancesPanel(store: ReturnType<typeof useControlUiStore>) {
  return (
    <div className="space-y-5">
      <PanelCard title="Instances" description="Presence beacons and connected client metadata.">
        <div className="grid gap-4 lg:grid-cols-2">
          {store.presenceEntries.length === 0 ? (
            <div className="text-sm text-white/55">No presence entries found.</div>
          ) : (
            store.presenceEntries.map((entry, index) => (
              <Card
                key={index}
                variant="secondary"
                className="border border-white/10 bg-white/5 shadow-none"
              >
                <Card.Header className="space-y-1">
                  <Card.Title>
                    {String(entry.instanceId ?? entry.host ?? `instance-${index + 1}`)}
                  </Card.Title>
                  <Card.Description>{String(entry.version ?? "unknown version")}</Card.Description>
                </Card.Header>
                <Card.Content className="space-y-1 text-sm text-white/70">
                  <div>Host: {String(entry.host ?? "n/a")}</div>
                  <div>Platform: {String(entry.platform ?? "n/a")}</div>
                  <div>Mode: {String(entry.mode ?? "n/a")}</div>
                  <div>Roles: {formatList(entry.roles)}</div>
                </Card.Content>
              </Card>
            ))
          )}
        </div>
      </PanelCard>
    </div>
  );
}

function renderSessionsPanel(store: ReturnType<typeof useControlUiStore>) {
  const sessions = store.sessionsResult?.sessions ?? [];
  return (
    <div className="space-y-5">
      <PanelCard title="Sessions" description="Local session registry, labels, and behavior flags.">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            aria-label="Filter active minutes"
            variant="secondary"
            value={store.sessionsFilterActive}
            onChange={(e) => {
              store.sessionsFilterActive = e.target.value;
              store.touch();
            }}
          />
          <Input
            aria-label="Limit"
            variant="secondary"
            value={store.sessionsFilterLimit}
            onChange={(e) => {
              store.sessionsFilterLimit = e.target.value;
              store.touch();
            }}
          />
          <Button variant="primary" onPress={() => store.refreshSessions()}>
            Reload
          </Button>
        </div>
        <Separator className="bg-white/10" />
        <div className="grid gap-3">
          {sessions.map((session) => (
            <Card
              key={session.key}
              variant="secondary"
              className="border border-white/10 bg-white/5 shadow-none"
            >
              <Card.Header className="space-y-1">
                <Card.Title>{session.displayName ?? session.label ?? session.key}</Card.Title>
                <Card.Description>
                  {session.kind} · {session.key}
                </Card.Description>
              </Card.Header>
              <Card.Content className="space-y-2 text-sm text-white/70">
                <div>Tokens: {session.totalTokens ?? 0}</div>
                <div>Model: {session.model ?? "n/a"}</div>
                <div>Updated: {formatRelativeTimestamp(session.updatedAt ?? undefined)}</div>
              </Card.Content>
              <Card.Footer className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onPress={() => store.updateSetting("sessionKey", session.key)}
                >
                  Use
                </Button>
                <Button
                  variant="secondary"
                  onPress={() =>
                    store.patchSession(session.key, {
                      label: session.displayName ?? session.label ?? session.key,
                    })
                  }
                >
                  Save label
                </Button>
                <Button variant="secondary" onPress={() => store.deleteSession(session.key)}>
                  Delete
                </Button>
              </Card.Footer>
            </Card>
          ))}
        </div>
      </PanelCard>
    </div>
  );
}

function renderUsagePanel(store: ReturnType<typeof useControlUiStore>) {
  const sessions = store.usageResult?.sessions ?? [];
  const totals = store.usageResult?.totals;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard label="Input" value={String(totals?.input ?? 0)} />
        <StatCard label="Output" value={String(totals?.output ?? 0)} />
        <StatCard label="Cost" value={`$${Number(totals?.totalCost ?? 0).toFixed(2)}`} />
        <StatCard label="Sessions" value={String(sessions.length)} />
      </div>

      <PanelCard title="Usage window" description="Choose the time range to query usage summaries.">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            aria-label="Start date"
            variant="secondary"
            value={store.usageStartDate}
            onChange={(e) => {
              store.usageStartDate = e.target.value;
              store.touch();
            }}
          />
          <Input
            aria-label="End date"
            variant="secondary"
            value={store.usageEndDate}
            onChange={(e) => {
              store.usageEndDate = e.target.value;
              store.touch();
            }}
          />
          <Button variant="primary" onPress={() => store.refreshUsage()}>
            Reload
          </Button>
        </div>
      </PanelCard>

      <PanelCard title="Session breakdown" description="Inspect the most active sessions first.">
        <div className="grid gap-3">
          {sessions.map((session: SessionsUsageEntry) => (
            <Card
              key={session.key}
              variant="secondary"
              className="border border-white/10 bg-white/5 shadow-none"
            >
              <Card.Header className="space-y-1">
                <Card.Title>{session.label ?? session.key}</Card.Title>
                <Card.Description>
                  {session.model ?? session.modelProvider ?? "n/a"}
                </Card.Description>
              </Card.Header>
              <Card.Content className="space-y-2 text-sm text-white/70">
                <div>Tokens: {session.usage?.totalTokens ?? 0}</div>
                <div>Cost: ${Number(session.usage?.totalCost ?? 0).toFixed(2)}</div>
                <div>Messages: {session.usage?.messageCounts?.total ?? 0}</div>
              </Card.Content>
              <Card.Footer>
                <Button variant="secondary" onPress={() => store.selectUsageSession(session.key)}>
                  Inspect
                </Button>
              </Card.Footer>
            </Card>
          ))}
        </div>
        {store.usageSessionLogs ? (
          <div className="mt-4 space-y-3">
            <SectionLabel>Session logs</SectionLabel>
            <JsonBlock value={store.usageSessionLogs} />
          </div>
        ) : null}
        {store.usageTimeSeries ? (
          <div className="space-y-3">
            <SectionLabel>Time series</SectionLabel>
            <JsonBlock value={store.usageTimeSeries} />
          </div>
        ) : null}
      </PanelCard>
    </div>
  );
}

function renderCronPanel(store: ReturnType<typeof useControlUiStore>) {
  return (
    <div className="space-y-5">
      <PanelCard title="Cron" description="Scheduled jobs and their execution state.">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="Job name"
            variant="secondary"
            value={store.cronForm.name}
            onChange={(e) => {
              store.cronForm.name = e.target.value;
              store.touch();
            }}
          />
          <Input
            aria-label="Agent ID"
            variant="secondary"
            value={store.cronForm.agentId}
            onChange={(e) => {
              store.cronForm.agentId = e.target.value;
              store.touch();
            }}
          />
          <Input
            aria-label="Every amount"
            variant="secondary"
            value={store.cronForm.everyAmount}
            onChange={(e) => {
              store.cronForm.everyAmount = e.target.value;
              store.touch();
            }}
          />
          <Input
            aria-label="Cron expression"
            variant="secondary"
            value={store.cronForm.cronExpr}
            onChange={(e) => {
              store.cronForm.cronExpr = e.target.value;
              store.touch();
            }}
          />
          <TextArea
            aria-label="Payload"
            variant="secondary"
            rows={4}
            value={store.cronForm.payloadText}
            onChange={(e) => {
              store.cronForm.payloadText = e.target.value;
              store.touch();
            }}
          />
          <TextArea
            aria-label="Description"
            variant="secondary"
            rows={4}
            value={store.cronForm.description}
            onChange={(e) => {
              store.cronForm.description = e.target.value;
              store.touch();
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onPress={() => store.addCronJob()}>
            Add job
          </Button>
          <Button variant="secondary" onPress={() => store.refreshCron()}>
            Reload
          </Button>
        </div>
      </PanelCard>

      <div className="grid gap-3">
        {store.cronJobs.map((job) => (
          <Card
            key={job.id}
            variant="secondary"
            className="border border-white/10 bg-white/5 shadow-none"
          >
            <Card.Header className="space-y-1">
              <Card.Title>{job.name}</Card.Title>
              <Card.Description>{job.id}</Card.Description>
            </Card.Header>
            <Card.Content className="space-y-1 text-sm text-white/70">
              <div>Enabled: {job.enabled ? "yes" : "no"}</div>
              <div>Schedule: {formatJson(job.schedule)}</div>
              <div>State: {formatJson(job.state)}</div>
            </Card.Content>
            <Card.Footer className="flex flex-wrap gap-2">
              <Button variant="secondary" onPress={() => store.toggleCronJob(job, !job.enabled)}>
                Toggle
              </Button>
              <Button variant="secondary" onPress={() => store.runCronJob(job)}>
                Run now
              </Button>
              <Button variant="secondary" onPress={() => store.loadCronRuns(job.id)}>
                Runs
              </Button>
              <Button variant="secondary" onPress={() => store.removeCronJob(job)}>
                Delete
              </Button>
            </Card.Footer>
          </Card>
        ))}
      </div>

      {store.cronRuns.length > 0 ? (
        <PanelCard
          title="Recent runs"
          description={store.cronRunsJobId ? `Job ${store.cronRunsJobId}` : undefined}
        >
          <JsonBlock value={store.cronRuns} />
        </PanelCard>
      ) : null}
    </div>
  );
}

function renderSkillsPanel(store: ReturnType<typeof useControlUiStore>) {
  const skills = store.skillsReport?.skills ?? [];
  const filtered = skills.filter((skill) => {
    if (!store.skillsFilter.trim()) {
      return true;
    }
    const q = store.skillsFilter.toLowerCase();
    return [skill.name, skill.description, skill.skillKey, skill.source].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(q),
    );
  });
  return (
    <div className="space-y-5">
      <PanelCard title="Skills" description="Manage installed skills, API keys, and enablement.">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            aria-label="Filter skills"
            variant="secondary"
            value={store.skillsFilter}
            onChange={(e) => {
              store.skillsFilter = e.target.value;
              store.touch();
            }}
            className="max-w-md"
          />
          <Button variant="primary" onPress={() => store.refreshSkills()}>
            Reload
          </Button>
        </div>
      </PanelCard>

      <div className="grid gap-3">
        {filtered.map((skill) => (
          <Card
            key={skill.skillKey}
            variant="secondary"
            className="border border-white/10 bg-white/5 shadow-none"
          >
            <Card.Header className="space-y-1">
              <Card.Title>{skill.name}</Card.Title>
              <Card.Description>{skill.skillKey}</Card.Description>
            </Card.Header>
            <Card.Content className="space-y-2 text-sm text-white/70">
              <div>{skill.description}</div>
              <div>Source: {skill.source}</div>
              <div>Status: {skill.disabled ? "disabled" : "enabled"}</div>
            </Card.Content>
            <Card.Footer className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onPress={() => store.updateSkillEnabled(skill.skillKey, !skill.disabled)}
              >
                {skill.disabled ? "Enable" : "Disable"}
              </Button>
              <Button variant="secondary" onPress={() => store.saveSkillApiKey(skill.skillKey)}>
                Save key
              </Button>
              {skill.install.map((option) => (
                <Button
                  key={option.id}
                  variant="secondary"
                  onPress={() => store.installSkill(skill.skillKey, skill.name, option.id)}
                >
                  Install {option.label}
                </Button>
              ))}
            </Card.Footer>
          </Card>
        ))}
      </div>
    </div>
  );
}

function renderNodesPanel(store: ReturnType<typeof useControlUiStore>) {
  return (
    <div className="space-y-5">
      <PanelCard title="Nodes" description="System nodes and device pairing state.">
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onPress={() => store.refreshNodes()}>
            Refresh nodes
          </Button>
          <Button variant="secondary" onPress={() => store.loadDevices()}>
            Refresh devices
          </Button>
        </div>
        <JsonBlock value={store.nodes} />
      </PanelCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <PanelCard title="Pending devices" description="Approve or reject device pairing requests.">
          <div className="grid gap-3">
            {store.devicesList?.pending?.length ? (
              store.devicesList.pending.map((device) => (
                <Card
                  key={device.requestId}
                  variant="secondary"
                  className="border border-white/10 bg-white/5 shadow-none"
                >
                  <Card.Header className="space-y-1">
                    <Card.Title>{device.displayName ?? device.deviceId}</Card.Title>
                    <Card.Description>{device.requestId}</Card.Description>
                  </Card.Header>
                  <Card.Content className="space-y-1 text-sm text-white/70">
                    <div>Role: {String(device.role ?? "n/a")}</div>
                    <div>Remote IP: {String(device.remoteIp ?? "n/a")}</div>
                  </Card.Content>
                  <Card.Footer className="flex gap-2">
                    <Button variant="primary" onPress={() => store.approveDevice(device.requestId)}>
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      onPress={() => store.rejectDevice(device.requestId)}
                    >
                      Reject
                    </Button>
                  </Card.Footer>
                </Card>
              ))
            ) : (
              <div className="text-sm text-white/55">No pending pairings.</div>
            )}
          </div>
        </PanelCard>

        <PanelCard title="Paired devices" description="Rotatable tokens and granted roles.">
          <div className="grid gap-3">
            {store.devicesList?.paired?.length ? (
              store.devicesList.paired.map((device) => (
                <Card
                  key={device.deviceId}
                  variant="secondary"
                  className="border border-white/10 bg-white/5 shadow-none"
                >
                  <Card.Header className="space-y-1">
                    <Card.Title>{device.displayName ?? device.deviceId}</Card.Title>
                    <Card.Description>{device.deviceId}</Card.Description>
                  </Card.Header>
                  <Card.Content className="space-y-1 text-sm text-white/70">
                    <div>Roles: {formatList(device.roles)}</div>
                    <div>Scopes: {formatList(device.scopes)}</div>
                  </Card.Content>
                  <Card.Footer className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onPress={() =>
                        store.rotateDeviceToken({
                          deviceId: device.deviceId,
                          role: device.roles?.[0] ?? "operator",
                          scopes: device.scopes ?? undefined,
                        })
                      }
                    >
                      Rotate token
                    </Button>
                    <Button
                      variant="secondary"
                      onPress={() =>
                        store.revokeDeviceToken({
                          deviceId: device.deviceId,
                          role: device.roles?.[0] ?? "operator",
                        })
                      }
                    >
                      Revoke token
                    </Button>
                  </Card.Footer>
                </Card>
              ))
            ) : (
              <div className="text-sm text-white/55">No paired devices.</div>
            )}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}

function renderConfigPanel(store: ReturnType<typeof useControlUiStore>) {
  return (
    <div className="space-y-5">
      <PanelCard title="Config" description="Raw configuration JSON with save and apply controls.">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            aria-label="Apply session"
            variant="secondary"
            value={store.applySessionKey}
            onChange={(e) => store.updateSetting("lastActiveSessionKey", e.target.value)}
          />
          <Button variant="primary" onPress={() => store.refreshConfig()}>
            Reload
          </Button>
          <Button variant="secondary" onPress={() => store.runUpdate()}>
            Run update
          </Button>
        </div>
        <TextArea
          aria-label="Config JSON"
          variant="secondary"
          rows={18}
          value={store.configRaw}
          onChange={(e) => store.selectConfigRaw(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onPress={() => store.saveConfig()}>
            Save
          </Button>
          <Button variant="secondary" onPress={() => store.applyConfig()}>
            Apply
          </Button>
        </div>
      </PanelCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Valid"
          value={store.configValid === null ? "unknown" : store.configValid ? "yes" : "no"}
        />
        <StatCard label="Schema version" value={store.configSchemaVersion ?? "n/a"} />
        <StatCard label="Issues" value={String(store.configIssues.length)} />
      </div>

      <PanelCard title="Snapshot" description="Gateway config snapshot and schema data.">
        <JsonBlock value={store.configSnapshot} />
        <Separator className="my-4 bg-white/10" />
        <JsonBlock value={store.configSchema} />
      </PanelCard>
    </div>
  );
}

function renderDebugPanel(store: ReturnType<typeof useControlUiStore>) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="Status" description="System status snapshot.">
          <JsonBlock value={store.debugStatus} />
        </PanelCard>
        <PanelCard title="Health" description="Gateway health snapshot.">
          <JsonBlock value={store.debugHealth} />
        </PanelCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="Models" description="Catalog returned by models.list.">
          <JsonBlock value={store.debugModels} />
        </PanelCard>
        <PanelCard title="Heartbeat" description="Most recent gateway heartbeat payload.">
          <JsonBlock value={store.debugHeartbeat} />
        </PanelCard>
      </div>

      <PanelCard
        title="Manual RPC"
        description="Call a raw gateway method with arbitrary JSON params."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="Method"
            variant="secondary"
            value={store.debugCallMethod}
            onChange={(e) => {
              store.debugCallMethod = e.target.value;
              store.touch();
            }}
          />
          <Button variant="primary" onPress={() => store.callDebugMethod()}>
            Call
          </Button>
        </div>
        <TextArea
          aria-label="Params JSON"
          variant="secondary"
          rows={8}
          value={store.debugCallParams}
          onChange={(e) => {
            store.debugCallParams = e.target.value;
            store.touch();
          }}
        />
        {store.debugCallError ? (
          <div className="text-sm text-rose-300">{store.debugCallError}</div>
        ) : null}
        {store.debugCallResult ? (
          <pre className="max-h-[32rem] overflow-auto rounded-2xl border border-white/10 bg-black/35 p-4 text-xs leading-6 text-white/80">
            {store.debugCallResult}
          </pre>
        ) : null}
      </PanelCard>
    </div>
  );
}

function renderLogsPanel(store: ReturnType<typeof useControlUiStore>) {
  const filtered = store.logsEntries.filter((entry) => {
    const text = `${entry.raw ?? ""} ${entry.message ?? ""} ${entry.subsystem ?? ""}`.toLowerCase();
    const q = store.logsFilterText.trim().toLowerCase();
    if (q && !text.includes(q)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <PanelCard title="Logs" description="Tail the local gateway logs and filter them live.">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            aria-label="Filter logs"
            variant="secondary"
            value={store.logsFilterText}
            onChange={(e) => {
              store.logsFilterText = e.target.value;
              store.touch();
            }}
          />
          <Button variant="primary" onPress={() => store.refreshLogs(true)}>
            Reload
          </Button>
        </div>
        <div className="grid gap-3">
          {filtered.length === 0 ? (
            <div className="text-sm text-white/55">No log lines match the current filter.</div>
          ) : (
            filtered.map((entry, index) => (
              <LogEntryCard key={index} entry={entry as Record<string, unknown>} />
            ))
          )}
        </div>
      </PanelCard>
    </div>
  );
}
