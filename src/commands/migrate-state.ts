import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { OpinConfig } from "../config/config.js";
import type { RuntimeEnv } from "../runtime.js";
import {
  createConfigIO,
  loadConfig,
  resolveCanonicalConfigPath,
  resolveLegacyStateDirs,
  resolveNewStateDir,
  resolveStateDir,
} from "../config/config.js";
import {
  autoMigrateLegacyStateDir,
  detectLegacyStateMigrations,
  runLegacyStateMigrations,
} from "./doctor-state-migrations.js";

const LEGACY_CONFIG_FILENAMES = [
  "opinlegacy.json",
  "opinbotlegacy.json",
  "moltbot.json",
  "moldbot.json",
] as const;

type MigrateStateOptions = {
  apply?: boolean;
  env?: NodeJS.ProcessEnv;
  homedir?: () => string;
};

type MigrationPreview = {
  pending: string[];
  warnings: string[];
};

type ConfigMigrationResult = {
  changes: string[];
  warnings: string[];
};

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function resolveExplicitConfigPath(env: NodeJS.ProcessEnv): string | null {
  return (
    env.OPIN_CONFIG_PATH?.trim() ||
    env.OPIN_CONFIG_PATH?.trim() ||
    env.OPIN_CONFIG_PATH?.trim() ||
    null
  );
}

function findLegacyConfigPath(dir: string): string | null {
  for (const filename of LEGACY_CONFIG_FILENAMES) {
    const candidate = path.join(dir, filename);
    if (fileExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

function resolvePendingStateDirMove(env: NodeJS.ProcessEnv, homedir: () => string): string | null {
  if (env.OPIN_STATE_DIR?.trim()) {
    return null;
  }
  const targetDir = resolveNewStateDir(homedir);
  if (fileExists(targetDir)) {
    return null;
  }
  const legacyDir = resolveLegacyStateDirs(homedir).find((candidate) => fileExists(candidate));
  if (!legacyDir) {
    return null;
  }
  return `State dir: ${legacyDir} → ${targetDir}`;
}

function previewCanonicalConfigMigration(
  env: NodeJS.ProcessEnv,
  homedir: () => string,
): string | null {
  if (resolveExplicitConfigPath(env)) {
    return null;
  }

  const currentStateDir = resolveStateDir(env, homedir);
  const targetStateDir = env.OPIN_STATE_DIR?.trim() ? currentStateDir : resolveNewStateDir(homedir);
  const canonicalPath = resolveCanonicalConfigPath(env, targetStateDir);
  if (fileExists(canonicalPath)) {
    return null;
  }

  const sourcePath = findLegacyConfigPath(targetStateDir) ?? findLegacyConfigPath(currentStateDir);
  if (!sourcePath) {
    return null;
  }

  return `Config file: ${sourcePath} → ${canonicalPath}`;
}

function migrateCanonicalConfigFile(
  env: NodeJS.ProcessEnv = process.env,
  homedir: () => string = os.homedir,
): ConfigMigrationResult {
  if (resolveExplicitConfigPath(env)) {
    return { changes: [], warnings: [] };
  }

  const stateDir = resolveStateDir(env, homedir);
  const canonicalPath = resolveCanonicalConfigPath(env, stateDir);
  if (fileExists(canonicalPath)) {
    return { changes: [], warnings: [] };
  }

  const legacyPath = findLegacyConfigPath(stateDir);
  if (!legacyPath) {
    return { changes: [], warnings: [] };
  }

  try {
    fs.mkdirSync(path.dirname(canonicalPath), { recursive: true });
    fs.renameSync(legacyPath, canonicalPath);
    return {
      changes: [`Config file: ${legacyPath} → ${canonicalPath}`],
      warnings: [],
    };
  } catch (err) {
    return {
      changes: [],
      warnings: [
        `Failed to migrate config file (${legacyPath} → ${canonicalPath}): ${String(err)}`,
      ],
    };
  }
}

function loadConfigForMigration(
  env: NodeJS.ProcessEnv = process.env,
  homedir: () => string = os.homedir,
): OpinConfig {
  try {
    return createConfigIO({ env, homedir }).loadConfig();
  } catch {
    try {
      return loadConfig();
    } catch {
      return {};
    }
  }
}

export async function previewStateMigration(
  env: NodeJS.ProcessEnv = process.env,
  homedir: () => string = os.homedir,
): Promise<MigrationPreview> {
  const pending: string[] = [];
  const warnings: string[] = [];

  const pendingStateDirMove = resolvePendingStateDirMove(env, homedir);
  if (pendingStateDirMove) {
    pending.push(pendingStateDirMove);
  }

  const pendingConfigMove = previewCanonicalConfigMigration(env, homedir);
  if (pendingConfigMove) {
    pending.push(pendingConfigMove);
  }

  const cfg = loadConfigForMigration(env, homedir);
  const detected = await detectLegacyStateMigrations({ cfg, env, homedir });
  pending.push(...detected.preview);

  return { pending, warnings };
}

export async function migrateStateCommand(
  runtime: RuntimeEnv,
  options: MigrateStateOptions = {},
): Promise<void> {
  const env = options.env ?? process.env;
  const homedir = options.homedir ?? os.homedir;
  const preview = await previewStateMigration(env, homedir);
  if (!options.apply) {
    if (preview.pending.length === 0 && preview.warnings.length === 0) {
      runtime.log("No state migration needed.");
      return;
    }
    if (preview.pending.length > 0) {
      runtime.log(
        `Pending state migration:\n${preview.pending.map((line) => `- ${line}`).join("\n")}`,
      );
    }
    if (preview.warnings.length > 0) {
      runtime.error(
        `Migration warnings:\n${preview.warnings.map((line) => `- ${line}`).join("\n")}`,
      );
    }
    runtime.log("Run `opin migrate-state --apply` to apply these changes.");
    return;
  }

  const stateDirResult = await autoMigrateLegacyStateDir({ env, homedir });
  const configResult = migrateCanonicalConfigFile(env, homedir);
  const cfg = loadConfigForMigration(env, homedir);
  const detected = await detectLegacyStateMigrations({ cfg, env, homedir });
  const legacyResult = await runLegacyStateMigrations({ detected });

  const changes = [...stateDirResult.changes, ...configResult.changes, ...legacyResult.changes];
  const warnings = [...stateDirResult.warnings, ...configResult.warnings, ...legacyResult.warnings];

  if (changes.length === 0 && warnings.length === 0) {
    runtime.log("No state migration needed.");
    return;
  }

  if (changes.length > 0) {
    runtime.log(`Applied state migration:\n${changes.map((line) => `- ${line}`).join("\n")}`);
  }
  if (warnings.length > 0) {
    runtime.error(`Migration warnings:\n${warnings.map((line) => `- ${line}`).join("\n")}`);
  }
}
