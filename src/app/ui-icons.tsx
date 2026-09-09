export type IconName =
  | "activity"
  | "archive"
  | "arrow-up-right"
  | "bell"
  | "chart"
  | "check"
  | "chevron-down"
  | "chevron-right"
  | "clock"
  | "compass"
  | "file"
  | "files"
  | "gauge"
  | "home"
  | "layers"
  | "list"
  | "menu"
  | "message"
  | "plug"
  | "plus"
  | "search"
  | "scan"
  | "shield"
  | "sparkle"
  | "split"
  | "trash"
  | "user"
  | "x";

type UiIconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
};

const paths: Record<IconName, React.ReactNode> = {
  activity: <><path d="M4 12h4l2-7 4 14 2-7h4" /><path d="M4 19h16" /></>,
  archive: <><path d="M4 7h16" /><path d="M5 7v12h14V7" /><path d="M9 11h6" /><path d="M6 4h12l1 3H5l1-3Z" /></>,
  "arrow-up-right": <><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>,
  bell: <><path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 5 2 5.5 2 5.5h-15s2-.5 2-5.5Z" /><path d="M10 19h4" /></>,
  chart: <><path d="M5 19V9" /><path d="M12 19V5" /><path d="M19 19v-7" /><path d="M3 19h18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  "chevron-down": <path d="m7 10 5 5 5-5" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
  compass: <><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
  file: <><path d="M6 3.5h7l5 5V20H6z" /><path d="M13 3.5V9h5" /></>,
  files: <><path d="M8 4h9v12H8z" /><path d="M5 8H4v12h9v-2" /></>,
  gauge: <><path d="M4.5 15a7.5 7.5 0 1 1 15 0" /><path d="m12 12 3.5-3.5" /><path d="M7 18h10" /></>,
  home: <><path d="m4 10 8-6 8 6" /><path d="M6 9v10h12V9" /><path d="M10 19v-5h4v5" /></>,
  layers: <><path d="m12 4 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4" /><path d="m4 16 8 4 8-4" /></>,
  list: <><path d="M8 6h12" /><path d="M8 12h12" /><path d="M8 18h12" /><path d="M4 6h.01" /><path d="M4 12h.01" /><path d="M4 18h.01" /></>,
  menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  message: <><path d="M5 5h14v10H9l-4 4V5Z" /><path d="M8 9h8" /><path d="M8 12h5" /></>,
  plug: <><path d="M9 7v4" /><path d="M15 7v4" /><path d="M7 11h10v1a5 5 0 0 1-10 0v-1Z" /><path d="M12 17v3" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4 4" /></>,
  scan: <><circle cx="12" cy="12" r="7" /><path d="M12 9v6" /><path d="M9 12h6" /></>,
  shield: <><path d="M12 3.5 19 6v5c0 4.5-3 7.8-7 9.5C8 18.8 5 15.5 5 11V6l7-2.5Z" /><path d="m9 12 2 2 4-4" /></>,
  sparkle: <><path d="m12 3 1.2 5.2L18 10l-4.8 1.8L12 17l-1.2-5.2L6 10l4.8-1.8L12 3Z" /><path d="m19 15 .5 2.1L21.5 18l-2 1-.5 2-.5-2-2-1 2-1 .5-2Z" /></>,
  split: <><path d="M6 6h3l6 6h3" /><path d="M6 18h3l6-6h3" /><path d="M6 6v12" /></>,
  trash: <><path d="M5 7h14" /><path d="M10 11v5" /><path d="M14 11v5" /><path d="m8 7 .7-3h6.6l.7 3" /><path d="M7 7l.7 14h8.6L17 7" /></>,
  user: <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  x: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
};

export default function UiIcon({ name, size = 18, strokeWidth = 1.8 }: UiIconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
