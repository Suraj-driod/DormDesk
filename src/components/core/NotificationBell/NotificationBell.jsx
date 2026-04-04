import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from "../../../services/notificationService";

// ── Time ago helper ────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

// ── Type icon color ────────────────────────────────────────────────────────────
const TYPE_STYLES = {
  status_change: { bg: "bg-blue-100", text: "text-blue-600", label: "Status" },
  assignment: { bg: "bg-orange-100", text: "text-orange-600", label: "Assigned" },
  escalation: { bg: "bg-red-100", text: "text-red-600", label: "Escalated" },
  announcement: { bg: "bg-purple-100", text: "text-purple-600", label: "Announce" },
};

const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Real-time listener ───────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = fetchNotifications(userId, (data) => {
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [userId]);

  // ── Click outside to close ───────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    await markAllAsRead(userId);
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    setOpen(false);
    if (notif.issueId) {
      navigate("/issues");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative h-10 w-10 rounded-xl flex items-center justify-center hover:bg-[#F5F5F5] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-[#616161]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const style = TYPE_STYLES[notif.type] || TYPE_STYLES.announcement;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                      !notif.isRead ? "bg-blue-50/60" : ""
                    }`}
                  >
                    {/* Type badge */}
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                      <span className={`text-[10px] font-bold ${style.text}`}>
                        {style.label.slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${!notif.isRead ? "font-semibold text-gray-800" : "font-medium text-gray-600"}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
