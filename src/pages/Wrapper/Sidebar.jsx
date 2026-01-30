import React, { useMemo } from "react";

export function Sidebar({
  role,
  collapsed = false,
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

  const SidebarContent = ({ isMobile }) => {
    const widthClass = isMobile ? "w-72" : collapsed ? "w-20" : "w-64";

    return (
      <aside
        className={[
          "bg-white border-r border-[#E0E0E0]",
          "flex flex-col flex-shrink-0",
          "min-h-[calc(100vh-56px)]", // 🔥 FULL HEIGHT FIX
          "transition-[width] duration-200 ease-in-out",
          widthClass,
        ].join(" ")}
      >
        {/* Header */}
        <div className="h-14 px-3 flex items-center justify-between border-b border-[#E0E0E0]">
          <div className="h-9 w-9 rounded-xl bg-[#E0F7FA] flex items-center justify-center text-[#00BCD4] font-semibold">
            {role === "admin" ? "A" : "U"}
          </div>

          {!isMobile && (
            <button
              onClick={onToggleCollapse}
              className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#F5F5F5]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  fill="none"
                  strokeWidth="2"
                  d={collapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"}
                />
              </svg>
            </button>
          )}

          {isMobile && (
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-lg hover:bg-[#F5F5F5]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.key === currentActiveKey;

            return (
              <button
                key={item.key}
                onClick={() => onNavigate?.(item.key)}
                className={[
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl",
                  "transition-all",
                  active
                    ? "bg-[#E0F7FA] text-[#00BCD4]"
                    : "text-[#616161] hover:bg-[#E0F7FA]",
                ].join(" ")}
              >
                <Icon />
                {!collapsed && (
                  <span className="text-sm font-semibold">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tip at Bottom */}
        {!collapsed && (
          <div className="mt-auto p-3">
            <div className="rounded-2xl bg-[#F0FEFF] border border-[#E0F7FA] p-4">
              <div className="text-xs font-bold uppercase text-[#9E9E9E]">
                Tip
              </div>
              <div className="text-sm font-semibold mt-1">
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
      <div className="hidden md:flex">
        <SidebarContent isMobile={false} />
      </div>

      {/* Mobile */}
      <div
        className={`md:hidden fixed inset-0 z-50 ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/50 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
        <div
          className={`absolute left-0 top-0 h-full transition-transform ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent isMobile />
        </div>
      </div>
    </>
  );
}

/* Icons */
function baseIcon(d) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={d} />
    </svg>
  );
}
const HomeIcon = () => baseIcon("M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z");
const DashboardIcon = () => baseIcon("M3 13h8V3H3zM13 21h8V11h-8z");
const IssuesIcon = () => baseIcon("M8 7h8M8 12h8M8 17h5");
const MegaphoneIcon = () => baseIcon("M4 11v2l10 2V9z");
const PlusSquareIcon = () => baseIcon("M12 8v8M8 12h8");
const UsersIcon = () => baseIcon("M17 21v-2a4 4 0 0 0-4-4H6");
const UserIcon = () => baseIcon("M12 11a4 4 0 1 0 0-8");
