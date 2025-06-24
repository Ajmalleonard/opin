import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { migrateStateCommand, previewStateMigration } from "./migrate-state.js";

let tempRoot: string | null = null;

async function makeTempRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "opin-migrate-state-"));
  tempRoot = root;
  return root;
}

afterEach(async () => {
  if (!tempRoot) {
    return;
  }
  await fs.rm(tempRoot, { recursive: true, force: true });
  tempRoot = null;
});

describe("migrate-state", () => {
  it("previews pending Opinbotlegacy to Opin migrations", async () => {
    const root = await makeTempRoot();
    await fs.mkdir(path.join(root, ".opinbotlegacy"), { recursive: true });
    await fs.writeFile(path.join(root, ".opinbotlegacy", "opinbotlegacy.json"), "{}", "utf8");

    const preview = await previewStateMigration({} as NodeJS.ProcessEnv, () => root);

    expect(preview.pending).toContain(
      `State dir: ${path.join(root, ".opinbotlegacy")} → ${path.join(root, ".opin")}`,
    );
    expect(preview.pending).toContain(
      `Config file: ${path.join(root, ".opinbotlegacy", "opinbotlegacy.json")} → ${path.join(root, ".opin", "opin.json")}`,
    );
  });

  it("applies the state dir and config filename migration", async () => {
    const root = await makeTempRoot();
    const legacyDir = path.join(root, ".opinbotlegacy");
    await fs.mkdir(legacyDir, { recursive: true });
    await fs.writeFile(path.join(legacyDir, "opinbotlegacy.json"), "{}", "utf8");
    const env = {} as NodeJS.ProcessEnv;

    const logs: string[] = [];
    const errors: string[] = [];
    await migrateStateCommand(
      {
        log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
        error: (...args: unknown[]) => errors.push(args.map(String).join(" ")),
        exit: (code: number) => {
          throw new Error(`unexpected exit ${code}`);
        },
      },
      { apply: true, env, homedir: () => root },
    );

    const targetDir = path.join(root, ".opin");
    expect(await fs.readlink(legacyDir)).toBe(targetDir);
    await expect(fs.stat(path.join(targetDir, "opin.json"))).resolves.toBeDefined();
    expect(logs.join("\n")).toContain("Applied state migration:");
    expect(errors).toEqual([]);
  });
});
