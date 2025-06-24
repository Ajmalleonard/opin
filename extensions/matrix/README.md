# @opin-cli/matrix

Matrix channel plugin for **Opin**.

Connect your Opin gateway to the [Matrix](https://matrix.org) network — receive and reply to encrypted DMs and room messages across any Matrix homeserver.

## Install

```bash
opin plugins install @opin-cli/matrix
```

Restart the gateway after install.

## Requirements

- A Matrix account for your bot (on any homeserver, e.g. `matrix.org`)
- Access token for the bot account

## Quick Setup

1. Register a bot account on your Matrix homeserver
2. Get the access token (`/_matrix/client/v3/login`)
3. Configure Opin:

```json
{
  "channels": {
    "matrix": {
      "homeserverUrl": "https://matrix.org",
      "accessToken": "${MATRIX_ACCESS_TOKEN}",
      "userId": "@yourbot:matrix.org"
    }
  }
}
```

## Configuration

| Key             | Type    | Default     | Description                         |
| --------------- | ------- | ----------- | ----------------------------------- |
| `homeserverUrl` | string  | required    | Matrix homeserver URL               |
| `accessToken`   | string  | required    | Bot access token                    |
| `userId`        | string  | required    | Full Matrix user ID (`@bot:server`) |
| `dmPolicy`      | string  | `"pairing"` | Access control for DMs              |
| `enabled`       | boolean | `true`      | Enable/disable the channel          |

## Features

- End-to-end encrypted DMs (via matrix-sdk-crypto)
- Room message support
- Pairing code access control
- Works with Element, Cinny, and any Matrix client

## Links

- [Opin docs](https://docs.opin.squareexp.com)
- [Matrix.org](https://matrix.org)

## License

MIT
