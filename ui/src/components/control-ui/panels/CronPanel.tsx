"use client";

import { Card, Button, Input, TextArea } from "@heroui/react";
import { PanelCard, JsonBlock, formatJson } from "./PanelHelpers";

export function CronPanel({ store }: { store: any }) {
  return (
    <div className="space-y-5">
      <PanelCard title="Cron" description="Scheduled jobs and their execution state.">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="Job name"
            value={store.cronForm.name}
            onChange={(e) => {
              store.cronForm.name = e.target.value;
              store.touch();
            }}
            className="bg-default/50 border border-border focus-within:border-foreground/30 rounded-2xl w-full"
          />
          <Input
            aria-label="Agent ID"
            value={store.cronForm.agentId}
            onChange={(e) => {
              store.cronForm.agentId = e.target.value;
              store.touch();
            }}
            className="bg-default/50 border border-border focus-within:border-foreground/30 rounded-2xl w-full"
          />
          <Input
            aria-label="Every amount"
            value={store.cronForm.everyAmount}
            onChange={(e) => {
              store.cronForm.everyAmount = e.target.value;
              store.touch();
            }}
            className="bg-default/50 border border-border focus-within:border-foreground/30 rounded-2xl w-full"
          />
          <Input
            aria-label="Cron expression"
            value={store.cronForm.cronExpr}
            onChange={(e) => {
              store.cronForm.cronExpr = e.target.value;
              store.touch();
            }}
            className="bg-default/50 border border-border focus-within:border-foreground/30 rounded-2xl w-full"
          />
          <TextArea
            aria-label="Payload"
            rows={4}
            value={store.cronForm.payloadText}
            onChange={(e) => {
              store.cronForm.payloadText = e.target.value;
              store.touch();
            }}
            className="bg-default/50 border border-border focus-within:border-foreground/30 rounded-2xl w-full"
          />
          <TextArea
            aria-label="Description"
            rows={4}
            value={store.cronForm.description}
            onChange={(e) => {
              store.cronForm.description = e.target.value;
              store.touch();
            }}
            className="bg-default/50 border border-border focus-within:border-foreground/30 rounded-2xl w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            className="bg-foreground text-background font-semibold rounded-full hover:bg-foreground/90 text-xs py-2 px-4"
            onPress={() => store.addCronJob()}
          >
            Add job
          </Button>
          <Button
            className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-2 px-4"
            onPress={() => store.refreshCron()}
          >
            Reload
          </Button>
        </div>
      </PanelCard>

      <div className="grid gap-3">
        {store.cronJobs.map((job: any) => (
          <Card
            key={job.id}
            className="border border-border bg-surface p-5 shadow-none rounded-2xl space-y-3"
          >
            <div className="flex flex-col gap-0.5">
              <h4 className="text-sm font-semibold text-foreground">{job.name}</h4>
              <p className="text-xs text-muted">{job.id}</p>
            </div>
            <div className="space-y-1 text-sm text-foreground/70">
              <div>Enabled: {job.enabled ? "yes" : "no"}</div>
              <div>Schedule: {formatJson(job.schedule)}</div>
              <div>State: {formatJson(job.state)}</div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-1.5 px-3"
                onPress={() => store.toggleCronJob(job, !job.enabled)}
              >
                Toggle
              </Button>
              <Button
                className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-1.5 px-3"
                onPress={() => store.runCronJob(job)}
              >
                Run now
              </Button>
              <Button
                className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-1.5 px-3"
                onPress={() => store.loadCronRuns(job.id)}
              >
                Runs
              </Button>
              <Button
                className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-1.5 px-3"
                onPress={() => store.removeCronJob(job)}
              >
                Delete
              </Button>
            </div>
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
