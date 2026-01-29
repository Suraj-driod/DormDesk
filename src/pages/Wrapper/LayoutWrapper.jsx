import React, { useMemo, useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

/**
 * Props:
 * - children: React.ReactNode
 * - user: { name?: string, avatarUrl?: string } | null
 * - role: "admin" | "user"
 * - onLogout: () => void
 * - appName?: string
 * - showFooter?: boolean
 */
export function LayoutWrapper({
  children,
  user,
  role,
  onLogout,
  appName = "HostelIssue",
  showFooter = true,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeKey, setActiveKey] = useState(undefined);

  const sidebarWidthClass = useMemo(() => {
    // Desktop only; navbar is fixed so main content uses padding-top.
    return collapsed ? "md:pl-20" : "md:pl-64";
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar
        appName={appName}
        user={user}
        onLogout={onLogout}
        onMenuClick={() => setMobileOpen(true)}
        collapsed={collapsed}
      />

      <div className="pt-14">
        {/* Sidebar (desktop fixed) */}
        <div className="hidden md:block fixed top-14 left-0 bottom-0 z-40">
          <Sidebar
            role={role}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((v) => !v)}
            activeKey={activeKey}
            onNavigate={(key) => setActiveKey(key)}
          />
        </div>

        {/* Sidebar (mobile drawer) */}
        <Sidebar
          role={role}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          activeKey={activeKey}
          onNavigate={(key) => {
            setActiveKey(key);
            setMobileOpen(false);
          }}
        />

        {/* Main */ }
        <main className={["min-h-[calc(100vh-56px)]", sidebarWidthClass].join(" ")}>
          <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
          {showFooter && <Footer appName={appName} />}
        </main>
      </div>
    </div>
  );
}

