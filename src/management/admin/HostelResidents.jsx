import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users, Search, Building2, Layers, Mail, Phone,
  RefreshCw, Copy, ChevronDown, UserCircle, Home,
  Calendar
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { fetchResidentsByHostel, getFloorDistribution } from "../../services/residents.service";

// ── Skeleton Loader ────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[...Array(6)].map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </td>
    ))}
  </tr>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
    <div className="h-8 bg-gray-200 rounded w-1/2" />
  </div>
);

// ── Stat Card ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, bgColor }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <Icon size={20} style={{ color }} />
      </div>
    </div>
    <div className="text-3xl font-bold text-gray-800">{value}</div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════
const HostelResidents = () => {
  const { profile } = useAuth();
  const hostelId = profile?.hostelId;
  const hostelName = profile?.hostelName || "Hostel";

  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [copiedEmails, setCopiedEmails] = useState(false);

  // ── Load residents ─────────────────────────────────────────────────────────
  const loadResidents = useCallback(async () => {
    if (!hostelId) return;
    try {
      const data = await fetchResidentsByHostel(hostelId);
      setResidents(data);
    } catch (err) {
      console.error("Failed to load residents:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hostelId]);

  useEffect(() => {
    loadResidents();
  }, [loadResidents]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadResidents();
  };

  // ── Computed data ──────────────────────────────────────────────────────────
  const floorDistribution = useMemo(() => getFloorDistribution(residents), [residents]);

  const floors = useMemo(() => {
    const uniqueFloors = [...new Set(residents.map((r) => r.floor).filter(Boolean))];
    return uniqueFloors.sort((a, b) => Number(a) - Number(b));
  }, [residents]);

  const filteredResidents = useMemo(() => {
    let filtered = residents;

    // Floor filter
    if (selectedFloor !== "all") {
      filtered = filtered.filter((r) => String(r.floor) === selectedFloor);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          (r.name || "").toLowerCase().includes(q) ||
          (r.email || "").toLowerCase().includes(q) ||
          (r.flatNumber || "").toLowerCase().includes(q) ||
          (r.phone_no || "").toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [residents, selectedFloor, searchQuery]);

  // ── Copy all emails ────────────────────────────────────────────────────────
  const handleCopyEmails = () => {
    const emails = filteredResidents
      .map((r) => r.email)
      .filter(Boolean)
      .join(", ");
    navigator.clipboard.writeText(emails);
    setCopiedEmails(true);
    setTimeout(() => setCopiedEmails(false), 2000);
  };

  // ── Format date ────────────────────────────────────────────────────────────
  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-['Poppins',sans-serif]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-96 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-['Poppins',sans-serif]">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Hostel Residents</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                <Building2 size={14} className="inline mr-1" />
                {hostelName} — {residents.length} registered student{residents.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyEmails}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <Copy size={16} className={copiedEmails ? "text-green-500" : ""} />
              {copiedEmails ? "Copied!" : `Copy ${filteredResidents.length} Emails`}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin text-cyan-500" : "text-gray-500"} />
            </button>
          </div>
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <StatCard
            label="Total Residents"
            value={residents.length}
            icon={Users}
            color="#3B82F6"
            bgColor="#DBEAFE"
          />
          <StatCard
            label="Floors Occupied"
            value={floors.length}
            icon={Layers}
            color="#8B5CF6"
            bgColor="#EDE9FE"
          />
          <StatCard
            label="Most Populated Floor"
            value={
              floorDistribution.length > 0
                ? `Floor ${floorDistribution.reduce((max, f) => (f.count > max.count ? f : max), floorDistribution[0]).floor}`
                : "—"
            }
            icon={Home}
            color="#10B981"
            bgColor="#D1FAE5"
          />
          <StatCard
            label="Showing"
            value={filteredResidents.length}
            icon={Search}
            color="#F59E0B"
            bgColor="#FEF3C7"
          />
        </div>

        {/* ── Search & Filter Bar ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, room number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 transition-all"
              />
            </div>

            {/* Floor Filter */}
            <div className="relative">
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 cursor-pointer transition-all"
              >
                <option value="all">All Floors</option>
                {floors.map((f) => (
                  <option key={f} value={String(f)}>Floor {f}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* ── Residents Table ─────────────────────────────────────────────── */}
          {filteredResidents.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-gray-300" size={32} />
              </div>
              <h3 className="text-gray-800 font-semibold">No residents found</h3>
              <p className="text-gray-400 text-sm mt-1">
                {searchQuery || selectedFloor !== "all"
                  ? "Try adjusting your search or filters"
                  : "No students have registered for this hostel yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Room No.</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Floor</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Block</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredResidents.map((r, idx) => (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-cyan-50/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center text-cyan-700 font-bold text-sm">
                              {(r.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{r.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Mail size={13} className="text-gray-400" />
                            {r.email || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 text-sm font-semibold border border-cyan-100">
                            {r.flatNumber || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {r.floor ? `Floor ${r.floor}` : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {r.blockName || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            {r.phone_no ? (
                              <>
                                <Phone size={13} className="text-gray-400" />
                                {r.phone_no}
                              </>
                            ) : "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(r.created_at)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-4 space-y-3">
                {filteredResidents.map((r, idx) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center text-cyan-700 font-bold text-base">
                        {(r.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{r.name || "—"}</p>
                        <p className="text-xs text-gray-500 truncate">{r.email || "—"}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 text-xs font-bold border border-cyan-100">
                        Room {r.flatNumber || "—"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-white rounded-lg px-2.5 py-2 border border-gray-100">
                        <span className="text-gray-400 block">Floor</span>
                        <span className="font-semibold text-gray-700">{r.floor || "—"}</span>
                      </div>
                      <div className="bg-white rounded-lg px-2.5 py-2 border border-gray-100">
                        <span className="text-gray-400 block">Block</span>
                        <span className="font-semibold text-gray-700">{r.blockName || "—"}</span>
                      </div>
                      <div className="bg-white rounded-lg px-2.5 py-2 border border-gray-100">
                        <span className="text-gray-400 block">Phone</span>
                        <span className="font-semibold text-gray-700">{r.phone_no || "—"}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostelResidents;
