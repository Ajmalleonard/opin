import fs from "node:fs/promises";
import path from "node:path";
import type { OpinConfig } from "../config/config.js";

export type OpsRoleFile = "role" | "heartbeat" | "tools";

export type OpsRoleWorkspace = {
  id: string;
  path: string;
  files: Partial<Record<OpsRoleFile, string>>;
};

const DEFAULT_ROLE_WORKSPACES_DIR = "knowledge-base/roles";

const ROLE_FILE_NAMES: Record<OpsRoleFile, string> = {
  role: "ROLE.md",
  heartbeat: "HEARTBEAT.md",
  tools: "TOOLS.md",
};

export const resolveOpsRoleWorkspacesDir = (config: OpinConfig, cwd = process.cwd()) => {
  const configured = config.ops?.roleWorkspacesDir?.trim() || DEFAULT_ROLE_WORKSPACES_DIR;
  return path.isAbsolute(configured) ? configured : path.resolve(cwd, configured);
};

async function fileExists(filePath: string) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

export async function listOpsRoleWorkspaces(dir: string): Promise<OpsRoleWorkspace[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const roles = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .toSorted((a, b) => a.name.localeCompare(b.name))
      .map(async (entry) => {
        const rolePath = path.join(dir, entry.name);
        const files: Partial<Record<OpsRoleFile, string>> = {};
        for (const [key, filename] of Object.entries(ROLE_FILE_NAMES) as [OpsRoleFile, string][]) {
          const filePath = path.join(rolePath, filename);
          if (await fileExists(filePath)) {
            files[key] = filePath;
          }
        }
        return { id: entry.name, path: rolePath, files };
      }),
  );
  return roles.filter((role) => Object.keys(role.files).length > 0);
}

export async function readOpsRoleWorkspaceFile(dir: string, roleId: string, file: OpsRoleFile) {
  const normalizedRole = path.basename(roleId);
  const filename = ROLE_FILE_NAMES[file];
  return fs.readFile(path.join(dir, normalizedRole, filename), "utf8");
}
