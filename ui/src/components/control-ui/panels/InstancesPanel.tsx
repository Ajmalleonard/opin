"use client";

import { Card } from "@heroui/react";
import { formatList } from "../../../ui/format";
import { PanelCard } from "./PanelHelpers";

export function InstancesPanel({ store }: { store: any }) {
  return (
    <div className="space-y-5">
      <PanelCard title="Instances" description="Presence beacons and connected client metadata.">
        <div className="grid gap-4 lg:grid-cols-2">
          {store.presenceEntries.length === 0 ? (
            <div className="text-sm text-foreground/55">No presence entries found.</div>
          ) : (
            store.presenceEntries.map((entry: any, index: number) => (
              <Card
                key={index}
                className="border border-border bg-surface p-5 shadow-none rounded-2xl space-y-1.5"
              >
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-foreground">
                    {String(entry.instanceId ?? entry.host ?? `instance-${index + 1}`)}
                  </h4>
                  <p className="text-xs text-muted">{String(entry.version ?? "unknown version")}</p>
                </div>
                <div className="space-y-1 text-sm text-foreground/70">
                  <div>Host: {String(entry.host ?? "n/a")}</div>
                  <div>Platform: {String(entry.platform ?? "n/a")}</div>
                  <div>Mode: {String(entry.mode ?? "n/a")}</div>
                  <div>Roles: {formatList(entry.roles)}</div>
                </div>
              </Card>
            ))
          )}
        </div>
      </PanelCard>
    </div>
  );
}
