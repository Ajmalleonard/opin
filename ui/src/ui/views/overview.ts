import { html } from "lit";
import type { GatewayHelloOk } from "../gateway.ts";
import type { UiSettings } from "../storage.ts";
import { formatDurationHuman, formatRelativeTimestamp } from "../format.ts";
import { icons } from "../icons.ts";
import { inferBasePathFromPathname, pathForTab } from "../navigation.ts";
import { formatNextRun } from "../presenter.ts";

export type OverviewProps = {
  connected: boolean;
  hello: GatewayHelloOk | null;
  settings: UiSettings;
  password: string;
  lastError: string | null;
  presenceCount: number;
  sessionsCount: number | null;
  cronEnabled: boolean | null;
  cronNext: number | null;
  lastChannelsRefresh: number | null;
  onSettingsChange: (next: UiSettings) => void;
  onPasswordChange: (next: string) => void;
  onSessionKeyChange: (next: string) => void;
  onConnect: () => void;
  onRefresh: () => void;
};

export function renderOverview(props: OverviewProps) {
  const snapshot = props.hello?.snapshot as
    | { uptimeMs?: number; policy?: { tickIntervalMs?: number } }
    | undefined;
  const uptime = snapshot?.uptimeMs ? formatDurationHuman(snapshot.uptimeMs) : "n/a";
  const tick = snapshot?.policy?.tickIntervalMs ? `${snapshot.policy.tickIntervalMs}ms` : "n/a";
  const gatewayUrl = props.settings.gatewayUrl.trim() || "ws://127.0.0.1:18789";
  const defaultSessionKey = props.settings.sessionKey.trim() || "main";
  const tokenPresent = Boolean(props.settings.token.trim());
  const passwordPresent = Boolean(props.password.trim());
  const secureContext = typeof window === "undefined" ? true : window.isSecureContext;
  const basePath =
    typeof window === "undefined" ? "" : inferBasePathFromPathname(window.location.pathname);
  const authMode = tokenPresent ? "Gateway token" : passwordPresent ? "Password" : "Unconfigured";
  const refreshLabel = props.lastChannelsRefresh
    ? formatRelativeTimestamp(props.lastChannelsRefresh)
    : "never";
  const cronStatus = props.cronEnabled == null ? "Unknown" : props.cronEnabled ? "Armed" : "Paused";

  const signalCards = [
    {
      icon: icons.barChart,
      label: "Gateway state",
      value: props.connected ? "Online" : "Offline",
      note: props.connected ? `Uptime ${uptime}` : "Reconnect or repair gateway auth.",
      tone: props.connected ? "success" : "danger",
    },
    {
      icon: icons.radio,
      label: "Presence",
      value: String(props.presenceCount),
      note: "Clients seen recently by the gateway.",
      tone: props.presenceCount > 0 ? "info" : "default",
    },
    {
      icon: icons.fileText,
      label: "Sessions",
      value: props.sessionsCount == null ? "n/a" : String(props.sessionsCount),
      note: `Default key ${defaultSessionKey}.`,
      tone: "default",
    },
    {
      icon: icons.loader,
      label: "Automation",
      value: cronStatus,
      note: `Next wake ${formatNextRun(props.cronNext)}.`,
      tone: props.cronEnabled ? "success" : props.cronEnabled === false ? "warning" : "default",
    },
  ] as const;

  const snapshotRows = [
    { label: "WebSocket", value: gatewayUrl, mono: true },
    { label: "Auth mode", value: authMode },
    { label: "Tick interval", value: tick },
    { label: "Last channel refresh", value: refreshLabel },
    { label: "Default session", value: defaultSessionKey, mono: true },
  ];

  const quickLinks = [
    {
      title: "Channels",
      copy: "Pair and repair WhatsApp, Telegram, Discord, Signal, and iMessage.",
      href: pathForTab("channels", basePath),
    },
    {
      title: "Sessions",
      copy: "Switch keys, inspect state, and reset isolated conversation lanes.",
      href: pathForTab("sessions", basePath),
    },
    {
      title: "Config",
      copy: "Edit Opin runtime settings without leaving the control surface.",
      href: pathForTab("config", basePath),
    },
    {
      title: "Logs",
      copy: "Open the live gateway trail when something starts drifting.",
      href: pathForTab("logs", basePath),
    },
  ];

  const authHint =
    tokenPresent || passwordPresent
      ? html`
          <div class="callout success">
            Auth is already loaded for this browser session. You can reconnect immediately after editing the
            URL or default session.
          </div>
        `
      : html`
          <div class="callout info">
            No gateway auth is loaded yet. Add a token or password before using this dashboard remotely.
            <div class="overview-link-row">
              <span class="mono">opin doctor --generate-gateway-token</span>
              <a
                href="https://docs.opin.squareexp.com/web/dashboard"
                target="_blank"
                rel="noreferrer"
                title="Control UI auth docs (opens in new tab)"
                >Dashboard auth</a
              >
            </div>
          </div>
        `;

  const insecureContextHint =
    !secureContext && !props.connected
      ? html`
          <div class="callout info">
            HTTP is blocking device identity. Use HTTPS via Tailscale Serve or connect locally on
            <span class="mono">127.0.0.1:18789</span>.
            <div class="overview-link-row">
              <a
                href="https://docs.opin.squareexp.com/gateway/tailscale"
                target="_blank"
                rel="noreferrer"
                title="Tailscale docs (opens in new tab)"
                >Tailscale Serve</a
              >
              <a
                href="https://docs.opin.squareexp.com/web/control-ui#insecure-http"
                target="_blank"
                rel="noreferrer"
                title="Insecure HTTP docs (opens in new tab)"
                >Insecure HTTP</a
              >
            </div>
          </div>
        `
      : null;

  const errorHint = props.lastError
    ? html`<div class="callout danger">${props.lastError}</div>`
    : null;

  return html`
    <section class="overview-shell">
      <article class="card overview-hero">
        <div class="overview-hero__main">
          <h2 class="overview-hero__title">Gateway environment status</h2>
          <p class="overview-hero__copy">
            Check signal health, manage runtime sessions, and move straight into channel
            configuration from this control surface.
          </p>
          <div class="overview-badge-row">
            <div class="pill">
              <span class="statusDot ${props.connected ? "ok" : ""}"></span>
              <span>${props.connected ? "Gateway online" : "Gateway offline"}</span>
            </div>
            <div class="pill">
              <span>Session</span>
              <span class="mono">${defaultSessionKey}</span>
            </div>
            <div class="pill">
              <span>Auth</span>
              <span>${authMode}</span>
            </div>
            <div class="pill">
              <span>Next wake</span>
              <span>${formatNextRun(props.cronNext)}</span>
            </div>
          </div>
        </div>

        <div class="overview-hero__actions">
          <button class="btn primary" @click=${() => props.onConnect()}>
            ${icons.link}
            <span>Connect gateway</span>
          </button>
          <button class="btn" @click=${() => props.onRefresh()}>
            ${icons.refresh}
            <span>Refresh snapshot</span>
          </button>
        </div>
      </article>

      <section class="overview-signal-grid">
        ${signalCards.map(
          (card) => html`
            <article class="card overview-signal overview-signal--${card.tone}">
              <div class="overview-signal__top">
                <div class="overview-signal__label">${card.label}</div>
                <div class="overview-signal__icon">${card.icon}</div>
              </div>
              <div class="overview-signal__value">${card.value}</div>
              <div class="overview-signal__note">${card.note}</div>
            </article>
          `,
        )}
      </section>

      <section class="overview-access-grid">
        <article class="card overview-section">
          <div class="overview-section__head">
            <div class="overview-section__eyebrow">Gateway access</div>
            <div class="overview-section__title">Connection surface</div>
            <div class="overview-section__copy">
              Edit the connection details here, reconnect, and keep the gateway private by default.
            </div>
          </div>
          <div class="divider-dashed"></div>

          <div class="overview-form-grid">
            <label class="field">
              <span>WebSocket URL</span>
              <input
                .value=${props.settings.gatewayUrl}
                @input=${(event: Event) => {
                  props.onSettingsChange({
                    ...props.settings,
                    gatewayUrl: (event.target as HTMLInputElement).value,
                  });
                }}
                placeholder="ws://100.x.y.z:18789"
              />
            </label>
            <label class="field">
              <span>Gateway token</span>
              <input
                .value=${props.settings.token}
                @input=${(event: Event) => {
                  props.onSettingsChange({
                    ...props.settings,
                    token: (event.target as HTMLInputElement).value,
                  });
                }}
                placeholder="OPIN_GATEWAY_TOKEN"
              />
            </label>
            <label class="field">
              <span>Password</span>
              <input
                type="password"
                .value=${props.password}
                @input=${(event: Event) => {
                  props.onPasswordChange((event.target as HTMLInputElement).value);
                }}
                placeholder="system or shared password"
              />
            </label>
            <label class="field">
              <span>Default session key</span>
              <input
                .value=${props.settings.sessionKey}
                @input=${(event: Event) => {
                  props.onSessionKeyChange((event.target as HTMLInputElement).value);
                }}
              />
            </label>
          </div>

          ${authHint} ${insecureContextHint} ${errorHint}
        </article>

        <article class="card overview-section">
          <div class="overview-section__head">
            <div class="overview-section__eyebrow">Runtime snapshot</div>
            <div class="overview-section__title">Current control profile</div>
            <div class="overview-section__copy">
              A quick readout of the live endpoint, refresh state, and gateway timing.
            </div>
          </div>
          <div class="divider-dashed"></div>

          <div class="overview-snapshot">
            ${snapshotRows.map(
              (row) => html`
                <div class="overview-snapshot__row">
                  <div class="overview-snapshot__label">${row.label}</div>
                  <div class="overview-snapshot__value ${row.mono ? "mono" : ""}">
                    ${row.value}
                  </div>
                </div>
              `,
            )}
          </div>
        </article>
      </section>

      <section class="overview-access-grid">
        <article class="card overview-section">
          <div class="overview-section__head">
            <div class="overview-section__eyebrow">Control shortcuts</div>
            <div class="overview-section__title">Move fast across the console</div>
          </div>
          <div class="divider-dashed"></div>

          <div class="overview-shortcut-grid">
            ${quickLinks.map(
              (entry) => html`
                <a class="overview-shortcut" href=${entry.href}>
                  <div class="overview-shortcut__title">${entry.title}</div>
                  <div class="overview-shortcut__copy">${entry.copy}</div>
                  <div class="overview-shortcut__cta">Open →</div>
                </a>
              `,
            )}
          </div>
        </article>

        <article class="card overview-section">
          <div class="overview-section__head">
            <div class="overview-section__eyebrow">Operator notes</div>
            <div class="overview-section__title">How to keep Opin clean</div>
          </div>
          <div class="divider-dashed"></div>

          <div class="overview-note-stack">
            <div class="overview-note">
              <div class="overview-note__title">Keep the gateway private</div>
              <div class="overview-note__copy">
                Prefer loopback plus Tailscale Serve or another authenticated reverse proxy over
                exposing the control port directly.
              </div>
            </div>
            <div class="overview-note">
              <div class="overview-note__title">Treat session keys like lanes</div>
              <div class="overview-note__copy">
                Give recurring jobs and channel-specific work their own session keys so resets stay
                predictable.
              </div>
            </div>
            <div class="overview-note">
              <div class="overview-note__title">Use the docs as the control reference</div>
              <div class="overview-link-row">
                <a
                  href="https://docs.opin.squareexp.com/start/getting-started"
                  target="_blank"
                  rel="noreferrer"
                  title="Getting started docs (opens in new tab)"
                  >Getting started</a
                >
                <a
                  href="https://docs.opin.squareexp.com/install/docker"
                  target="_blank"
                  rel="noreferrer"
                  title="Docker docs (opens in new tab)"
                  >Docker</a
                >
                <a
                  href="https://docs.opin.squareexp.com/help/environment"
                  target="_blank"
                  rel="noreferrer"
                  title="Environment docs (opens in new tab)"
                  >Environment</a
                >
              </div>
            </div>
          </div>
        </article>
      </section>
    </section>
  `;
}
