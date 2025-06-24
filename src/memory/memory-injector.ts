import { getPreferenceProfile } from "./preference-profile.js";

/**
 * Loads the preference profile for the agent and appends it to the extra system prompt.
 */
export async function injectPreferenceProfile(
  extraSystemPrompt: string | undefined,
  agentId?: string,
): Promise<string> {
  const profile = await getPreferenceProfile(agentId);
  const parts: string[] = [];

  if (extraSystemPrompt?.trim()) {
    parts.push(extraSystemPrompt.trim());
  }

  if (profile?.preferences?.trim()) {
    parts.push(
      "## User Preferences & Style Profile",
      "Keep these persistent user preferences and working style constraints in mind during the conversation:",
      profile.preferences.trim(),
      "",
    );
  }

  return parts.join("\n\n");
}
