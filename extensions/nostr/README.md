# @opin-cli/nostr

Nostr channel plugin for **Opin**.

Connect your Opin gateway to the [Nostr](https://nostr.com) decentralized network — receive and reply to NIP-04 encrypted direct messages from any Nostr client (Damus, Amethyst, etc.).

## Install

```bash
opin plugins install @opin-cli/nostr
```

Restart the gateway after install.

## Quick Setup

1. Generate a Nostr keypair (if you don't have one):

   ```bash
   # Using nak CLI
   nak key generate
   ```

2. Configure Opin:

   ```json
   {
     "channels": {
       "nostr": {
         "privateKey": "${NOSTR_PRIVATE_KEY}",
         "relays": ["wss://relay.damus.io", "wss://nos.lol"]
       }
     }
   }
   ```

3. Set the environment variable:

   ```bash
   export NOSTR_PRIVATE_KEY="nsec1..."
   ```

4. Restart the gateway — your bot is now reachable on Nostr

## Configuration

| Key          | Type     | Default                                     | Description                                                |
| ------------ | -------- | ------------------------------------------- | ---------------------------------------------------------- |
| `privateKey` | string   | required                                    | Bot's private key (nsec or hex)                            |
| `relays`     | string[] | `["wss://relay.damus.io", "wss://nos.lol"]` | WebSocket relay URLs                                       |
| `dmPolicy`   | string   | `"pairing"`                                 | Access control: `pairing`, `allowlist`, `open`, `disabled` |
| `allowFrom`  | string[] | `[]`                                        | Allowed sender pubkeys (npub or hex)                       |
| `enabled`    | boolean  | `true`                                      | Enable/disable the channel                                 |

## Access Control

- **pairing** (default): Unknown senders receive a pairing code to request access
- **allowlist**: Only pubkeys in `allowFrom` can message the bot
- **open**: Anyone can message the bot
- **disabled**: DMs are disabled

## Protocol Support

| NIP    | Status    | Notes                  |
| ------ | --------- | ---------------------- |
| NIP-01 | Supported | Basic event structure  |
| NIP-04 | Supported | Encrypted DMs (kind:4) |
| NIP-17 | Planned   | Gift-wrapped DMs (v2)  |

## Security Notes

- Private keys are never logged
- Event signatures are verified before processing
- Use environment variables for keys — never commit them to config files
- Use `allowlist` mode in production for controlled access

## Links

- [Opin docs](https://docs.opin.squareexp.com)
- [Nostr.com](https://nostr.com)

## License

MIT
