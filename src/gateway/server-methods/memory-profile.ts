import type { GatewayRequestHandlers } from "./types.js";
import {
  getPreferenceProfile,
  setPreferenceProfile,
  clearPreferenceProfile,
} from "../../memory/preference-profile.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";

export const memoryProfileHandlers: GatewayRequestHandlers = {
  "memory.profile.get": async ({ params, respond }) => {
    const p = params as { agentId?: string };
    try {
      const profile = await getPreferenceProfile(p.agentId);
      respond(true, profile ?? { preferences: "", lastUpdated: "" }, undefined);
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INTERNAL_ERROR, `memory.profile.get failed: ${String(err)}`),
      );
    }
  },

  "memory.profile.set": async ({ params, respond }) => {
    const p = params as { preferences: string; agentId?: string };
    if (typeof p.preferences !== "string") {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, "preferences must be a string"),
      );
      return;
    }
    try {
      await setPreferenceProfile(
        {
          preferences: p.preferences,
          lastUpdated: new Date().toISOString(),
        },
        p.agentId,
      );
      respond(true, { success: true }, undefined);
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INTERNAL_ERROR, `memory.profile.set failed: ${String(err)}`),
      );
    }
  },

  "memory.profile.clear": async ({ params, respond }) => {
    const p = params as { agentId?: string };
    try {
      await clearPreferenceProfile(p.agentId);
      respond(true, { success: true }, undefined);
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INTERNAL_ERROR, `memory.profile.clear failed: ${String(err)}`),
      );
    }
  },
};
