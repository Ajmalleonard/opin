---
summary: "CLI reference for `opin agents` (list/add/delete/set identity)"
read_when:
  - You want multiple isolated agents (workspaces + routing + auth)
title: "agents"
---

# `opin agents`

Manage isolated agents (workspaces + auth + routing).

Related:

- Multi-agent routing: [Multi-Agent Routing](/concepts/multi-agent)
- Agent workspace: [Agent workspace](/concepts/agent-workspace)

## Examples

```bash
opin agents list
opin agents add work --workspace ~/.opin/workspace-work
opin agents set-identity --workspace ~/.opin/workspace --from-identity
opin agents set-identity --agent main --avatar avatars/opin.png
opin agents delete work
```

## Identity files

Each agent workspace can include an `IDENTITY.md` at the workspace root:

- Example path: `~/.opin/workspace/IDENTITY.md`
- `set-identity --from-identity` reads from the workspace root (or an explicit `--identity-file`)

Avatar paths resolve relative to the workspace root.

## Set identity

`set-identity` writes fields into `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relative path, http(s) URL, or data URI)

Load from `IDENTITY.md`:

```bash
opin agents set-identity --workspace ~/.opin/workspace --from-identity
```

Override fields explicitly:

```bash
opin agents set-identity --agent main --name "Opin" --emoji "🦞" --avatar avatars/opin.png
```

Config sample:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "Opin",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/opin.png",
        },
      },
    ],
  },
}
```
