import { describe, expect, it } from "vitest";
import { getRole, listRoles, resolveRoleSystemPrompt, resolveRoleToolPolicy } from "./roles.js";

describe("getRole", () => {
  it("returns role by id", () => {
    const ceo = getRole("ceo");
    expect(ceo?.name).toBe("CEO");
    expect(ceo?.title).toBe("Chief Executive Officer");
    expect(ceo?.canSpawnSubagents).toBe(true);
  });

  it("returns null for unknown role", () => {
    expect(getRole("unknown")).toBeNull();
  });

  it("all predefined roles exist", () => {
    const roles = listRoles();
    expect(roles.length).toBeGreaterThanOrEqual(9);
    const ids = roles.map((r) => r.id);
    expect(ids).toContain("ceo");
    expect(ids).toContain("cto");
    expect(ids).toContain("engineer");
    expect(ids).toContain("analyst");
    expect(ids).toContain("designer");
    expect(ids).toContain("operator");
    expect(ids).toContain("researcher");
    expect(ids).toContain("coordinator");
    expect(ids).toContain("custom");
  });
});

describe("listRoles", () => {
  it("returns all roles with valid structure", () => {
    const roles = listRoles();
    for (const role of roles) {
      expect(role.id).toBeTruthy();
      expect(role.name).toBeTruthy();
      expect(role.title).toBeTruthy();
      expect(role.description).toBeTruthy();
      expect(typeof role.canSpawnSubagents).toBe("boolean");
      expect(typeof role.canSendMessages).toBe("boolean");
      expect(typeof role.canManagePipelines).toBe("boolean");
      expect(Array.isArray(role.traits)).toBe(true);
    }
  });
});

describe("resolveRoleSystemPrompt", () => {
  it("returns base prompt for role", () => {
    const role = getRole("engineer")!;
    const prompt = resolveRoleSystemPrompt(role);
    expect(prompt).toContain("Software Engineer");
    expect(prompt).toContain("Write clean, tested code");
  });

  it("includes name override", () => {
    const role = getRole("ceo")!;
    const prompt = resolveRoleSystemPrompt(role, { name: "Atlas" });
    expect(prompt).toContain("Atlas");
  });

  it("includes personality override", () => {
    const role = getRole("analyst")!;
    const prompt = resolveRoleSystemPrompt(role, { personality: "Extra thorough and detail-oriented" });
    expect(prompt).toContain("Extra thorough");
  });

  it("includes extra instructions", () => {
    const role = getRole("cto")!;
    const prompt = resolveRoleSystemPrompt(role, { extraInstructions: "Always check security implications" });
    expect(prompt).toContain("Always check security implications");
  });

  it("combines all overrides", () => {
    const role = getRole("operator")!;
    const prompt = resolveRoleSystemPrompt(role, {
      name: "Sentinel",
      personality: "Calm under pressure",
      extraInstructions: "Prioritize uptime above all",
    });
    expect(prompt).toContain("Sentinel");
    expect(prompt).toContain("Calm under pressure");
    expect(prompt).toContain("Prioritize uptime above all");
  });
});

describe("resolveRoleToolPolicy", () => {
  it("returns role policy when no base provided", () => {
    const role = getRole("engineer")!;
    const policy = resolveRoleToolPolicy(role);
    expect(policy.allow).toContain("group:fs");
    expect(policy.allow).toContain("group:runtime");
  });

  it("merges with base policy", () => {
    const role = getRole("analyst")!;
    const policy = resolveRoleToolPolicy(role, { allow: ["custom_tool"], deny: ["dangerous_tool"] });
    expect(policy.allow).toContain("group:web");
    expect(policy.allow).toContain("custom_tool");
    expect(policy.deny).toContain("dangerous_tool");
  });
});

describe("role capabilities", () => {
  it("CEO can spawn subagents and manage pipelines", () => {
    const role = getRole("ceo")!;
    expect(role.canSpawnSubagents).toBe(true);
    expect(role.canManagePipelines).toBe(true);
  });

  it("Engineer cannot spawn subagents or manage pipelines", () => {
    const role = getRole("engineer")!;
    expect(role.canSpawnSubagents).toBe(false);
    expect(role.canManagePipelines).toBe(false);
  });

  it("CTO can spawn subagents", () => {
    const role = getRole("cto")!;
    expect(role.canSpawnSubagents).toBe(true);
  });

  it("Coordinator can spawn subagents and manage pipelines", () => {
    const role = getRole("coordinator")!;
    expect(role.canSpawnSubagents).toBe(true);
    expect(role.canManagePipelines).toBe(true);
  });

  it("Designer cannot spawn subagents", () => {
    const role = getRole("designer")!;
    expect(role.canSpawnSubagents).toBe(false);
  });
});
