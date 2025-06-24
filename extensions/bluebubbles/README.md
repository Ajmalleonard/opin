# @opin-cli/bluebubbles

iMessage channel plugin for **Opin** via [BlueBubbles](https://bluebubbles.app).

Bring iMessage into your Opin gateway — receive and reply to iMessages, reactions, and attachments from any device using the BlueBubbles server running on a Mac.

## Install

```bash
opin plugins install @opin-cli/bluebubbles
```

Restart the gateway after install.

## Requirements

- A Mac running [BlueBubbles Server](https://bluebubbles.app/downloads/)
- BlueBubbles Server accessible from your Opin gateway (local network or via tunnel)

## Quick Setup

1. Open BlueBubbles Server → Settings → enable **Webhook notifications**
2. Note your server URL and password
3. Configure Opin:

```json
{
  "channels": {
    "bluebubbles": {
      "serverUrl": "http://your-mac-host:1234",
      "password": "your-server-password",
      "webhookPath": "/webhooks/bluebubbles"
    }
  }
}
```

4. Point BlueBubbles Server's webhook URL at your gateway:
   `http://your-gateway-host/webhooks/bluebubbles`

## Configuration

| Key                 | Type    | Default                 | Description                 |
| ------------------- | ------- | ----------------------- | --------------------------- |
| `serverUrl`         | string  | required                | BlueBubbles server base URL |
| `password`          | string  | required                | Server password             |
| `webhookPath`       | string  | `/webhooks/bluebubbles` | Gateway webhook path        |
| `actions.reactions` | boolean | `true`                  | Enable tapback reactions    |

## Features

- Receive iMessages, group chats, and attachments
- Send text replies and tapback reactions
- Media attachments via `<media:...>` placeholders
- Automatic chat GUID resolution from phone numbers

## CLI

```bash
opin message send --channel bluebubbles --to "+15551234567" "Hello from Opin"
```

## Links

- [Opin docs](https://docs.opin.squareexp.com)
- [BlueBubbles](https://bluebubbles.app)

## License

MIT
