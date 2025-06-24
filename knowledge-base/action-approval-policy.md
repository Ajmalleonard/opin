# Action Approval Policy

Ops actions are grouped by risk.

## Autonomous Read Actions

These can run without approval:

- Workspace snapshot
- System health
- Invoice list
- Billing list
- Mailbox list
- Thread list
- Task list
- Knowledge base read

## Autonomous Internal Actions

These can run when the instruction is clear:

- Create a team task
- Add a team task comment
- Add a task checklist item
- Send a team thread message

## Approval Required

These need approval unless allowlisted in `ops.allowlistedActions`:

- `mailbox.compose`
- `invoices.resend`
- `billings.remind`
- `billings.sweep`

## Future Approval Layer

The CLI currently uses explicit `--approve` flags for risky actions. The gateway approval layer should later turn these into owner notifications, allow-once approvals, and allowlisted workflows.

Use `opin ops actions list --approval-required` to review the live action catalog before changing allowlists.
