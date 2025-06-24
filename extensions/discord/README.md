# @opin-cli/discord

Discord channel plugin for **Opin**.

Connect your Opin gateway to Discord — respond to DMs and server messages, use slash commands, and run your AI agent inside any Discord server or thread.

## Install

```bash
opin plugins install @opin-cli/discord
```

Restart the gateway after install.

## Requirements

- A Discord bot token ([create one here](https://discord.com/developers/applications))
- Bot invited to your server with the `bot` and `applications.commands` scopes

## Quick Setup

1. Create a bot at [discord.com/developers](https://discord.com/developers/applications)
2. Copy the bot token
3. Configure Opin:

```json
{
  "channels": {
    "discord": {
      "token": "${DISCORD_BOT_TOKEN}"
    }
  }
}
```

4. Invite the bot to your server using the OAuth2 URL generator

## Configuration

| Key             | Type     | Default     | Description                     |
| --------------- | -------- | ----------- | ------------------------------- |
| `token`         | string   | required    | Discord bot token               |
| `dmPolicy`      | string   | `"pairing"` | Access control for DMs          |
| `allowedGuilds` | string[] | `[]`        | Restrict to specific server IDs |

## Features

- Respond to DMs and server messages
- Slash command support
- Thread-aware conversations
- Pairing code access control

## CLI

```bash
opin message send --channel discord --to "username#0000" "Hello from Opin"
```

## Links

- [Opin docs](https://docs.opin.squareexp.com)
- [Discord Developer Portal](https://discord.com/developers)

## License

MIT
