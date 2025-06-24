import type { RoleId } from "./roles.js";
import { getRole, resolveRoleSystemPrompt } from "./roles.js";

export type AgentIdentity = {
  agentId: string;
  name: string;
  role: RoleId;
  personality?: string;
  team?: string;
  capabilities?: string[];
  createdAtMs: number;
};

export type AgentContact = {
  agentId: string;
  name: string;
  role: RoleId;
  team?: string;
  status: "active" | "idle" | "busy" | "offline";
  lastSeenAtMs?: number;
};

export type ConversationContext = {
  withAgentId?: string;
  withName?: string;
  withRole?: RoleId;
  channel?: string;
  isSubagent: boolean;
  parentAgentId?: string;
  turnCount: number;
};

export type IdentityDeps = {
  nowMs?: () => number;
};

const IDENTITY_STORE = new Map<string, AgentIdentity>();
const CONTACT_BOOK = new Map<string, Map<string, AgentContact>>();

function now(deps?: IdentityDeps): number {
  return (deps?.nowMs ?? Date.now)();
}

export function registerIdentity(identity: AgentIdentity, deps?: IdentityDeps): void {
  IDENTITY_STORE.set(identity.agentId, {
    ...identity,
    createdAtMs: identity.createdAtMs ?? now(deps),
  });
}

export function getIdentity(agentId: string): AgentIdentity | null {
  return IDENTITY_STORE.get(agentId) ?? null;
}

export function removeIdentity(agentId: string): boolean {
  return IDENTITY_STORE.delete(agentId);
}

export function listIdentities(): AgentIdentity[] {
  return Array.from(IDENTITY_STORE.values());
}

export function addContact(ownerAgentId: string, contact: AgentContact, deps?: IdentityDeps): void {
  if (!CONTACT_BOOK.has(ownerAgentId)) {
    CONTACT_BOOK.set(ownerAgentId, new Map());
  }
  CONTACT_BOOK.get(ownerAgentId)!.set(contact.agentId, {
    ...contact,
    lastSeenAtMs: now(deps),
  });
}

export function getContact(ownerAgentId: string, contactAgentId: string): AgentContact | null {
  return CONTACT_BOOK.get(ownerAgentId)?.get(contactAgentId) ?? null;
}

export function listContacts(ownerAgentId: string): AgentContact[] {
  return Array.from(CONTACT_BOOK.get(ownerAgentId)?.values() ?? []);
}

export function updateContactStatus(
  ownerAgentId: string,
  contactAgentId: string,
  status: AgentContact["status"],
  deps?: IdentityDeps,
): void {
  const book = CONTACT_BOOK.get(ownerAgentId);
  const contact = book?.get(contactAgentId);
  if (contact) {
    contact.status = status;
    contact.lastSeenAtMs = now(deps);
  }
}

export function buildIdentitySystemPrompt(params: {
  identity: AgentIdentity;
  conversation?: ConversationContext;
  contacts?: AgentContact[];
}): string {
  const role = getRole(params.identity.role);
  const parts: string[] = [];

  parts.push("## Your Identity");
  parts.push(`- Name: ${params.identity.name}`);
  parts.push(`- Agent ID: ${params.identity.agentId}`);
  if (role) {
    parts.push(`- Role: ${role.title}`);
  }
  if (params.identity.team) {
    parts.push(`- Team: ${params.identity.team}`);
  }
  if (params.identity.personality) {
    parts.push(`- Personality: ${params.identity.personality}`);
  }
  if (params.identity.capabilities?.length) {
    parts.push(`- Capabilities: ${params.identity.capabilities.join(", ")}`);
  }
  parts.push("");

  if (params.conversation) {
    parts.push("## Conversation Context");
    if (params.conversation.withName) {
      parts.push(`- You are talking to: ${params.conversation.withName}`);
      if (params.conversation.withRole) {
        const theirRole = getRole(params.conversation.withRole);
        if (theirRole) {
          parts.push(`  Their role: ${theirRole.title}`);
        }
      }
    }
    if (params.conversation.channel) {
      parts.push(`- Channel: ${params.conversation.channel}`);
    }
    if (params.conversation.isSubagent) {
      parts.push("- You are a subagent in this conversation");
      if (params.conversation.parentAgentId) {
        parts.push(`- Parent agent: ${params.conversation.parentAgentId}`);
      }
    }
    parts.push(`- Turn: ${params.conversation.turnCount}`);
    parts.push("");
  }

  if (params.contacts?.length) {
    parts.push("## Team Contacts");
    for (const contact of params.contacts) {
      const contactRole = getRole(contact.role);
      const statusTag = contact.status !== "active" ? ` [${contact.status}]` : "";
      parts.push(`- ${contact.name} (${contactRole?.title ?? contact.role})${statusTag}`);
      if (contact.team) {
        parts.push(`  Team: ${contact.team}`);
      }
    }
    parts.push("");
  }

  return parts.join("\n");
}

export function buildTeamAwarenessPrompt(agentId: string): string {
  const contacts = listContacts(agentId);
  if (contacts.length === 0) return "";

  const lines = ["## Team Awareness", "You know about these team members:", ""];
  for (const c of contacts) {
    const role = getRole(c.role);
    lines.push(`- **${c.name}** (${role?.title ?? c.role}): ${c.status}`);
  }
  lines.push("");
  lines.push("When you need help, consider who on your team has the right skills.");
  lines.push("");
  return lines.join("\n");
}

export function clearAll(): void {
  IDENTITY_STORE.clear();
  CONTACT_BOOK.clear();
}
