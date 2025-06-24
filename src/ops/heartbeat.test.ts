import { describe, expect, it } from "vitest";
import { buildOpsHeartbeatReport } from "./heartbeat.js";

describe("buildOpsHeartbeatReport", () => {
  it("stays green when snapshots are quiet", () => {
    const report = buildOpsHeartbeatReport({
      system: { nest: { ok: true }, core: { ok: true }, mailGateway: { ok: true } },
      workspace: { metrics: { support: { unresolved: 0 }, reports: { open: 0 } } },
      tasks: { metrics: { blocked: 0, overdue: 0 } },
      invoices: { metrics: { overdue: 0 } },
      billings: { metrics: { overdue: 0, dueSoon: 0 } },
    });

    expect(report.status).toBe("green");
    expect(report.findings).toHaveLength(0);
  });

  it("marks client and revenue blockers as urgent", () => {
    const report = buildOpsHeartbeatReport({
      system: { nest: { ok: false }, core: { ok: true }, mailGateway: { ok: true } },
      workspace: { metrics: { support: { unresolved: 2 }, reports: { open: 1 } } },
      tasks: { metrics: { blocked: 1, overdue: 0 } },
      invoices: { metrics: { overdue: 1 } },
      billings: { metrics: { overdue: 1, dueSoon: 3 } },
    });

    expect(report.status).toBe("urgent");
    expect(report.findings.map((finding) => finding.area)).toEqual(
      expect.arrayContaining(["system", "support", "tasks", "finance", "billing"]),
    );
    expect(report.suggestedActionIds).toEqual(
      expect.arrayContaining(["tasks.create", "threads.send", "invoices.resend"]),
    );
    expect(report.needsApproval).toEqual(
      expect.arrayContaining(["invoices.resend", "billings.remind", "billings.sweep"]),
    );
  });
});
