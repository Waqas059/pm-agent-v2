export type RetentionFailurePolicy = "fail_closed" | "alert_only";

export type RetentionPolicy = {
  enabled: boolean;
  retentionDays: number | null;
  warningDays: number | null;
  recordClasses: readonly string[];
  failurePolicy: RetentionFailurePolicy | null;
  reason: "disabled_by_default" | "policy_not_approved" | "incomplete_policy" | "invalid_policy" | "approved";
};

type RetentionEnvironment = {
  PM_RETENTION_AUTOMATION_ENABLED?: string;
  PM_RETENTION_POLICY_APPROVED?: string;
  PM_RETENTION_DAYS?: string;
  PM_RETENTION_WARNING_DAYS?: string;
  PM_RETENTION_RECORD_CLASSES?: string;
  PM_RETENTION_FAILURE_POLICY?: string;
};

function isTrue(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

function positiveInteger(value: string | undefined) {
  if (!value || !/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function resolveRetentionPolicy(environment: RetentionEnvironment = process.env as RetentionEnvironment): RetentionPolicy {
  if (!isTrue(environment.PM_RETENTION_AUTOMATION_ENABLED)) {
    return { enabled: false, retentionDays: null, warningDays: null, recordClasses: [], failurePolicy: null, reason: "disabled_by_default" };
  }

  if (!isTrue(environment.PM_RETENTION_POLICY_APPROVED)) {
    return { enabled: false, retentionDays: null, warningDays: null, recordClasses: [], failurePolicy: null, reason: "policy_not_approved" };
  }

  const retentionDays = positiveInteger(environment.PM_RETENTION_DAYS);
  const warningDays = positiveInteger(environment.PM_RETENTION_WARNING_DAYS);
  const recordClasses = (environment.PM_RETENTION_RECORD_CLASSES ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  const failurePolicy = environment.PM_RETENTION_FAILURE_POLICY === "fail_closed" || environment.PM_RETENTION_FAILURE_POLICY === "alert_only"
    ? environment.PM_RETENTION_FAILURE_POLICY
    : null;

  if (!retentionDays || !warningDays || warningDays >= retentionDays || recordClasses.length === 0 || !failurePolicy) {
    const reason = environment.PM_RETENTION_AUTOMATION_ENABLED === "true" && environment.PM_RETENTION_POLICY_APPROVED === "true"
      ? "incomplete_policy"
      : "invalid_policy";
    return { enabled: false, retentionDays: null, warningDays: null, recordClasses: [], failurePolicy: null, reason };
  }

  return { enabled: true, retentionDays, warningDays, recordClasses, failurePolicy, reason: "approved" };
}

export function assertRetentionAutomationAllowed(policy: RetentionPolicy) {
  if (!policy.enabled || policy.reason !== "approved") {
    throw new Error(`Automatic retention is disabled: ${policy.reason}.`);
  }
}
