# Opin Publishing Guide

Date: 2026-04-05
Repo: `/Users/ajmaljs/Developer/opin`

## What to publish

### 1. Core npm package

Publish this to the public npm registry at `https://www.npmjs.com/`:

- `opin` from `package.json`

Important:

- `opin/plugin-sdk` ships from the root `opin` package.
- You do **not** need a separate npm package just for the SDK.
- The temporary `opin` CLI alias can stay for compatibility, but it is not a separate package.

### 2. Extension npm packages

Publish these to the public npm registry at `https://www.npmjs.com/` under the `@opin/*` scope.

Already publishable as-is (`private: false`):

- `@opin/bluebubbles` from `extensions/bluebubbles/package.json`
- `@opin/diagnostics-otel` from `extensions/diagnostics-otel/package.json`
- `@opin/discord` from `extensions/discord/package.json`
- `@opin/feishu` from `extensions/feishu/package.json`
- `@opin/lobster` from `extensions/lobster/package.json`
- `@opin/matrix` from `extensions/matrix/package.json`
- `@opin/msteams` from `extensions/msteams/package.json`
- `@opin/nextcloud-talk` from `extensions/nextcloud-talk/package.json`
- `@opin/nostr` from `extensions/nostr/package.json`
- `@opin/voice-call` from `extensions/voice-call/package.json`
- `@opin/zalo` from `extensions/zalo/package.json`
- `@opin/zalouser` from `extensions/zalouser/package.json`

Need `private` removed before npm publish:

- `@opin/copilot-proxy` from `extensions/copilot-proxy/package.json`
- `@opin/google-antigravity-auth` from `extensions/google-antigravity-auth/package.json`
- `@opin/google-gemini-cli-auth` from `extensions/google-gemini-cli-auth/package.json`
- `@opin/googlechat` from `extensions/googlechat/package.json`
- `@opin/imessage` from `extensions/imessage/package.json`
- `@opin/line` from `extensions/line/package.json`
- `@opin/llm-task` from `extensions/llm-task/package.json`
- `@opin/mattermost` from `extensions/mattermost/package.json`
- `@opin/memory-core` from `extensions/memory-core/package.json`
- `@opin/memory-lancedb` from `extensions/memory-lancedb/package.json`
- `@opin/minimax-portal-auth` from `extensions/minimax-portal-auth/package.json`
- `@opin/open-prose` from `extensions/open-prose/package.json`
- `@opin/signal` from `extensions/signal/package.json`
- `@opin/slack` from `extensions/slack/package.json`
- `@opin/telegram` from `extensions/telegram/package.json`
- `@opin/tlon` from `extensions/tlon/package.json`
- `@opin/twitch` from `extensions/twitch/package.json`
- `@opin/whatsapp` from `extensions/whatsapp/package.json`

### 3. Docs site

Publish the Mintlify docs from `docs/` to:

- `https://docs.opin.squareexp.com/`

Repo/domain files already aligned for this:

- `docs/CNAME`
- `src/terminal/links.ts`
- repo-wide docs links now point at `docs.opin.squareexp.com`

### 4. Source and releases

Publish source code and release artifacts from the GitHub repository you want to own as Opin.

Before the first release:

- choose the final Opin GitHub repo slug
- publish source there
- publish release artifacts from that repo's Releases page
- if you want npm/package metadata to link there, add `repository`, `homepage`, and `bugs` fields to `package.json`

## What not to publish for a fresh Opin launch

Do not publish these unless you intentionally want legacy compatibility shims:

- `opinbot` from `packages/opinbot/package.json`
- `moltbot` from `packages/moltbot/package.json`
- any `@opin/*` package names
- a separate `opin` npm package

## Publish order

1. Publish `opin` first.
   Reason: all external plugin SDK imports should resolve from `opin/plugin-sdk`.
2. Publish the `@opin/*` extension packages.
3. Publish the docs site to `docs.opin.squareexp.com`.
4. Publish GitHub release artifacts.
5. Only after that, decide whether to keep or remove legacy Opin aliases.

## Exact publish commands

### Root package

From repo root:

```bash
npm publish --access public
```

### Extension packages

From each extension directory you want to publish:

```bash
cd extensions/<name>
npm publish --access public
```

Examples:

```bash
cd extensions/discord
npm publish --access public

cd extensions/telegram
npm publish --access public
```

If npm rejects a package because it is private, remove `"private": true` from that package's `package.json` first.

## Docs publish checklist

1. Ensure DNS for `docs.opin.squareexp.com` points to your docs host.
2. Ensure the docs host/custom-domain setting uses `docs.opin.squareexp.com`.
3. Deploy the `docs/` site.
4. Verify these URLs load:
   - `https://docs.opin.squareexp.com/`
   - `https://docs.opin.squareexp.com/start/getting-started`
   - `https://docs.opin.squareexp.com/install/docker`

## Notes about SDK and manifests

- Canonical SDK import is now `opin/plugin-sdk`.
- Legacy SDK import `opin/plugin-sdk` still resolves for compatibility.
- Canonical plugin manifest filename is now `opin.plugin.json`.
- Legacy plugin manifest filename `opin.plugin.json` still works as a fallback.
- Canonical package metadata key is now `opin`.
- Legacy package metadata key `opin` still works as a fallback.

## Final recommendation

For a clean Opin launch, publish only:

- `opin`
- the `@opin/*` extension packages you actually plan to support
- docs at `docs.opin.squareexp.com`

Skip every Opin-branded package unless you want a temporary migration bridge.
