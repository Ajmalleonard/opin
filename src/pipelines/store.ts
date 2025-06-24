import fs from "node:fs/promises";
import path from "node:path";
import type { PipelineDefinition, PipelineRun } from "./types.js";

export type PipelineStoreFile = {
  pipelines: Record<string, PipelineDefinition>;
  runs: Record<string, PipelineRun>;
};

const EMPTY_STORE: PipelineStoreFile = { pipelines: {}, runs: {} };

export async function loadPipelineStore(storePath: string): Promise<PipelineStoreFile> {
  try {
    const raw = await fs.readFile(storePath, "utf-8");
    const parsed = JSON.parse(raw) as PipelineStoreFile;
    return {
      pipelines: parsed.pipelines ?? {},
      runs: parsed.runs ?? {},
    };
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { ...EMPTY_STORE };
    }
    throw err;
  }
}

export async function savePipelineStore(
  storePath: string,
  store: PipelineStoreFile,
): Promise<void> {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  const tmp = `${storePath}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf-8");
  await fs.rename(tmp, storePath);
  try {
    await fs.copyFile(storePath, `${storePath}.bak`);
  } catch {
    // best-effort backup
  }
}
