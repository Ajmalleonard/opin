# @opin-cli/msteams

Microsoft Teams channel plugin for **Opin**.

Connect your Opin gateway to Microsoft Teams — respond to messages in chats, channels, and group conversations using the Bot Framework.

## Install

```bash
opin plugins install @opin-cli/msteams
```

Restart the gateway after install.

## Requirements

- A Microsoft Azure account
- A registered Bot Framework app with a Teams channel enabled

## Quick Setup

1. Register a bot at [dev.botframework.com](https://dev.botframework.com) or Azure Bot Service
2. Enable the **Microsoft Teams** channel
3. Note your App ID and App Password
4. Configure Opin:

```json
{
  "channels": {
    "msteams": {
      "appId": "${TEAMS_APP_ID}",
      "appPassword": "${TEAMS_APP_PASSWORD}"
    }
  }
}
```

5. Set your bot's messaging endpoint to:
   `https://your-gateway-host/webhooks/msteams`

## Configuration

| Key           | Type    | Default     | Description                |
| ------------- | ------- | ----------- | -------------------------- |
| `appId`       | string  | required    | Bot Framework App ID       |
| `appPassword` | string  | required    | Bot Framework App Password |
| `dmPolicy`    | string  | `"pairing"` | Access control policy      |
| `enabled`     | boolean | `true`      | Enable/disable the channel |

## Features

- Personal chat (1:1) and group chat support
- Channel mention responses
- Adaptive card message formatting
- Secure webhook signature verification

## Links

- [Opin docs](https://docs.opin.squareexp.com)
- [Azure Bot Service](https://azure.microsoft.com/products/bot-services)

## License

MIT
