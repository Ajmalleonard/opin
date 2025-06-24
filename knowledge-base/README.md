# Company Knowledge Base

This folder is the company context Ops roles should read before acting. Keep it practical, specific, and current. The goal is to make every role behave like it knows the business, not just the model.

Recommended update rhythm:

- Update service, price, and portfolio files whenever the public offer changes.
- Update policy and invoice rules before letting Ops send client-facing messages.
- Update escalation contacts whenever ownership changes.
- Keep examples short enough that an agent can quote or link them in a client conversation.

Runtime use:

```bash
opin ops knowledge list
opin ops knowledge show company-profile.md
opin ops roles list
opin ops actions list --role finance --approval-required
```
