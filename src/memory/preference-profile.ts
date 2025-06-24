import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { Api, Model } from "@mariozechner/pi-ai";
import { completeSimple } from "@mariozechner/pi-ai";
import { AuthStorage } from "@mariozechner/pi-coding-agent";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resolveStateDir } from "../config/paths.js";
import { resolveRequiredHomeDir } from "../infra/home-dir.js";
import { DEFAULT_AGENT_ID, normalizeAgentId } from "../routing/session-key.js";

export interface PreferenceProfile {
  preferences: string;
  lastUpdated: string;
}

export function resolvePreferencesPath(
  agentId?: string,
  env: NodeJS.ProcessEnv = process.env,
  homedir: () => string = () => resolveRequiredHomeDir(env, os.homedir),
): string {
  const root = resolveStateDir(env, homedir);
  const id = normalizeAgentId(agentId ?? DEFAULT_AGENT_ID);
  return path.join(root, "agents", id, "preferences.json");
}

export async function getPreferenceProfile(agentId?: string): Promise<PreferenceProfile | null> {
  const filepath = resolvePreferencesPath(agentId);
  try {
    const data = await fs.readFile(filepath, "utf8");
    return JSON.parse(data) as PreferenceProfile;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

export async function setPreferenceProfile(
  profile: PreferenceProfile,
  agentId?: string,
): Promise<void> {
  const filepath = resolvePreferencesPath(agentId);
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, JSON.stringify(profile, null, 2), "utf8");
}

export async function clearPreferenceProfile(agentId?: string): Promise<void> {
  const filepath = resolvePreferencesPath(agentId);
  try {
    await fs.unlink(filepath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }
}

/**
 * Parses a session's JSONL transcript, extracts dialogue, and uses the active LLM
 * to update the user's preference profile.
 */
export async function extractAndSavePreferences(params: {
  sessionFile: string;
  agentId: string;
  model: Model<Api>;
  authStorage: AuthStorage;
}): Promise<void> {
  const { sessionFile, agentId, model } = params;

  // Read and parse transcript
  let messages: AgentMessage[] = [];
  try {
    const content = await fs.readFile(sessionFile, "utf8");
    messages = content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line) as AgentMessage);
  } catch {
    // If session file doesn't exist or isn't parseable, stop
    return;
  }

  // Format conversation dialogue
  const dialogueLines: string[] = [];
  for (const msg of messages) {
    if (msg.role === "user" || msg.role === "assistant") {
      const textParts: string[] = [];
      if (typeof msg.content === "string") {
        textParts.push(msg.content);
      } else if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (
            block &&
            typeof block === "object" &&
            "text" in block &&
            typeof block.text === "string"
          ) {
            textParts.push(block.text);
          }
        }
      }
      const text = textParts.join(" ").trim();
      if (text) {
        dialogueLines.push(`${msg.role === "user" ? "User" : "Assistant"}: ${text}`);
      }
    }
  }

  if (dialogueLines.length === 0) {
    return;
  }

  const transcriptText = dialogueLines.join("\n");
  const currentProfile = await getPreferenceProfile(agentId);
  const currentPrefs = currentProfile?.preferences || "(No preference profile established yet)";

  const systemPrompt = [
    "You are an expert user style and preference extraction assistant.",
    "Your goal is to look at the conversation transcript and identify user styles, preferred tech stacks,",
    "communication preferences (e.g. concise, explanatory, visual), or explicit requests (e.g. 'never use tailwind', 'always write code comments').",
    "",
    "Formulate an updated set of user preferences by integrating any new learnings from the conversation into the existing preferences list.",
    "Output ONLY the final updated preference list as a clean, structured bulleted markdown text.",
    "Do not include any headers, preambles, introductions, conclusions, or explanations.",
    "If the conversation has no new style, stack, or communication preference indicators, output exactly the word: NONE",
  ].join("\n");

  const prompt = [
    "--- EXISTING PREFERENCES ---",
    currentPrefs,
    "",
    "--- NEW CONVERSATION TRANSCRIPT ---",
    transcriptText,
    "",
    "--- INSTRUCTION ---",
    "Compare the conversation transcript to the existing preferences. Build the final updated preference profile, or output NONE.",
  ].join("\n");

  try {
    const res = await completeSimple(model, {
      messages: [{ role: "user", content: prompt, timestamp: Date.now() }],
      systemPrompt,
    });

    const resultText = res.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { text: string }).text)
      .join("");

    const trimmed = resultText.trim();
    if (trimmed && trimmed.toUpperCase() !== "NONE") {
      await setPreferenceProfile(
        {
          preferences: trimmed,
          lastUpdated: new Date().toISOString(),
        },
        agentId,
      );
    }
  } catch {
    // Fail silently in background tasks so main session flows never crash due to memory sync
  }
}
