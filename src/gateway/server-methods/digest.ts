import type { GatewayRequestHandlers } from "./types.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";

const DIGEST_JOB_NAME = "opin:session-memory-digest";

/**
 * Builds the agent turn message for the daily session memory digest.
 * The agent reads recent sessions and produces a concise recap.
 */
function buildDigestPrompt(): string {
  return [
    "You are Opin's memory digest agent. Your job is to review everything we worked on",
    "today across all chat sessions, synthesise the key outcomes, identify anything",
    "still in-progress, and suggest the top 3 priorities for tomorrow.",
    "",
    "Steps:",
    "1. Use available tools to read recent session transcripts (last 24 hours).",
    "2. Group work by theme or project.",
    "3. Write a brief, human-friendly recap — no longer than 200 words.",
    "4. End with a numbered '🎯 Tomorrow's Top 3' list.",
    "",
    "Format the reply so it renders clearly in WhatsApp / Telegram.",
    "Do not include any tool output or raw JSON in the reply.",
    "If there is nothing to summarise, say 'No sessions today — clean slate tomorrow!' and stop.",
  ].join("\n");
}

export const digestHandlers: GatewayRequestHandlers = {
  "digest.enable": async ({ params, respond, context }) => {
    const p = params as { cronExpr?: string; channel?: string; to?: string };
    // Default: 5pm in the gateway's local timezone
    const cronExpr =
      typeof p.cronExpr === "string" && p.cronExpr.trim() ? p.cronExpr.trim() : "0 17 * * *";

    try {
      // Remove any existing digest job to avoid duplicates
      const existing = await context.cron.list({ includeDisabled: true });
      for (const job of existing) {
        if (job.name === DIGEST_JOB_NAME) {
          await context.cron.remove(job.id);
        }
      }

      const job = await context.cron.add({
        name: DIGEST_JOB_NAME,
        description: "Daily session memory digest — delivered to your channel automatically.",
        enabled: true,
        schedule: { kind: "cron", expr: cronExpr },
        sessionTarget: "isolated",
        wakeMode: "next-heartbeat",
        payload: {
          kind: "agentTurn",
          message: buildDigestPrompt(),
          thinking: "low",
          deliver: true,
          ...(p.channel ? { channel: p.channel } : {}),
          ...(p.to ? { to: p.to } : {}),
          bestEffortDeliver: true,
        },
        delivery: {
          mode: "announce",
          ...(p.channel ? { channel: p.channel } : {}),
          ...(p.to ? { to: p.to } : {}),
          bestEffort: true,
        },
      });

      respond(true, { enabled: true, jobId: job.id, cronExpr }, undefined);
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INTERNAL_ERROR, `digest.enable failed: ${String(err)}`),
      );
    }
  },

  "digest.disable": async ({ respond, context }) => {
    try {
      const existing = await context.cron.list({ includeDisabled: true });
      let removed = 0;
      for (const job of existing) {
        if (job.name === DIGEST_JOB_NAME) {
          await context.cron.remove(job.id);
          removed++;
        }
      }
      respond(true, { disabled: true, removed }, undefined);
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INTERNAL_ERROR, `digest.disable failed: ${String(err)}`),
      );
    }
  },

  "digest.status": async ({ respond, context }) => {
    try {
      const existing = await context.cron.list({ includeDisabled: true });
      const jobs = existing.filter((j) => j.name === DIGEST_JOB_NAME);
      if (jobs.length === 0) {
        respond(true, { enabled: false }, undefined);
        return;
      }
      const job = jobs[0]!;
      respond(
        true,
        {
          enabled: job.enabled,
          jobId: job.id,
          schedule: job.schedule,
          lastRunAt: job.state.lastRunAtMs,
          nextRunAt: job.state.nextRunAtMs,
        },
        undefined,
      );
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INTERNAL_ERROR, `digest.status failed: ${String(err)}`),
      );
    }
  },
};
