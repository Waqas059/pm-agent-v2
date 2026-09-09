import "server-only";

export type BetaAccessMode = "observe" | "allowlist";

const configuredAdminEmails = process.env.BETA_SUPER_ADMIN_EMAILS?.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean) ?? [];

export const betaConfig = {
  accessMode: (process.env.BETA_ACCESS_MODE?.trim().toLowerCase() === "allowlist" ? "allowlist" : "observe") as BetaAccessMode,
  defaultAllowance: 10,
  adminEmails: configuredAdminEmails.length ? configuredAdminEmails : ["waxas.arshad@gmail.com"],
  contact: {
    name: process.env.BETA_CONTACT_NAME?.trim() || "Bootstrap PM beta team",
    phone: process.env.BETA_CONTACT_PHONE?.trim() || "",
    email: process.env.BETA_CONTACT_EMAIL?.trim() || "",
    handle: process.env.BETA_CONTACT_HANDLE?.trim() || "",
  },
};

export function isBetaAdmin(email: string | null | undefined) {
  return Boolean(email && betaConfig.adminEmails.includes(email.trim().toLowerCase()));
}
