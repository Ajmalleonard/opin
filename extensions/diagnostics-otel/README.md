# @opin-cli/diagnostics-otel

OpenTelemetry diagnostics plugin for **Opin**.

Export traces, metrics, and logs from your Opin gateway to any OpenTelemetry-compatible backend — Grafana, Jaeger, Honeycomb, Datadog, and more.

## Install

```bash
opin plugins install @opin-cli/diagnostics-otel
```

Restart the gateway after install.

## Quick Setup

```json
{
  "plugins": {
    "entries": {
      "diagnostics-otel": {
        "config": {
          "endpoint": "http://localhost:4318",
          "serviceName": "opin-gateway"
        }
      }
    }
  }
}
```

## Configuration

| Key           | Type    | Default                 | Description                 |
| ------------- | ------- | ----------------------- | --------------------------- |
| `endpoint`    | string  | `http://localhost:4318` | OTLP HTTP exporter endpoint |
| `serviceName` | string  | `opin-gateway`          | Service name in traces      |
| `enabled`     | boolean | `true`                  | Enable/disable the plugin   |

## What gets traced

- Incoming messages per channel
- Agent tool invocations
- Gateway request lifecycle
- Plugin execution spans

## Links

- [Opin docs](https://docs.opin.squareexp.com)
- [OpenTelemetry](https://opentelemetry.io)

## License

MIT
