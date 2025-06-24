# Opin — Personal AI Core

<p align="center">
  <img src="https://raw.githubusercontent.com/Ajmalleonard/opin/main/ui/public/Opin.png" alt="Opin" width="160">
</p>



**Opin** is a local-first, decentralized, multi-agent AI assistant core running entirely on your own hardware.

Unlike traditional bots trapped inside a browser tab, Opin orchestrates its actions across the messaging channels you already live in (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, and more). It speaks, listens, reasons, and renders interactive canvases on macOS, iOS, and Android. The Gateway acts as the secure control plane; the assistant is your digital companion.

---



Opin is built for speed, privacy, and absolute control. It doesn't ask permission to exist in the cloud; it runs on your hardware, stores its memory locally, and fail-overs models gracefully. Whether you are using Anthropic (recommended), OpenAI, or local Ollama instances, Opin remains:

- **Local-First:** Your context, memory, and routing stay under your physical custody.
- **Multi-Channel:** Instant activation across 10+ platforms with built-in DM pairing.
- **Visually Alive:** Immersive multi-screen Canvas interactions via A2UI engine.

---

## ⚡ Quick Start

### 1. Prerequisites

- **Node.js:** version `22` or greater (Node 22+ runtime is strict baseline).
- **Package Manager:** `pnpm` (recommended), `npm`, or `bun`.

### 2. Global Installation

```bash
npm install -g opin@latest
# or: pnpm add -g opin@latest

# Run the interactive onboarding wizard
opin onboard --install-daemon
```

The wizard will securely configure your workspace, gateway daemon, model API keys, and messaging channels.

---

## 🛠️ CLI Operations & Commands

```bash
# Relaunch/start the gateway server daemon
opin gateway --port 18789 --verbose

# Send a direct message programmatically
opin message send --to +1234567890 --message "Hello from the Opin core"

# Invoke the agent directly from terminal with high reasoning
opin agent --message "Build release checklist" --thinking high
```

---

## 📐 Architecture

```
WhatsApp / Telegram / Slack / Discord / Signal / iMessage / BlueBubbles / Teams / Matrix / Zalo / WebChat
                                                 │
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │           Gateway           │
                                  │       (Control Plane)       │
                                  │    ws://127.0.0.1:18789     │
                                  └──────────────┬──────────────┘
                                                 │
                                                 ├─ Pi Agent Runtime (RPC)
                                                 ├─ CLI Tooling (opin ...)
                                                 ├─ WebChat & Control UI
                                                 ├─ macOS Menu Bar Companion
                                                 └─ iOS / Android Nodes
```

---

## 💎 Features at a Glance

- **Local-first Gateway** — Centralized WebSocket network managing sessions, presence, dynamic configs, cron, and webhooks.
- **Unified Messaging Inbox** — Native integrations for WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage (via BlueBubbles/macOS native), Microsoft Teams, Zalo, Matrix, and WebChat.
- **Multi-Agent Session Gating** — Isolate group/channel conversations, manage activation cues, queue messages, and route peers to dedicated workspaces.
- **Interactive Canvas (A2UI)** — Evaluation engine that lets the agent push live interactive UI modules to your companion screens.
- **Voice Wake & Talk Mode** — Always-on speech processing and text-to-speech utilizing ElevenLabs for fluid voice interactions.
- **Local Sandboxed Browser** — Control a dedicated Opin-managed Chromium instance to browse, click, upload, and extract page contents.
- **Onboarding & Skills** — Highly extensible plugin system with workspace-scoped custom skills, rules, and triggers.

---

## 🔒 Security & Privacy by Default

Opin treats every inbound message as untrusted input:

- **DM Pairing (`dmPolicy="pairing"`)** — Unknown senders are automatically prompted for a pairing code. Approve with `opin pairing approve <channel> <code>` to whitelist.
- **Local Credentials Store** — API keys and session information are encrypted locally at `~/.opin/credentials/`.
- Run `opin doctor` at any time to verify system health and detect potential configuration leaks.

---

## 🛠️ Source Build & Development

For developers building extensions or contributing to the core:

```bash
# Clone the repository
git clone https://github.com/Ajmalleonard/opin.git
cd opin

# Install dependencies and build bundles
pnpm install
pnpm ui:build
pnpm build

# Spin up local development gateway
pnpm gateway:watch
```

---

## 👥 Community

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines, pull request protocols, and release channels. AI/vibe-coded contributions are always welcome! 

Thanks to all clawtributors:
