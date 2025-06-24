import fs from "node:fs/promises";
import path from "node:path";
import type { OpinConfig } from "../config/config.js";

export type KnowledgeBaseEntry = {
  name: string;
  path: string;
};

const DEFAULT_KNOWLEDGE_BASE_DIR = "knowledge-base";

const isMarkdownFile = (name: string) => name.toLowerCase().endsWith(".md");

async function collectMarkdownEntries(dir: string, prefix = ""): Promise<KnowledgeBaseEntry[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = await Promise.all(
    entries
      .toSorted((a, b) => a.name.localeCompare(b.name))
      .map(async (entry) => {
        const relativeName = prefix ? `${prefix}/${entry.name}` : entry.name;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          return collectMarkdownEntries(fullPath, relativeName);
        }
        if (!entry.isFile() || !isMarkdownFile(entry.name)) {
          return [];
        }
        return [{ name: relativeName, path: fullPath }];
      }),
  );
  return results.flat();
}

export const resolveOpsKnowledgeBaseDir = (config: OpinConfig, cwd = process.cwd()) => {
  const configured = config.ops?.knowledgeBaseDir?.trim() || DEFAULT_KNOWLEDGE_BASE_DIR;
  return path.isAbsolute(configured) ? configured : path.resolve(cwd, configured);
};

export async function listOpsKnowledgeBaseEntries(dir: string): Promise<KnowledgeBaseEntry[]> {
  return collectMarkdownEntries(dir);
}

export async function readOpsKnowledgeBaseEntry(dir: string, name: string) {
  const normalized = path.normalize(name);
  if (!isMarkdownFile(normalized)) {
    throw new Error("Knowledge base entry must be a Markdown file.");
  }
  const root = path.resolve(dir);
  const candidate = path.resolve(root, normalized);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
    throw new Error("Knowledge base entry must stay inside the knowledge base directory.");
  }
  return fs.readFile(candidate, "utf8");
}
