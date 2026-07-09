"use client";

import { Button, Input, TextArea, Separator } from "@heroui/react";
import { PanelCard, StatCard, JsonBlock } from "./PanelHelpers";

export function ConfigPanel({ store }: { store: any }) {
  return (
    <div className="space-y-5">
      <PanelCard title="Config" description="Raw configuration JSON with save and apply controls.">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            aria-label="Apply session"
            value={store.applySessionKey}
            onChange={(e) => store.updateSetting("lastActiveSessionKey", e.target.value)}
            className="bg-default/50 border border-border focus-within:border-foreground/30 rounded-full w-full"
          />
          <Button
            className="bg-foreground text-background font-semibold rounded-full hover:bg-foreground/90 text-xs py-2 px-4"
            onPress={() => store.refreshConfig()}
          >
            Reload
          </Button>
          <Button
            className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-2 px-4"
            onPress={() => store.runUpdate()}
          >
            Run update
          </Button>
        </div>
        <TextArea
          aria-label="Config JSON"
          rows={18}
          value={store.configRaw}
          onChange={(e) => store.selectConfigRaw(e.target.value)}
          className="bg-default/50 border border-border focus-within:border-foreground/30 rounded-2xl w-full font-mono text-xs"
        />
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            className="bg-foreground text-background font-semibold rounded-full hover:bg-foreground/90 text-xs py-2 px-4"
            onPress={() => store.saveConfig()}
          >
            Save
          </Button>
          <Button
            className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-2 px-4"
            onPress={() => store.applyConfig()}
          >
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
        <Separator className="my-4 bg-border" />
        <JsonBlock value={store.configSchema} />
      </PanelCard>
    </div>
  );
}
