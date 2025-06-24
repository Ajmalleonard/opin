import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-opin writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.opin.mac"
let gatewayLaunchdLabel = "ai.opin.gateway"
let onboardingVersionKey = "opin.onboardingVersion"
let onboardingSeenKey = "opin.onboardingSeen"
let currentOnboardingVersion = 7
let pauseDefaultsKey = "opin.pauseEnabled"
let iconAnimationsEnabledKey = "opin.iconAnimationsEnabled"
let swabbleEnabledKey = "opin.swabbleEnabled"
let swabbleTriggersKey = "opin.swabbleTriggers"
let voiceWakeTriggerChimeKey = "opin.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "opin.voiceWakeSendChime"
let showDockIconKey = "opin.showDockIcon"
let defaultVoiceWakeTriggers = ["opin"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "opin.voiceWakeMicID"
let voiceWakeMicNameKey = "opin.voiceWakeMicName"
let voiceWakeLocaleKey = "opin.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "opin.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "opin.voicePushToTalkEnabled"
let talkEnabledKey = "opin.talkEnabled"
let iconOverrideKey = "opin.iconOverride"
let connectionModeKey = "opin.connectionMode"
let remoteTargetKey = "opin.remoteTarget"
let remoteIdentityKey = "opin.remoteIdentity"
let remoteProjectRootKey = "opin.remoteProjectRoot"
let remoteCliPathKey = "opin.remoteCliPath"
let canvasEnabledKey = "opin.canvasEnabled"
let cameraEnabledKey = "opin.cameraEnabled"
let systemRunPolicyKey = "opin.systemRunPolicy"
let systemRunAllowlistKey = "opin.systemRunAllowlist"
let systemRunEnabledKey = "opin.systemRunEnabled"
let locationModeKey = "opin.locationMode"
let locationPreciseKey = "opin.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "opin.peekabooBridgeEnabled"
let deepLinkKeyKey = "opin.deepLinkKey"
let modelCatalogPathKey = "opin.modelCatalogPath"
let modelCatalogReloadKey = "opin.modelCatalogReload"
let cliInstallPromptedVersionKey = "opin.cliInstallPromptedVersion"
let heartbeatsEnabledKey = "opin.heartbeatsEnabled"
let debugPaneEnabledKey = "opin.debugPaneEnabled"
let debugFileLogEnabledKey = "opin.debug.fileLogEnabled"
let appLogLevelKey = "opin.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26
