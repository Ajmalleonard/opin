# Actions Catalog

This file mirrors the Ops action registry in code. Use it as the human-readable policy for what roles can do.

## Read Actions

- `workspace.read`: workspace metrics and activity.
- `system.read`: backend, core, and mailbox health.
- `heartbeat.run`: deterministic business heartbeat.

## Internal Write Actions

- `tasks.create`: create a task when AI needs human execution.
- `tasks.update`: update task state or details.
- `tasks.comment`: add task context.
- `threads.send`: ask the team or notify an internal thread.
- `invoices.create`: create invoice draft.
- `invoices.review`: review invoice content.

## Approval Required

- `mailbox.compose`: sends client-facing email.
- `invoices.resend`: sends an invoice to a client.
- `billings.remind`: sends a billing reminder.
- `billings.sweep`: can trigger billing automation.

Allowlist only workflows that are low risk and already approved by the company owner.
