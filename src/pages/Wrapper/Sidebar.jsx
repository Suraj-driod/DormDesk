import React, { useMemo } from "react";

/**
 * Props:
 * - role: "admin" | "user"
 * - collapsed?: boolean
 * - onToggleCollapse?: () => void
 * - mobileOpen?: boolean
 * - onClose?: () => void
 * - activeKey?: string
 * - onNavigate?: (key: string) => void
 */
export function Sidebar({
  role,
  collapsed = true,
  onToggleCollapse,
  mobileOpen = false,
  onClose,
  activeKey,
  onNavigate,
}) {
  const items = useMemo(() => {
    if (role === "admin") {
      return [
        { key: "dashboard", label: "Dashboard", icon: DashboardIcon },
        { key: "manage-issues", label: "Manage Issues", icon: IssuesIcon },
        { key: "announcements", label: "Announcements", icon: MegaphoneIcon },
      ];
    }
    return [
      { key: "home", label: "Home", icon: HomeIcon },
      { key: "report-issue", label: "Report Issue", icon: PlusSquareIcon },
      { key: "community", label: "Community", icon: UsersIcon },
      { key: "profile", label: "Profile", icon: UserIcon },
    ];
  }, [role]);

  const currentActiveKey =
    activeKey ||
    (typeof window !== "undefined"
      ? items.find((i) => window.location.pathname.includes(i.key))?.key
      : items[0]?.key);

  const SidebarContent = ({ variant }) => {
    const isMobile = variant === "mobile";
    const widthClass = isMobile ? "w-72" : collapsed ? "w-20" : "w-64";

    return (
    <aside
      className={[
        "h-full bg-white border-r border-[#E0E0E0]",
        "flex flex-col",
        "transition-[width] duration-200 ease-in-out",
        widthClass,
      ].join(" ")}
      aria-label="Sidebar"
    >
      <div className="h-14 px-3 flex items-center justify-between border-b border-[#E0E0E0]">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-[#E0F7FA] flex items-center justify-center text-[#00BCD4] font-semibold">
            {role === "admin" ? "A" : "U"}
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#616161] hover:bg-[#F5F5F5] active:scale-[0.98] transition"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d={collapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
          </svg>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#616161] hover:bg-[#F5F5F5] active:scale-[0.98] transition"
          aria-label="Close sidebar"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="p-3 space-y-1">
        {items.map((item) => {
          const active = item.key === currentActiveKey;
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate?.(item.key)}
              className={[
                "w-full flex items-center gap-3 rounded-xl px-3 py-3 border border-transparent",
                "transition duration-200 ease-in-out",
                "hover:bg-[#E0F7FA] hover:text-[#00BCD4]",
                "hover:border-[#00D9FF]/60 hover:shadow-[0_0_18px_rgba(0,217,255,0.55)]",
                active
                  ? "bg-[#E0F7FA] text-[#00BCD4]"
                  : "text-[#616161]",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <span className="h-6 w-6 flex items-center justify-center">
                <Icon />
              </span>
              {!collapsed && (
                <span className="text-sm font-semibold">{item.label}</span>
              )}
              {active && (
                <span
                  className={[
                    "ml-auto h-2 w-2 rounded-full bg-[#00D9FF]",
                    collapsed ? "" : "",
                  ].join(" ")}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mt-auto p-3">
          <div className="rounded-2xl bg-[#F0FEFF] border border-[#E0F7FA] p-4">
            <div className="text-xs font-bold tracking-wider text-[#9E9E9E] uppercase">
              Tip
            </div>
            <div className="text-sm font-semibold text-[#2C3E50] mt-1">
              Keep issues detailed
            </div>
            <div className="text-sm text-[#616161] mt-1">
              Add photos and exact location for faster resolution.
            </div>
          </div>
        </div>
      )}
    </aside>
    );
  };

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block h-full">
        <SidebarContent variant="desktop" />
      </div>

      {/* Mobile Drawer */}
      <div
        className={[
          "md:hidden fixed inset-0 z-50",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        <div
          className={[
            "absolute inset-0 bg-black/50 transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={onClose}
        />
        <div
          className={[
            "absolute left-0 top-0 h-full transition-transform duration-200 ease-in-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <SidebarContent variant="mobile" />
        </div>
      </div>
    </>
  );
}

function baseIcon(pathD) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d={pathD} />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3h8v6h-8V3zM3 21h8v-6H3v6z" />
    </svg>
  );
}

function IssuesIcon() {
  return baseIcon("M8 7h8M8 12h8M8 17h5M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z");
}

function MegaphoneIcon() {
  return baseIcon("M4 11v2a2 2 0 0 0 2 2h1l3 4h2l-2-4h6l4-4V9l-4-4H6a2 2 0 0 0-2 2v2");
}

function PlusSquareIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 3h18v18H3V3z" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function UsersIcon() {
  return baseIcon(
    "M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.1a4 4 0 0 1 0 7.8M20 21v-2a4 4 0 0 0-3-3.87M10 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
  );
}

function UserIcon() {
  return baseIcon("M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z");
}

