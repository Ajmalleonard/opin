import { completeSimple } from "@mariozechner/pi-ai";
import os from "node:os";
import path from "node:path";
import type { GatewayRequestHandlers } from "./types.js";
import { resolveOpinAgentDir } from "../../agents/agent-paths.js";
import { ensureAuthProfileStore, getApiKeyForModel } from "../../agents/model-auth.js";
import { resolveDefaultModelForAgent } from "../../agents/model-selection.js";
import { resolveModel } from "../../agents/pi-embedded-runner/model.js";
import { createPipelineState, addPipeline } from "../../pipelines/service.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";

function defaultStorePath(): string {
  return path.join(os.homedir(), ".opin", "pipelines.json");
}

export const pipelineNaturalHandlers: GatewayRequestHandlers = {
  "pipeline.natural.create": async ({ params, respond, context }) => {
    const p = params as {
      instruction: string;
      agentId?: string;
    };
    if (typeof p.instruction !== "string" || !p.instruction.trim()) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "instruction is required"));
      return;
    }

    try {
      // 1. Resolve default model and auth
      const agentDir = resolveOpinAgentDir();
      const cfg = context.config.load();
      const agentId = p.agentId ?? cfg.agents?.defaultId ?? "main";
      const modelRef = resolveDefaultModelForAgent({ cfg, agentId });
      const { model, authStorage } = resolveModel(modelRef.provider, modelRef.model, agentDir, cfg);

      if (!model) {
        throw new Error(
          `Failed to resolve model for pipeline builder: ${modelRef.provider}/${modelRef.model}`,
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

      // 2. Call LLM to parse instruction into PipelineDefinition JSON
      const systemPrompt = [
        "You are a Pipeline Definition extraction assistant.",
        "Given a user's natural language request to create a workflow or pipeline, translate it into a structured PipelineDefinition JSON matching the schema.",
        "The schema contains steps, each having kind: 'agent' | 'condition' | 'parallel' | 'loop'.",
        "A step of kind 'agent' must have fields: 'id', 'label', 'task', 'thinking' (one of 'none' | 'low' | 'medium' | 'high').",
        "",
        "Return your response ONLY as a JSON object matching this schema:",
        "{",
        '  "id": "unique-pipeline-id-dash-separated",',
        '  "name": "Human Readable Pipeline Name",',
        '  "description": "Brief description of the pipeline",',
        '  "steps": [',
        "    {",
        '      "kind": "agent",',
        '      "id": "step-id",',
        '      "label": "step label",',
        '      "task": "instructions for this agent step",',
        '      "thinking": "low"',
        "    }",
        "  ],",
        '  "trigger": "manual"',
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
        id: string;
        name: string;
        description?: string;
        steps: unknown[];
        trigger?: "manual" | "scheduled";
      };

      // 3. Save Pipeline
      const state = createPipelineState({
        storePath: defaultStorePath(),
        log: {
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
        },
      });

      const pipeline = await addPipeline(state, {
        id: parsed.id,
        name: parsed.name,
        description: parsed.description,
        steps: parsed.steps as Record<string, unknown>[], // Safe cast since schema is dynamic and validated inside addPipeline
        trigger: parsed.trigger ?? "manual",
      });

      respond(true, { success: true, pipeline }, undefined);
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INTERNAL_ERROR, `pipeline.natural.create failed: ${String(err)}`),
      );
    }
  },
};
