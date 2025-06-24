# @opin-cli/zalo

Zalo channel plugin for **Opin** (Official Bot API).

Connect your Opin gateway to [Zalo](https://zalo.me) using the official Zalo Bot API — receive and reply to messages from Zalo users via your verified Zalo OA (Official Account).

## Install

```bash
opin plugins install @opin-cli/zalo
```

Restart the gateway after install.

## Requirements

- A [Zalo Official Account](https://oa.zalo.me) (OA)
- App ID and App Secret from the [Zalo Developer Portal](https://developers.zalo.me)

## Quick Setup

1. Create an app at [developers.zalo.me](https://developers.zalo.me)
2. Link it to your OA and enable messaging permissions
3. Configure Opin:

```json
{
  "channels": {
    "zalo": {
      "appId": "${ZALO_APP_ID}",
      "appSecret": "${ZALO_APP_SECRET}",
      "oaToken": "${ZALO_OA_ACCESS_TOKEN}"
    }
  }
}
```

4. Set your webhook URL in the Zalo Developer Portal to:
   `https://your-gateway-host/webhooks/zalo`

## Configuration

| Key         | Type    | Default  | Description                |
| ----------- | ------- | -------- | -------------------------- |
| `appId`     | string  | required | Zalo app ID                |
| `appSecret` | string  | required | Zalo app secret            |
| `oaToken`   | string  | required | OA access token            |
| `enabled`   | boolean | `true`   | Enable/disable the channel |

## Features

- Receive and reply to Zalo user messages
- Official API — stable and policy-compliant
- Text, image, and file message support

## Links

- [Opin docs](https://docs.opin.squareexp.com)
- [Zalo Developer Portal](https://developers.zalo.me)

## License

MIT
