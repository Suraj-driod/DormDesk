import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {Navbar} from "../pages/Wrapper/Navbar";
import {Sidebar} from "../pages/Wrapper/Sidebar";
import {Footer} from "../pages/Wrapper/Footer";
import { useAuth } from "../auth/AuthContext";
import { runEscalationCheck } from "../services/escalationService";

const AppLayout = () => {
  const { user, profile, logout } = useAuth(); 
  // profile.role → "admin" | "caretaker" | "student"

  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeKey, setActiveKey] = useState(null);

  /* ----------------------------------------
     Sync sidebar active state with route
  -----------------------------------------*/
  useEffect(() => {
    setActiveKey(location.pathname);
  }, [location.pathname]);

  /* ----------------------------------------
     Sidebar navigation handler
  -----------------------------------------*/
  const handleNavigate = (path) => {
    setActiveKey(path);
    setMobileOpen(false);
    navigate(path);
  };

  /* ----------------------------------------
     Logout handler with navigation
  -----------------------------------------*/
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  /* ----------------------------------------
     Scheduled escalation check (admin only)
     // Move to Firebase Cloud Function scheduled trigger in production
  -----------------------------------------*/
  useEffect(() => {
    if (profile?.role !== "admin") return;

    const hostelId = profile?.hostelId;
    const adminUid = profile?.managementDocId || profile?.id;
    if (!hostelId || !adminUid) return;

    // Run immediately on mount
    runEscalationCheck(hostelId, adminUid).catch((err) =>
      console.error("Escalation check failed:", err)
    );

    // Re-run every 30 minutes
    const intervalId = setInterval(() => {
      runEscalationCheck(hostelId, adminUid).catch((err) =>
        console.error("Scheduled escalation check failed:", err)
      );
    }, 30 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [profile]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      {/* ---------------- Navbar ---------------- */}
      <Navbar
        appName="DormDesk"
        user={profile}
        onLogout={handleLogout}
        onMenuClick={() => setMobileOpen(true)}
      />

      {/* ---------------- Body ---------------- */}
      <div className="flex flex-1 pt-14 min-h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <Sidebar
          role={profile?.role}            // 👈 role-based rendering
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          activeKey={activeKey}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onClose={() => setMobileOpen(false)}
          onNavigate={handleNavigate}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-6 py-6">
            <Outlet />
          </div>
          <Footer appName="DormDesk" />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
