import { describe, expect, it } from "vitest";

import { assertRetentionAutomationAllowed, resolveRetentionPolicy } from "./policy";

describe("retention policy guard", () => {
  it("remains disabled by default", () => {
    const policy = resolveRetentionPolicy({});
    expect(policy).toMatchObject({ enabled: false, reason: "disabled_by_default" });
    expect(() => assertRetentionAutomationAllowed(policy)).toThrow("disabled");
  });

  it("does not enable automation without explicit policy approval", () => {
    const policy = resolveRetentionPolicy({
      PM_RETENTION_AUTOMATION_ENABLED: "true",
      PM_RETENTION_DAYS: "365",
      PM_RETENTION_WARNING_DAYS: "30",
      PM_RETENTION_RECORD_CLASSES: "analytics",
      PM_RETENTION_FAILURE_POLICY: "fail_closed",
    });
    expect(policy).toMatchObject({ enabled: false, reason: "policy_not_approved" });
  });

  it("requires a complete, internally consistent approved policy", () => {
    const incomplete = resolveRetentionPolicy({ PM_RETENTION_AUTOMATION_ENABLED: "true", PM_RETENTION_POLICY_APPROVED: "true", PM_RETENTION_DAYS: "30", PM_RETENTION_WARNING_DAYS: "30", PM_RETENTION_RECORD_CLASSES: "analytics", PM_RETENTION_FAILURE_POLICY: "fail_closed" });
    expect(incomplete.reason).toBe("incomplete_policy");

    const approved = resolveRetentionPolicy({ PM_RETENTION_AUTOMATION_ENABLED: "true", PM_RETENTION_POLICY_APPROVED: "true", PM_RETENTION_DAYS: "365", PM_RETENTION_WARNING_DAYS: "30", PM_RETENTION_RECORD_CLASSES: "analytics,workflow_runs", PM_RETENTION_FAILURE_POLICY: "fail_closed" });
    expect(approved).toMatchObject({ enabled: true, retentionDays: 365, warningDays: 30, recordClasses: ["analytics", "workflow_runs"], reason: "approved" });
    expect(() => assertRetentionAutomationAllowed(approved)).not.toThrow();
  });
});
