# @opin-cli/nextcloud-talk

Nextcloud Talk channel plugin for **Opin**.

Connect your Opin gateway to [Nextcloud Talk](https://nextcloud.com/talk/) — self-hosted, privacy-respecting messaging for teams. Run your AI agent inside any Nextcloud Talk conversation.

## Install

```bash
opin plugins install @opin-cli/nextcloud-talk
```

Restart the gateway after install.

## Requirements

- A running Nextcloud instance with the Talk app enabled
- A bot user account on your Nextcloud instance

## Quick Setup

1. Create a dedicated bot user on your Nextcloud instance
2. Generate an app password for the bot user (Settings → Security)
3. Configure Opin:

```json
{
  "channels": {
    "nextcloud-talk": {
      "serverUrl": "https://your-nextcloud.example.com",
      "username": "opin-bot",
      "password": "${NEXTCLOUD_APP_PASSWORD}"
    }
  }
}
```

## Configuration

| Key            | Type    | Default  | Description                 |
| -------------- | ------- | -------- | --------------------------- |
| `serverUrl`    | string  | required | Nextcloud instance base URL |
| `username`     | string  | required | Bot account username        |
| `password`     | string  | required | Bot account app password    |
| `pollInterval` | number  | `2000`   | Message poll interval (ms)  |
| `enabled`      | boolean | `true`   | Enable/disable the channel  |

## Features

- 1:1 and group conversation support
- Self-hosted — your data stays on your server
- Works with Nextcloud Talk desktop and mobile apps

## Links

- [Opin docs](https://docs.opin.squareexp.com)
- [Nextcloud Talk](https://nextcloud.com/talk/)

## License

MIT
