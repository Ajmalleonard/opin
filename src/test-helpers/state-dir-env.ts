type StateDirEnvSnapshot = {
  opinStateDir: string | undefined;
  opinbotStateDir: string | undefined;
};

export function snapshotStateDirEnv(): StateDirEnvSnapshot {
  return {
    opinStateDir: process.env.OPIN_STATE_DIR,
    opinbotStateDir: process.env.OPINBOT_STATE_DIR,
  };
}

export function restoreStateDirEnv(snapshot: StateDirEnvSnapshot): void {
  if (snapshot.opinStateDir === undefined) {
    delete process.env.OPIN_STATE_DIR;
  } else {
    process.env.OPIN_STATE_DIR = snapshot.opinStateDir;
  }
  if (snapshot.opinbotStateDir === undefined) {
    delete process.env.OPINBOT_STATE_DIR;
  } else {
    process.env.OPINBOT_STATE_DIR = snapshot.opinbotStateDir;
  }
}

export function setStateDirEnv(stateDir: string): void {
  process.env.OPIN_STATE_DIR = stateDir;
  delete process.env.OPIN_STATE_DIR;
}
