# Ops Heartbeat

## Hourly

- System health
- Blocked tasks
- Overdue tasks
- Mail gateway status
- Unresolved support

## Daily

- Open reports
- Active bookings
- Stale tasks
- Owner decisions waiting

## Notify Owner When

- Backend, core, or mail health is degraded.
- A task is overdue or blocked.
- A client is waiting and no owner is assigned.

## Summary Format

```text
Ops pulse: <green, attention, urgent>
Systems: <status>
Work blockers: <count and owner>
Suggested action: <specific action>
```
