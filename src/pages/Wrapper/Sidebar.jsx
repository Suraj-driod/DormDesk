import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { 
  Home, LayoutDashboard, ClipboardList, Megaphone, Plus, Users, User,
  Settings, Search, AlertTriangle, FileText, Briefcase, Eye, FolderOpen,
  BarChart3, MessageSquare
} from "lucide-react";

export function Sidebar({
  role,
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onClose,
  activeKey,
  onNavigate,
}) {
  const location = useLocation();
  
  const items = useMemo(() => {
    if (role === "admin") {
      return [
        { key: "/", label: "Dashboard", icon: LayoutDashboard },
        { key: "/admin/issues", label: "Manage Issues", icon: ClipboardList },
        { key: "/admin/analytics", label: "Analytics", icon: BarChart3 },
        { key: "/admin/issue-feedback", label: "Feedback", icon: MessageSquare },
        { key: "/admin/announcements", label: "Announcements", icon: Megaphone },
        { key: "/admin/lost", label: "Lost & Found", icon: Search },
        { key: "/admin/cases", label: "Case Assignment", icon: Briefcase },
        { key: "/admin/residents", label: "Residents", icon: Users },
        { key: "/admin/caretakers", label: "Caretakers", icon: Settings },
        { key: "/feed", label: "Public Feed", icon: Eye },
        { key: "/profile", label: "Profile", icon: User },
      ];
    }
    
    if (role === "caretaker") {
      return [
        { key: "/", label: "Dashboard", icon: LayoutDashboard },
        { key: "/caretaker/assignments", label: "My Assignments", icon: Briefcase },
        { key: "/caretaker/feed", label: "Campus Feed", icon: Eye },
        { key: "/profile", label: "Profile", icon: User },
      ];
    }
    
    // Student (default)
    return [
      { key: "/", label: "Home", icon: Home },
      { key: "/feed", label: "Campus Feed", icon: Users },
      { key: "/my-issues", label: "My Issues", icon: FolderOpen },
      { key: "/report-issue", label: "Report Issue", icon: Plus },
      { key: "/lost-found", label: "Lost & Found", icon: Search },
      { key: "/complaints", label: "Complaints", icon: AlertTriangle },
      { key: "/profile", label: "Profile", icon: User },
    ];
  }, [role]);

  const currentActiveKey =
    activeKey ||
    items.find((i) => location.pathname === i.key)?.key ||
    items[0]?.key;



  const SidebarContent = ({ isMobile }) => {
    const widthClass = isMobile ? "w-72" : collapsed ? "w-20" : "w-64";

    return (
      <aside
        className={[
          "bg-white border-r border-[#E0E0E0]",
          "flex flex-col flex-shrink-0",
          "min-h-[calc(100vh-56px)]",
          "transition-[width] duration-200 ease-in-out",
          widthClass,
        ].join(" ")}
      >
        
        {/* Header */}
        <div className="h-14 px-3 flex items-center justify-between border-b border-[#E0E0E0]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#E0F7FA] flex items-center justify-center text-[#00BCD4] shadow-sm">
              <LayoutDashboard size={20} strokeWidth={2.2} />
            </div>
            

            {!collapsed && !isMobile && (
              <span className="text-sm font-semibold text-gray-700">
                Dashboard
              </span>
              
            )}
            {!isMobile && (
            <button
              onClick={onToggleCollapse}
              className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#F5F5F5] transition-colors"
            >
              <svg width="25" height="25" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                <path d={collapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
              </svg>
            </button>
          )}
          </div>
        </div>

        

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.key === currentActiveKey;

            return (
              <button
                key={item.key}
                onClick={() => onNavigate?.(item.key)}
                className={[
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl",
                  "transition-all duration-200",
                  active
                    ? "bg-[#E0F7FA] text-[#00BCD4] shadow-sm"
                    : "text-[#616161] hover:bg-[#F5F5F5]",
                ].join(" ")}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {!collapsed && (
                  <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tips Section */}
        {!collapsed && (
          <div className="p-3 mt-auto">
            <div className="rounded-2xl bg-gradient-to-br from-[#F0FEFF] to-[#E0F7FA] border border-[#B2EBF2] p-4">
              <div className="text-[10px] font-bold uppercase text-[#00838F] tracking-wider mb-2">
                {role === "admin" ? "Admin Tip" : role === "caretaker" ? "Caretaker Tip" : "Quick Tip"}
              </div>
              <div className="text-sm font-medium text-gray-800 mb-1">
                {role === "admin" 
                  ? "Review pending cases" 
                  : role === "caretaker" 
                  ? "Update task status" 
                  : "Add photos to reports"}
              </div>
              <div className="text-xs text-[#546E7A]">
                {role === "admin"
                  ? "Assign issues to caretakers for faster resolution."
                  : role === "caretaker"
                  ? "Keep students updated on progress."
                  : "Photos help resolve issues 2x faster."}
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

      {/* Mobile Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-50 ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
        
        {/* Sidebar Panel */}
        <div
          className={`absolute left-0 top-0 h-full transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent isMobile />
        </div>
      </div>
    </>
  );
}
