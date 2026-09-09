import type { ReactNode } from "react";
import UiIcon, { type IconName } from "./ui-icons";

type Tone = "neutral" | "blue" | "green" | "amber" | "coral" | "violet";

export function formatSourceLocator(locator: unknown) {
  if (!locator || typeof locator !== "object" || Array.isArray(locator)) return "";
  const entries = Object.entries(locator as Record<string, unknown>).filter(([, value]) => value !== null && value !== undefined && value !== "");
  return entries.map(([key, value]) => `${key.replaceAll("_", " ")}: ${typeof value === "string" ? value : String(value)}`).join(" · ");
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="pm-page-header">
      <div>
        <p className="pm-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description ? <p className="pm-page-description">{description}</p> : null}
      </div>
      {action ? <div className="pm-page-header-action">{action}</div> : null}
    </header>
  );
}

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return <span className={`pm-status-badge pm-status-${tone}`}><span aria-hidden="true" />{label}</span>;
}

export function NextBestAction({
  context = "NEXT BEST ACTION",
  action,
  href,
  icon = "arrow-up-right",
  children,
}: {
  context?: string;
  action: string;
  href?: string;
  icon?: IconName;
  children?: ReactNode;
}) {
  return (
    <section className="pm-next-action" aria-label="Next best action">
      <div><p className="pm-eyebrow">{context}</p><strong>{action}</strong>{children ? <span>{children}</span> : null}</div>
      {href ? <a href={href}><UiIcon name={icon} size={15} />Continue <UiIcon name="arrow-up-right" size={13} /></a> : null}
    </section>
  );
}

export function CompactEmptyState({
  title,
  body,
  action,
  icon = "layers",
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: IconName;
}) {
  return <div className="pm-empty-state"><span className="pm-empty-icon"><UiIcon name={icon} size={18} /></span><div><h3>{title}</h3><p>{body}</p>{action ? <div className="pm-empty-action">{action}</div> : null}</div></div>;
}

export function LibraryToolbar({ children }: { children: ReactNode }) {
  return <div className="pm-library-toolbar">{children}</div>;
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return <div className="pm-detail-row"><span>{label}</span><strong>{value}</strong></div>;
}
