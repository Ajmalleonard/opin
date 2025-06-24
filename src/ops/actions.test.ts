import { describe, expect, it } from "vitest";
import { getOpsAction, isOpsActionApproved, listOpsActions } from "./actions.js";

describe("ops actions", () => {
  it("includes approval metadata for client-facing actions", () => {
    expect(getOpsAction("mailbox.compose")).toMatchObject({
      approvalRequired: true,
      risk: "client-facing",
    });
  });

  it("lists action ids once", () => {
    const ids = listOpsActions().map((action) => action.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("honors allowlisted actions", () => {
    expect(
      isOpsActionApproved(
        { ops: { allowlistedActions: ["billings.sweep"] } },
        "billings.sweep",
        false,
      ),
    ).toBe(true);
    expect(isOpsActionApproved({}, "billings.sweep", false)).toBe(false);
  });
});
