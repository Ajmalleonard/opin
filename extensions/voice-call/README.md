# @opin-cli/voice-call

Voice call plugin for **Opin**.

Give your Opin agent a phone number. Make and receive AI-powered voice calls using Twilio, Telnyx, or Plivo — with real-time speech streaming and TTS.

## Install

```bash
opin plugins install @opin-cli/voice-call
```

Restart the gateway after install.

## Providers

| Provider   | Notes                              |
| ---------- | ---------------------------------- |
| **Twilio** | Programmable Voice + Media Streams |
| **Telnyx** | Call Control v2                    |
| **Plivo**  | Voice API + XML                    |
| **Mock**   | Local dev, no network              |

## Quick Setup

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "your_token",
          },

          // Expose the webhook (pick one):
          // "publicUrl": "https://example.ngrok.app/voice/webhook",
          // "tunnel": { "provider": "ngrok" },
          // "tailscale": { "mode": "funnel", "path": "/voice/webhook" }
        },
      },
    },
  },
}
```

## CLI

```bash
opin voicecall call --to "+25512345678" --message "Hello from Opin"
opin voicecall continue --call-id <id> --message "Any questions?"
opin voicecall speak --call-id <id> --message "One moment"
opin voicecall end --call-id <id>
opin voicecall status --call-id <id>
opin voicecall tail
opin voicecall expose --mode funnel
```

## Agent Tool

Tool name: `voice_call`

| Action          | Parameters                |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

## TTS

Voice calls use the core `messages.tts` config (OpenAI or ElevenLabs). Override per-plugin:

```json5
{
  tts: {
    provider: "openai",
    openai: { voice: "alloy" },
  },
}
```

## Notes

- Twilio/Telnyx/Plivo require a **publicly reachable** webhook URL
- `mock` provider works without any external account (dev only)
- Webhook signatures are verified for Twilio, Telnyx, and Plivo

## Links

- [Opin docs](https://docs.opin.squareexp.com)
- [Twilio](https://twilio.com) · [Telnyx](https://telnyx.com) · [Plivo](https://plivo.com)

## License

MIT
