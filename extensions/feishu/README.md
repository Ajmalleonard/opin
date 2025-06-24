# @opin-cli/feishu

Feishu / Lark channel plugin for **Opin**.

Connect your Opin gateway to Feishu (Lark) — receive and reply to messages in Feishu DMs, group chats, and bots using the Lark Open Platform API.

## Install

```bash
opin plugins install @opin-cli/feishu
```

Restart the gateway after install.

## Requirements

- A Feishu / Lark app ([create one here](https://open.feishu.cn/app))
- App ID and App Secret from the Lark Developer Console

## Quick Setup

1. Create an app at [open.feishu.cn](https://open.feishu.cn/app)
2. Enable **Bot** capability and subscribe to message events
3. Configure Opin:

```json
{
  "channels": {
    "feishu": {
      "appId": "${FEISHU_APP_ID}",
      "appSecret": "${FEISHU_APP_SECRET}"
    }
  }
}
```

4. Set the webhook URL in your app's Event Subscriptions to your gateway endpoint

## Configuration

| Key         | Type    | Default  | Description                |
| ----------- | ------- | -------- | -------------------------- |
| `appId`     | string  | required | Lark app ID                |
| `appSecret` | string  | required | Lark app secret            |
| `enabled`   | boolean | `true`   | Enable/disable the channel |

## Features

- Receive and reply to Feishu DMs and group messages
- Rich card message support
- Webhook-based event handling

## Links

- [Opin docs](https://docs.opin.squareexp.com)
- [Feishu Open Platform](https://open.feishu.cn)

## License

MIT
