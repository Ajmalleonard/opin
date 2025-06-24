---
summary: "CLI reference for `opin reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `opin reset`

Reset local config/state (keeps the CLI installed).

```bash
opin reset
opin reset --dry-run
opin reset --scope config+creds+sessions --yes --non-interactive
```
