import { beforeEach, describe, expect, it } from "vitest";
import {
  registerIdentity,
  getIdentity,
  removeIdentity,
  listIdentities,
  addContact,
  getContact,
  listContacts,
  updateContactStatus,
  buildIdentitySystemPrompt,
  buildTeamAwarenessPrompt,
  clearAll,
} from "./agent-identity.js";

beforeEach(() => {
  clearAll();
});

describe("registerIdentity / getIdentity", () => {
  it("registers and retrieves an identity", () => {
    registerIdentity({
      agentId: "agent-1",
      name: "Atlas",
      role: "ceo",
      createdAtMs: 1000,
    });
    const identity = getIdentity("agent-1");
    expect(identity?.name).toBe("Atlas");
    expect(identity?.role).toBe("ceo");
  });

  it("returns null for unknown agent", () => {
    expect(getIdentity("missing")).toBeNull();
  });
});

describe("removeIdentity", () => {
  it("removes an identity", () => {
    registerIdentity({ agentId: "a1", name: "Test", role: "engineer", createdAtMs: 1 });
    expect(removeIdentity("a1")).toBe(true);
    expect(getIdentity("a1")).toBeNull();
  });

  it("returns false for missing identity", () => {
    expect(removeIdentity("missing")).toBe(false);
  });
});

describe("listIdentities", () => {
  it("lists all registered identities", () => {
    registerIdentity({ agentId: "a1", name: "A", role: "ceo", createdAtMs: 1 });
    registerIdentity({ agentId: "a2", name: "B", role: "engineer", createdAtMs: 1 });
    expect(listIdentities()).toHaveLength(2);
  });
});

describe("contact management", () => {
  it("adds and retrieves contacts", () => {
    addContact("agent-1", { agentId: "agent-2", name: "Bolt", role: "engineer", status: "active" });
    const contact = getContact("agent-1", "agent-2");
    expect(contact?.name).toBe("Bolt");
    expect(contact?.role).toBe("engineer");
  });

  it("lists contacts for an agent", () => {
    addContact("agent-1", { agentId: "a2", name: "B", role: "cto", status: "active" });
    addContact("agent-1", { agentId: "a3", name: "C", role: "analyst", status: "idle" });
    expect(listContacts("agent-1")).toHaveLength(2);
  });

  it("updates contact status", () => {
    addContact("agent-1", { agentId: "a2", name: "B", role: "cto", status: "active" }, { nowMs: () => 100 });
    updateContactStatus("agent-1", "a2", "busy", { nowMs: () => 200 });
    const contact = getContact("agent-1", "a2");
    expect(contact?.status).toBe("busy");
    expect(contact?.lastSeenAtMs).toBe(200);
  });

  it("returns null for missing contact", () => {
    expect(getContact("agent-1", "missing")).toBeNull();
  });
});

describe("buildIdentitySystemPrompt", () => {
  it("builds basic identity prompt", () => {
    const prompt = buildIdentitySystemPrompt({
      identity: { agentId: "a1", name: "Atlas", role: "ceo", createdAtMs: 1 },
    });
    expect(prompt).toContain("Atlas");
    expect(prompt).toContain("Chief Executive Officer");
  });

  it("includes conversation context", () => {
    const prompt = buildIdentitySystemPrompt({
      identity: { agentId: "a1", name: "Atlas", role: "ceo", createdAtMs: 1 },
      conversation: {
        withName: "Bolt",
        withRole: "engineer",
        isSubagent: false,
        turnCount: 3,
      },
    });
    expect(prompt).toContain("Bolt");
    expect(prompt).toContain("Software Engineer");
  });

  it("includes subagent context", () => {
    const prompt = buildIdentitySystemPrompt({
      identity: { agentId: "a1", name: "Atlas", role: "ceo", createdAtMs: 1 },
      conversation: {
        isSubagent: true,
        parentAgentId: "parent-1",
        turnCount: 1,
      },
    });
    expect(prompt).toContain("subagent");
    expect(prompt).toContain("parent-1");
  });

  it("includes contacts", () => {
    const prompt = buildIdentitySystemPrompt({
      identity: { agentId: "a1", name: "Atlas", role: "ceo", createdAtMs: 1 },
      contacts: [
        { agentId: "a2", name: "Bolt", role: "engineer", status: "active" },
        { agentId: "a3", name: "Lens", role: "analyst", status: "busy" },
      ],
    });
    expect(prompt).toContain("Bolt");
    expect(prompt).toContain("Lens");
    expect(prompt).toContain("[busy]");
  });

  it("includes personality and capabilities", () => {
    const prompt = buildIdentitySystemPrompt({
      identity: {
        agentId: "a1",
        name: "Sentinel",
        role: "operator",
        personality: "Calm and methodical",
        capabilities: ["deploy", "monitor", "alert"],
        createdAtMs: 1,
      },
    });
    expect(prompt).toContain("Calm and methodical");
    expect(prompt).toContain("deploy, monitor, alert");
  });
});

describe("buildTeamAwarenessPrompt", () => {
  it("returns empty when no contacts", () => {
    expect(buildTeamAwarenessPrompt("a1")).toBe("");
  });

  it("builds team awareness with contacts", () => {
    addContact("a1", { agentId: "a2", name: "Bolt", role: "engineer", status: "active" });
    addContact("a1", { agentId: "a3", name: "Lens", role: "analyst", status: "idle" });
    const prompt = buildTeamAwarenessPrompt("a1");
    expect(prompt).toContain("Bolt");
    expect(prompt).toContain("Lens");
    expect(prompt).toContain("Team Awareness");
  });
});
