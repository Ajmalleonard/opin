# @opin-cli/lobster

[Lobster](https://github.com/mariozechner/lobster) workflow plugin for **Opin**.

Adds the `lobster` tool to your Opin agent — enabling typed JSON-first pipelines, multi-step workflows, and human-in-the-loop approvals without changing core.

## Install

```bash
opin plugins install @opin-cli/lobster
```

Restart the gateway after install.

## What is Lobster?

Lobster is a standalone workflow shell with typed JSON pipelines and an approval/resume system. This plugin connects it to Opin so your agent can trigger and compose Lobster workflows as tools.

## Enable

The lobster tool is registered as `optional: true`. Enable it per-agent in your config:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "allow": ["lobster"]
        }
      }
    ]
  }
}
```

## Configuration

| Key           | Type   | Default       | Description                           |
| ------------- | ------ | ------------- | ------------------------------------- |
| `lobsterPath` | string | auto-detected | Absolute path to the `lobster` binary |

Use an absolute `lobsterPath` in production to avoid PATH hijacking.

## Security

- Runs `lobster` as a local subprocess — scoped to your host only
- Tool policy applies: only allowed tools can be invoked via `opin.invoke`
- Use a tight `tools.allow` list to prevent arbitrary tool calls from workflows

## Using `opin.invoke` (Lobster → Opin tools)

Lobster pipelines can call back into Opin tools via an `opin.invoke` step (e.g. `gog`, `gh`, `message.send`). The gateway must be running and the target tool must be in the agent allowlist.

## Links

- [Opin docs](https://docs.opin.squareexp.com)
- [Lobster](https://github.com/mariozechner/lobster)

## License

MIT
