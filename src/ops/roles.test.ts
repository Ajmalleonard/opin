import { describe, expect, it } from "vitest";
import { resolveOpsRoleWorkspacesDir } from "./roles.js";

describe("resolveOpsRoleWorkspacesDir", () => {
  it("defaults to knowledge-base roles", () => {
    expect(resolveOpsRoleWorkspacesDir({}, "/repo")).toBe("/repo/knowledge-base/roles");
  });

  it("honors configured absolute paths", () => {
    expect(resolveOpsRoleWorkspacesDir({ ops: { roleWorkspacesDir: "/roles" } }, "/repo")).toBe(
      "/roles",
    );
  });
});
