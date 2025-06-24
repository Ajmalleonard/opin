import { completeSimple } from "@mariozechner/pi-ai";
import type { GatewayRequestHandlers } from "./types.js";
import { resolveOpinAgentDir } from "../../agents/agent-paths.js";
import { ensureAuthProfileStore, getApiKeyForModel } from "../../agents/model-auth.js";
import { resolveDefaultModelForAgent } from "../../agents/model-selection.js";
import { resolveModel } from "../../agents/pi-embedded-runner/model.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";

const WATCH_PREFIX = "opin:watch:";

export const watchHandlers: GatewayRequestHandlers = {
  "watch.add": async ({ params, respond, context }) => {
    const p = params as {
      instruction: string;
      channel?: string;
      to?: string;
      agentId?: string;
    };
    if (typeof p.instruction !== "string" || !p.instruction.trim()) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "instruction is required"));
      return;
    }

    try {
      // 1. Resolve default model and auth to parse the instruction
      const agentDir = resolveOpinAgentDir();
      const cfg = context.config.load();
      const agentId = p.agentId ?? cfg.agents?.defaultId ?? "main";
      const modelRef = resolveDefaultModelForAgent({ cfg, agentId });
      const { model, authStorage } = resolveModel(modelRef.provider, modelRef.model, agentDir, cfg);

      if (!model) {
        throw new Error(
          `Failed to resolve model for watch parser: ${modelRef.provider}/${modelRef.model}`,
        );
      }

      const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
      const apiKeyInfo = await getApiKeyForModel({
        model,
        cfg,
        store: authStore,
        agentDir,
      });
      if (apiKeyInfo.apiKey) {
        authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
      }

      // 2. Call LLM to parse instruction
      const systemPrompt = [
        "You are a Cron/Schedule extraction assistant.",
        "Given a user's natural language request to watch or schedule a task, extract the schedule (as a standard 5-field cron expression) and the clean agent prompt to run.",
        "If the schedule is not explicitly specified, default to running every hour ('0 * * * *').",
        "Return your response ONLY as a JSON object matching this schema:",
        "{",
        '  "cronExpression": "cron expression here",',
        '  "agentPrompt": "the clean prompt for the agent to execute",',
        '  "description": "brief description of the watch task"',
        "}",
        "Do not output any markdown formatting (like ```json ... ```). Output ONLY the raw JSON string.",
      ].join("\n");

      const res = await completeSimple(model, {
        messages: [
          { role: "user", content: `Instruction: "${p.instruction}"`, timestamp: Date.now() },
        ],
        systemPrompt,
      });

      const resultText = res.content
        .filter((c) => c.type === "text")
        .map((c) => (c as { text: string }).text)
        .join("");

      // Parse JSON response
      const cleanJson = resultText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson) as {
        cronExpression: string;
        agentPrompt: string;
        description: string;
      };

      // 3. Create Cron job
      const name = `${WATCH_PREFIX}${parsed.description.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const job = await context.cron.add({
        name,
        description: `NL Watch: ${parsed.description}`,
        enabled: true,
        schedule: { kind: "cron", expr: parsed.cronExpression },
        sessionTarget: "isolated",
        wakeMode: "next-heartbeat",
        payload: {
          kind: "agentTurn",
          message: parsed.agentPrompt,
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

      respond(
        true,
        {
          success: true,
          jobId: job.id,
          name: job.name,
          cronExpression: parsed.cronExpression,
          agentPrompt: parsed.agentPrompt,
          description: parsed.description,
        },
        undefined,
      );
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INTERNAL_ERROR, `watch.add failed: ${String(err)}`),
      );
    }
  },

  "watch.list": async ({ respond, context }) => {
    try {
      const all = await context.cron.list({ includeDisabled: true });
      const watchJobs = all.filter((j) => j.name.startsWith(WATCH_PREFIX));
      respond(
        true,
        {
          watches: watchJobs.map((j) => ({
            id: j.id,
            name: j.name.slice(WATCH_PREFIX.length),
            description: j.description,
            enabled: j.enabled,
            schedule: j.schedule,
            prompt: j.payload.kind === "agentTurn" ? j.payload.message : "",
            lastRunAt: j.state.lastRunAtMs,
            nextRunAt: j.state.nextRunAtMs,
          })),
        },
        undefined,
      );
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INTERNAL_ERROR, `watch.list failed: ${String(err)}`),
      );
    }
  },

  "watch.remove": async ({ params, respond, context }) => {
    const p = params as { name: string };
    if (typeof p.name !== "string" || !p.name.trim()) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "watch name is required"));
      return;
    }
    try {
      const name = p.name.startsWith(WATCH_PREFIX) ? p.name : `${WATCH_PREFIX}${p.name}`;
      const all = await context.cron.list({ includeDisabled: true });
      const matched = all.find((j) => j.name === name);
      if (!matched) {
        respond(
          false,
          undefined,
          errorShape(ErrorCodes.INVALID_REQUEST, `watch with name "${p.name}" not found`),
        );
        return;
      }
      await context.cron.remove(matched.id);
      respond(true, { success: true }, undefined);
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INTERNAL_ERROR, `watch.remove failed: ${String(err)}`),
      );
    }
  },
};
