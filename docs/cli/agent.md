---
summary: "CLI reference for `opin agent` (send one agent turn via the Gateway)"
read_when:
  - You want to run one agent turn from scripts (optionally deliver reply)
title: "agent"
---

# `opin agent`

Run an agent turn via the Gateway (use `--local` for embedded).
Use `--agent <id>` to target a configured agent directly.

Related:

- Agent send tool: [Agent send](/tools/agent-send)

## Examples

```bash
opin agent --to +25512345678 --message "status update" --deliver
opin agent --agent ops --message "Summarize logs"
opin agent --session-id 1234 --message "Summarize inbox" --thinking medium
opin agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```
