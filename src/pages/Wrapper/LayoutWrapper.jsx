import React, { useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

export function LayoutWrapper({
  children,
  user,
  role,
  onLogout,
  appName = "DormDesk",
  showFooter = true,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeKey, setActiveKey] = useState(undefined);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      {/* Navbar */}
      <Navbar
        appName={appName}
        user={user}
        onLogout={onLogout}
        onMenuClick={() => setMobileOpen(true)}
      />

      {/* Body */}
      <div className="flex flex-1 pt-14 min-h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <Sidebar
          role={role}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          activeKey={activeKey}
          onNavigate={(key) => {
            setActiveKey(key);
            setMobileOpen(false);
          }}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-6 py-6">
            {children}
          </div>
          {showFooter && <Footer appName={appName} />}
        </main>
      </div>
    </div>
  );
}
