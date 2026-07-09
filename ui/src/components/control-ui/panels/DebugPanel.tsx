"use client";

import { Button, Input, TextArea } from "@heroui/react";
import { PanelCard, JsonBlock } from "./PanelHelpers";

export function DebugPanel({ store }: { store: any }) {
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
            value={store.debugCallMethod}
            onChange={(e) => {
              store.debugCallMethod = e.target.value;
              store.touch();
            }}
            className="bg-default/50 border border-border focus-within:border-foreground/30 rounded-full w-full"
          />
          <Button
            className="bg-foreground text-background font-semibold rounded-full hover:bg-foreground/90 text-xs py-2 px-4"
            onPress={() => store.callDebugMethod()}
          >
            Call
          </Button>
        </div>
        <TextArea
          aria-label="Params JSON"
          rows={8}
          value={store.debugCallParams}
          onChange={(e) => {
            store.debugCallParams = e.target.value;
            store.touch();
          }}
          className="bg-default/50 border border-border focus-within:border-foreground/30 rounded-2xl w-full font-mono text-xs"
        />
        {store.debugCallError ? (
          <div className="text-sm text-danger">{store.debugCallError}</div>
        ) : null}
        {store.debugCallResult ? (
          <pre className="max-h-[32rem] overflow-auto rounded-2xl border border-border bg-surface-secondary p-4 text-xs leading-6 text-foreground/80">
            {store.debugCallResult}
          </pre>
        ) : null}
      </PanelCard>
    </div>
  );
}
