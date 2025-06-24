export const PROJECT_NAME = "opin" as const;

export const LEGACY_PROJECT_NAMES = [] as const;

export const MANIFEST_KEY = PROJECT_NAME;

export const LEGACY_MANIFEST_KEYS = LEGACY_PROJECT_NAMES;

export const MANIFEST_KEYS = [MANIFEST_KEY, ...LEGACY_MANIFEST_KEYS] as const;

export type ProjectScopedManifestKey = (typeof MANIFEST_KEYS)[number];

export const LEGACY_PLUGIN_MANIFEST_FILENAMES = [] as const;

export const LEGACY_CANVAS_HANDLER_NAMES = [] as const;

export const MACOS_APP_SOURCES_DIR = "apps/macos/Sources/Opin" as const;

export const LEGACY_MACOS_APP_SOURCES_DIRS = [] as const;

/**
 * Resolve canonical Opin metadata.
 */
export function resolveProjectScopedValue<T>(
  record: Partial<Record<ProjectScopedManifestKey, T>> | Record<string, unknown> | null | undefined,
): T | undefined {
  if (!record) {
    return undefined;
  }
  const entries = record as Record<string, unknown>;
  for (const key of MANIFEST_KEYS) {
    const value = entries[key];
    if (value !== undefined) {
      return value as T;
    }
  }
  return undefined;
}
