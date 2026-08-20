import type { SVGProps } from "react";

export type IconName =
  | "overview"
  | "contract"
  | "people"
  | "payroll"
  | "travel"
  | "shield"
  | "upload"
  | "search"
  | "menu"
  | "close"
  | "database"
  | "file"
  | "check"
  | "warning"
  | "arrow"
  | "logout";

const paths: Record<IconName, React.ReactNode> = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  contract: <><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></>,
  people: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.8V20"/></>,
  payroll: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M8 15h.01M12 15h4"/></>,
  travel: <><path d="M3 11.5 21 5l-6.5 16-3.2-6.3zM11.3 14.7 21 5"/></>,
  shield: <><path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/></>,
  file: <><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  warning: <><path d="m12 3 10 18H2z"/><path d="M12 9v5M12 18h.01"/></>,
  arrow: <path d="m9 18 6-6-6-6"/>,
  logout: <><path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/></>,
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
