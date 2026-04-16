import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart3, TrendingUp, Clock, CheckCircle, AlertTriangle,
  RefreshCw, Users, Activity, ShieldAlert, Zap
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import {
  fetchAllIssuesForAnalytics,
  computeOpenClosedRatio,
  computeAvgResolutionTimeByCategory,
  computeIssueVolumeOverTime,
  computeIssueDensityByCategory,
  computeCaretakerPerformance,
  computeEscalationStats,
} from "../services/analyticsService";
import { fetchAllCaretakers } from "../services/management.service";

// ── Color Palette ──────────────────────────────────────────────────────────────
const COLORS = {
  cyan: "#00BCD4",
  cyanLight: "#E0F7FA",
  green: "#10B981",
  greenLight: "#D1FAE5",
  red: "#EF4444",
  redLight: "#FEE2E2",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  purple: "#8B5CF6",
  purpleLight: "#EDE9FE",
  blue: "#3B82F6",
  blueLight: "#DBEAFE",
  gray: "#6B7280",
};

const CATEGORY_COLORS = [
  "#00BCD4", "#8B5CF6", "#F59E0B", "#EF4444", "#10B981",
  "#3B82F6", "#EC4899", "#14B8A6", "#F97316", "#6366F1",
];

// ── Skeleton Loader ────────────────────────────────────────────────────────────
const SkeletonCard = ({ className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 p-6 animate-pulse ${className}`}>
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
    <div className="h-3 bg-gray-100 rounded w-2/3" />
  </div>
);

const SkeletonChart = ({ className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 p-6 animate-pulse ${className}`}>
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-6" />
    <div className="flex items-end gap-2 h-48">
      {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
        <div key={i} className="flex-1 bg-gray-200 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

// ── Stat Card ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, bgColor, subtitle }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: bgColor }}>
        <Icon size={20} style={{ color }} />
      </div>
    </div>
    <div className="text-3xl font-bold text-gray-800">{value}</div>
    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
  </div>
);

// ── SVG Donut Chart ────────────────────────────────────────────────────────────
const DonutChart = ({ open, closed, openPercent, closedPercent }) => {
  const total = open + closed || 1;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const closedArc = (closed / total) * circumference;
  const openArc = circumference - closedArc;

  return (
    <div className="flex items-center gap-8">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {/* Background circle */}
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="18" />
        {/* Closed arc (green) */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={COLORS.green}
          strokeWidth="18"
          strokeDasharray={`${closedArc} ${circumference}`}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        {/* Open arc (red/amber) */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={COLORS.red}
          strokeWidth="18"
          strokeDasharray={`${openArc} ${circumference}`}
          strokeDashoffset={circumference * 0.25 - closedArc}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        {/* Center text */}
        <text x="90" y="84" textAnchor="middle" className="text-2xl font-bold fill-gray-800">{total}</text>
        <text x="90" y="102" textAnchor="middle" className="text-xs fill-gray-400">Total</text>
      </svg>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.red }} />
          <div>
            <span className="text-sm font-semibold text-gray-700">{open} Open</span>
            <span className="text-xs text-gray-400 ml-2">{openPercent}%</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.green }} />
          <div>
            <span className="text-sm font-semibold text-gray-700">{closed} Closed</span>
            <span className="text-xs text-gray-400 ml-2">{closedPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── SVG Bar Chart (Issue Volume Over Time) ─────────────────────────────────────
const BarChartSVG = ({ data }) => {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barWidth = Math.max(8, Math.min(28, 600 / data.length - 4));
  const chartHeight = 200;
  const chartWidth = Math.max(600, data.length * (barWidth + 4));

  return (
    <div className="overflow-x-auto">
      <svg width={chartWidth} height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
          <g key={frac}>
            <line
              x1="30" y1={chartHeight - frac * chartHeight}
              x2={chartWidth} y2={chartHeight - frac * chartHeight}
              stroke="#F3F4F6" strokeWidth="1"
            />
            <text
              x="24" y={chartHeight - frac * chartHeight + 4}
              textAnchor="end" className="text-[10px] fill-gray-400"
            >
              {Math.round(maxCount * frac)}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.count / maxCount) * chartHeight;
          const x = 36 + i * (barWidth + 4);
          return (
            <g key={d.date}>
              <rect
                x={x} y={chartHeight - barHeight}
                width={barWidth} height={barHeight}
                rx="4" fill={COLORS.cyan}
                opacity={0.85}
              >
                <title>{`${d.date}: ${d.count} issues`}</title>
              </rect>
              {/* Date label (show every Nth) */}
              {(data.length <= 14 || i % Math.ceil(data.length / 10) === 0) && (
                <text
                  x={x + barWidth / 2} y={chartHeight + 16}
                  textAnchor="middle" className="text-[9px] fill-gray-400"
                  transform={`rotate(-45, ${x + barWidth / 2}, ${chartHeight + 16})`}
                >
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── Horizontal Bar (Category Density) ──────────────────────────────────────────
const HorizontalBars = ({ data }) => {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.category}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700 capitalize">{d.category}</span>
            <span className="text-xs text-gray-500">{d.count} ({d.percent}%)</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{
                width: `${(d.count / maxCount) * 100}%`,
                backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Empty State ────────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
      <BarChart3 size={36} className="text-gray-300" />
    </div>
    <h3 className="text-lg font-semibold text-gray-700 mb-1">No Data Available</h3>
    <p className="text-sm text-gray-400 text-center max-w-sm">
      There are no issues for this hostel yet. Analytics will appear once issues are reported.
    </p>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════
const AnalyticsDashboard = () => {
  const { profile } = useAuth();
  const hostelId = profile?.hostelId;

  const [issues, setIssues] = useState([]);
  const [caretakersMap, setCaretakersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [volumePeriod, setVolumePeriod] = useState("7d");
  const [runningEscalation, setRunningEscalation] = useState(false);

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!hostelId) return;
    setLoading(true);
    try {
      const [issueData, caretakerData] = await Promise.all([
        fetchAllIssuesForAnalytics(hostelId),
        fetchAllCaretakers(hostelId),
      ]);

      setIssues(issueData);

      const map = {};
      caretakerData.forEach((ct) => {
        map[ct.id] = ct;
      });
      setCaretakersMap(map);
    } catch (err) {
      console.error("Analytics load error:", err);
    } finally {
      setLoading(false);
    }
  }, [hostelId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Computed metrics ───────────────────────────────────────────────────────
  const ratio = useMemo(() => computeOpenClosedRatio(issues), [issues]);
  const avgResolution = useMemo(() => computeAvgResolutionTimeByCategory(issues), [issues]);
  const volumeData = useMemo(() => computeIssueVolumeOverTime(issues, volumePeriod), [issues, volumePeriod]);
  const density = useMemo(() => computeIssueDensityByCategory(issues), [issues]);
  const performance = useMemo(() => computeCaretakerPerformance(issues, caretakersMap), [issues, caretakersMap]);
  const escalationStats = useMemo(() => computeEscalationStats(issues), [issues]);

  const overallAvgDays = useMemo(() => {
    if (avgResolution.length === 0) return "—";
    const avg = avgResolution.reduce((sum, r) => sum + r.avgDays, 0) / avgResolution.length;
    return `${Math.round(avg * 10) / 10}d`;
  }, [avgResolution]);

  const globalAvgDays = useMemo(() => {
    const withAvg = performance.filter((p) => p.avgDays !== null);
    if (withAvg.length === 0) return null;
    return withAvg.reduce((sum, p) => sum + p.avgDays, 0) / withAvg.length;
  }, [performance]);

  // ── Run Escalation Check ───────────────────────────────────────────────────
  const handleRunEscalation = async () => {
    setRunningEscalation(true);
    try {
      // Dynamic import to avoid circular deps
      const { runEscalationCheck } = await import("../services/escalationService");
      const adminUid = profile?.managementDocId || profile?.id;
      const result = await runEscalationCheck(hostelId, adminUid);
      if (result.escalatedCount > 0) {
        // Refresh data after escalation
        await loadData();
      }
      alert(`Escalation check complete. ${result.escalatedCount} issue(s) escalated.`);
    } catch (err) {
      console.error("Escalation check error:", err);
      alert("Escalation check failed. See console for details.");
    } finally {
      setRunningEscalation(false);
    }
  };

  // ── Skeleton loading state ─────────────────────────────────────────────────
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (issues.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-['Poppins',sans-serif]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
          <EmptyState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-['Poppins',sans-serif]">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">
              Hostel performance metrics &amp; issue insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunEscalation}
              disabled={runningEscalation}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors shadow-sm"
            >
              {runningEscalation ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <ShieldAlert size={16} />
              )}
              Run Escalation Check
            </button>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <StatCard
            label="Total Issues"
            value={issues.length}
            icon={BarChart3}
            color={COLORS.blue}
            bgColor={COLORS.blueLight}
            subtitle="All time"
          />
          <StatCard
            label="Open"
            value={ratio.open}
            icon={AlertTriangle}
            color={COLORS.red}
            bgColor={COLORS.redLight}
            subtitle={`${ratio.openPercent}% of total`}
          />
          <StatCard
            label="Closed"
            value={ratio.closed}
            icon={CheckCircle}
            color={COLORS.green}
            bgColor={COLORS.greenLight}
            subtitle={`${ratio.closedPercent}% of total`}
          />
          <StatCard
            label="Avg Resolution"
            value={overallAvgDays}
            icon={Clock}
            color={COLORS.amber}
            bgColor={COLORS.amberLight}
            subtitle="Across all categories"
          />
        </div>

        {/* ── Row 2: Donut + Volume ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Donut Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
              <Activity size={16} className="text-gray-400" />
              Open vs Closed Ratio
            </h2>
            <DonutChart {...ratio} />
          </div>

          {/* Volume Over Time */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16} className="text-gray-400" />
                Issue Volume Over Time
              </h2>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {["7d", "30d", "90d"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setVolumePeriod(p)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      volumePeriod === p
                        ? "bg-white text-gray-800 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <BarChartSVG data={volumeData} />
          </div>
        </div>

        {/* ── Row 3: Category Density + Avg Resolution ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Category Density */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
              <BarChart3 size={16} className="text-gray-400" />
              Issue Density by Category
            </h2>
            <HorizontalBars data={density} />
          </div>

          {/* Avg Resolution by Category */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              Avg Resolution Time by Category
            </h2>
            {avgResolution.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No resolved issues yet</p>
            ) : (
              <div className="space-y-3">
                {avgResolution.map((d, i) => (
                  <div key={d.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">{d.category}</span>
                      <span className="text-xs font-semibold text-gray-600">{d.avgDays}d</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, (d.avgDays / Math.max(...avgResolution.map((r) => r.avgDays), 1)) * 100)}%`,
                          backgroundColor: d.avgDays > 5 ? COLORS.red : d.avgDays > 2 ? COLORS.amber : COLORS.green,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Row 4: Caretaker Performance ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-gray-400" />
              Caretaker Performance
            </h2>
          </div>
          {performance.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No caretaker assignments yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Caretaker</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Assigned</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Resolved</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Pending</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Avg Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {performance.map((ct) => {
                    const isAboveAvg = globalAvgDays !== null && ct.avgDays !== null && ct.avgDays > globalAvgDays;
                    return (
                      <tr
                        key={ct.id}
                        className={`transition-colors ${isAboveAvg ? "bg-amber-50" : "hover:bg-gray-50/50"}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-sm">
                              {ct.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-800">{ct.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">{ct.assigned}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-semibold text-green-600">{ct.resolved}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            ct.pending > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                          }`}>
                            {ct.pending}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-medium ${
                            isAboveAvg ? "text-amber-700 font-semibold" : "text-gray-600"
                          }`}>
                            {ct.avgDays !== null ? `${ct.avgDays}d` : "—"}
                          </span>
                          {isAboveAvg && (
                            <span className="ml-1.5 text-[10px] text-amber-600 font-medium">▲ above avg</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Row 5: Escalation Summary ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Zap size={16} className="text-red-400" />
            Escalation Summary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <p className="text-xs font-semibold text-red-500 uppercase mb-1">Total Escalated</p>
              <p className="text-2xl font-bold text-red-700">{escalationStats.totalEscalated}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <p className="text-xs font-semibold text-orange-500 uppercase mb-1">Critical Priority</p>
              <p className="text-2xl font-bold text-orange-700">{escalationStats.criticalCount}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs font-semibold text-blue-500 uppercase mb-1">Resolution Rate</p>
              <p className="text-2xl font-bold text-blue-700">{ratio.closedPercent}%</p>
            </div>
          </div>

          {/* Recent Escalations */}
          {escalationStats.recentEscalations.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">5 Most Recent Escalations</h3>
              <div className="space-y-2">
                {escalationStats.recentEscalations.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ShieldAlert size={16} className="text-red-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{issue.title}</p>
                        <p className="text-[11px] text-gray-400">
                          {issue.escalation_reason || "Auto-escalated"} ·{" "}
                          {issue.escalated_at ? new Date(issue.escalated_at).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize flex-shrink-0 ${
                      (issue.priority || "").toLowerCase() === "critical"
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-orange-100 text-orange-700 border border-orange-200"
                    }`}>
                      {issue.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
