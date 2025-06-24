---
summary: "CLI reference for `opin voicecall` (voice-call plugin command surface)"
read_when:
  - You use the voice-call plugin and want the CLI entry points
  - You want quick examples for `voicecall call|continue|status|tail|expose`
title: "voicecall"
---

# `opin voicecall`

`voicecall` is a plugin-provided command. It only appears if the voice-call plugin is installed and enabled.

Primary doc:

- Voice-call plugin: [Voice Call](/plugins/voice-call)

## Common commands

```bash
opin voicecall status --call-id <id>
opin voicecall call --to "+25512345678" --message "Hello" --mode notify
opin voicecall continue --call-id <id> --message "Any questions?"
opin voicecall end --call-id <id>
```

## Exposing webhooks (Tailscale)

```bash
opin voicecall expose --mode serve
opin voicecall expose --mode funnel
opin voicecall unexpose
```

Security note: only expose the webhook endpoint to networks you trust. Prefer Tailscale Serve over Funnel when possible.
