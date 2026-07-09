"use client";

import { Button } from "@heroui/react";
import { formatDurationHuman } from "../../../ui/format";
import { pathForTab, titleForTab, type Tab } from "../../../ui/navigation";
import { StatCard, PanelCard, JsonBlock } from "./PanelHelpers";

function getGatewayAuthLabel(token: string, password: string) {
  if (token.trim()) {
    return "token";
  }
  if (password.trim()) {
    return "password";
  }
  return "none";
}

export function OverviewPanel({ store, router }: { store: any; router: any }) {
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
                className="justify-start border border-border bg-default/50 text-foreground rounded-full py-5 hover:bg-default text-xs font-semibold"
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
