# @opin-cli/zalouser

Zalo personal account plugin for **Opin** (via zca-cli).

Connect your Opin gateway to Zalo using a personal user account — receive and reply to messages from friends and groups without needing an Official Account.

> **Warning:** Automating personal Zalo accounts may violate Zalo's terms of service and can result in account suspension. Use at your own risk. This is an unofficial integration.

## Install

```bash
opin plugins install @opin-cli/zalouser
```

Restart the gateway after install.

## Requirements

- [zca-cli](https://zca-cli.dev) installed and authenticated on your host
- A personal Zalo account logged in via zca-cli

## Quick Setup

1. Install and log in to zca-cli:

   ```bash
   npm install -g zca-cli
   zca login
   ```

2. Configure Opin:

```json
{
  "channels": {
    "zalouser": {
      "zcaPath": "/usr/local/bin/zca",
      "enabled": true
    }
  }
}
```

## Configuration

| Key         | Type     | Default       | Description                                    |
| ----------- | -------- | ------------- | ---------------------------------------------- |
| `zcaPath`   | string   | auto-detected | Absolute path to the `zca` binary              |
| `dmPolicy`  | string   | `"pairing"`   | Access control: `pairing`, `allowlist`, `open` |
| `allowFrom` | string[] | `[]`          | Allowed Zalo user IDs                          |
| `enabled`   | boolean  | `true`        | Enable/disable the channel                     |

## Features

- Send and receive Zalo personal messages
- Group chat support
- Pairing code access control
- Friend and group lookup

## Difference from `@opin-cli/zalo`

|              | `@opin-cli/zalo`      | `@opin-cli/zalouser`              |
| ------------ | --------------------- | --------------------------------- |
| Account type | Official Account (OA) | Personal account                  |
| API          | Official Zalo Bot API | Unofficial (zca-cli)              |
| Stability    | High                  | Lower (may break on Zalo updates) |
| Risk         | None                  | Account suspension risk           |

## Links

- [Opin docs](https://docs.opin.squareexp.com)
- [zca-cli](https://zca-cli.dev)

## License

MIT
