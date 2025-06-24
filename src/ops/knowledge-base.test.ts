import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  listOpsKnowledgeBaseEntries,
  readOpsKnowledgeBaseEntry,
  resolveOpsKnowledgeBaseDir,
} from "./knowledge-base.js";

describe("resolveOpsKnowledgeBaseDir", () => {
  it("defaults to the repository knowledge-base folder", () => {
    expect(resolveOpsKnowledgeBaseDir({}, "/repo")).toBe("/repo/knowledge-base");
  });

  it("honors configured absolute paths", () => {
    expect(resolveOpsKnowledgeBaseDir({ ops: { knowledgeBaseDir: "/company/kb" } }, "/repo")).toBe(
      "/company/kb",
    );
  });

  it("lists and reads nested markdown entries", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "opin-kb-"));
    await fs.mkdir(path.join(dir, "roles", "ops"), { recursive: true });
    await fs.writeFile(path.join(dir, "company-profile.md"), "# Company\n");
    await fs.writeFile(path.join(dir, "roles", "ops", "ROLE.md"), "# Ops\n");

    await expect(listOpsKnowledgeBaseEntries(dir)).resolves.toEqual([
      { name: "company-profile.md", path: path.join(dir, "company-profile.md") },
      { name: "roles/ops/ROLE.md", path: path.join(dir, "roles", "ops", "ROLE.md") },
    ]);
    await expect(readOpsKnowledgeBaseEntry(dir, "roles/ops/ROLE.md")).resolves.toBe("# Ops\n");
  });

  it("rejects entries outside the knowledge base directory", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "opin-kb-"));
    await expect(readOpsKnowledgeBaseEntry(dir, "../outside.md")).rejects.toThrow(
      "inside the knowledge base directory",
    );
  });
});
