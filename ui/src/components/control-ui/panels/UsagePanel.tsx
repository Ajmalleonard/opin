"use client";

import { Card, Button, Input } from "@heroui/react";
import type { SessionsUsageEntry } from "../../../ui/types";
import { PanelCard, StatCard, JsonBlock, SectionLabel } from "./PanelHelpers";

export function UsagePanel({ store }: { store: any }) {
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
            value={store.usageStartDate}
            onChange={(e) => {
              store.usageStartDate = e.target.value;
              store.touch();
            }}
            className="bg-default/50 border border-border focus-within:border-foreground/30 rounded-full w-full"
          />
          <Input
            aria-label="End date"
            value={store.usageEndDate}
            onChange={(e) => {
              store.usageEndDate = e.target.value;
              store.touch();
            }}
            className="bg-default/50 border border-border focus-within:border-foreground/30 rounded-full w-full"
          />
          <Button
            className="bg-foreground text-background font-semibold rounded-full hover:bg-foreground/90 text-xs py-2 px-4"
            onPress={() => store.refreshUsage()}
          >
            Reload
          </Button>
        </div>
      </PanelCard>

      <PanelCard title="Session breakdown" description="Inspect the most active sessions first.">
        <div className="grid gap-3">
          {sessions.map((session: SessionsUsageEntry) => (
            <Card
              key={session.key}
              className="border border-border bg-surface p-5 shadow-none rounded-2xl space-y-3"
            >
              <div className="flex flex-col gap-0.5">
                <h4 className="text-sm font-semibold text-foreground">
                  {session.label ?? session.key}
                </h4>
                <p className="text-xs text-muted">
                  {session.model ?? session.modelProvider ?? "n/a"}
                </p>
              </div>
              <div className="space-y-1 text-sm text-foreground/70">
                <div>Tokens: {session.usage?.totalTokens ?? 0}</div>
                <div>Cost: ${Number(session.usage?.totalCost ?? 0).toFixed(2)}</div>
                <div>Messages: {session.usage?.messageCounts?.total ?? 0}</div>
              </div>
              <div className="pt-1">
                <Button
                  className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-1.5 px-3"
                  onPress={() => store.selectUsageSession(session.key)}
                >
                  Inspect
                </Button>
              </div>
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
