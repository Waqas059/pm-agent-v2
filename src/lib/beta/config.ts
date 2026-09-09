import "server-only";

export type BetaAccessMode = "observe" | "allowlist";

const configuredAdminEmails = process.env.BETA_SUPER_ADMIN_EMAILS?.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean) ?? [];

export const betaConfig = {
  accessMode: (process.env.BETA_ACCESS_MODE?.trim().toLowerCase() === "allowlist" ? "allowlist" : "observe") as BetaAccessMode,
  defaultAllowance: 10,
  adminEmails: configuredAdminEmails.length ? configuredAdminEmails : ["waxas.arshad@gmail.com"],
  contact: {
    name: process.env.BETA_CONTACT_NAME?.trim() || "Waqas Arshad",
    phone: process.env.BETA_CONTACT_PHONE?.trim() || "+92345809536",
    email: process.env.BETA_CONTACT_EMAIL?.trim() || "waxas.arshad@gmail.com",
    handle: process.env.BETA_CONTACT_HANDLE?.trim() || "waxas.arshad",
  },
};

export function isBetaAdmin(email: string | null | undefined) {
  return Boolean(email && betaConfig.adminEmails.includes(email.trim().toLowerCase()));
}
