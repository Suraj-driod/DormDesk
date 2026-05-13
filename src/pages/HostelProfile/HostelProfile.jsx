import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Building2, MapPin, Star, StarHalf,
  CheckCircle2, BarChart3, Shield,
} from "lucide-react";
import { fetchPublicHostelById } from "../../services/publicHostel.service";

const LABEL_COLORS = {
  "Excellent":      "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Good":           "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Average":        "bg-amber-50 text-amber-700 border-amber-200",
  "Needs Attention":"bg-orange-50 text-orange-700 border-orange-200",
  "Poor":           "bg-red-50 text-red-700 border-red-200",
  "No Data":        "bg-slate-100 text-slate-600 border-slate-200",
};

function StarRating({ score, size = 16 }) {
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-1">
      {Array(full).fill(0).map((_, i) => <Star key={`f${i}`} size={size} className="fill-[#00B8D4] text-[#00B8D4]" />)}
      {half && <StarHalf size={size} className="fill-[#00B8D4] text-[#00B8D4]" />}
      {Array(empty).fill(0).map((_, i) => <Star key={`e${i}`} size={size} className="text-slate-200" />)}
    </div>
  );
}

export default function HostelProfile() {
  const { hostelId } = useParams();
  const navigate = useNavigate();
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPublicHostelById(hostelId)
      .then(setHostel)
      .catch(() => setError("Hostel not found or not publicly listed."))
      .finally(() => setLoading(false));
  }, [hostelId]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#00B8D4] animate-spin" />
    </div>
  );

  if (error || !hostel) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-900">
      <Shield size={48} className="text-slate-300" />
      <p className="text-slate-600 font-medium text-lg">{error || "Hostel not found."}</p>
      <Link to="/" className="text-[#00B8D4] font-semibold hover:underline">← Back to directory</Link>
    </div>
  );

  const pp = hostel.publicProfile || {};
  const hs = hostel.healthScore || {};
  const label = hs.label || "No Data";
  const score = hs.score || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-[Inter,system-ui,sans-serif]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors">
            <ArrowLeft size={18} /> Back to Directory
          </button>
          <div className="flex items-center gap-2.5 ml-auto">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#00B8D4] flex items-center justify-center shadow-sm">
              <Building2 size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-slate-900 font-extrabold text-base tracking-tight">DormDesk</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">{hostel.hostelName}</h1>
              {(pp.city || pp.area || hostel.blockName) && (
                <div className="flex items-center gap-2 mt-3 text-slate-500 font-medium">
                  <MapPin size={16} />
                  <span>{[pp.area, pp.city].filter(Boolean).join(", ") || hostel.blockName}</span>
                </div>
              )}
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-slate-800 transition-all text-base shadow-md w-full sm:w-auto"
            >
              Login to Report Issue
            </Link>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {[
            { label: "Health Score", value: `${score.toFixed(1)} / 5`, icon: <BarChart3 size={20} className="text-[#00B8D4]" /> },
            { label: "Status", value: label, icon: <Shield size={20} className="text-[#00B8D4]" /> },
            { label: "Issues Resolved", value: hs.totalResolved ?? 0, icon: <CheckCircle2 size={20} className="text-[#00B8D4]" /> },
            { label: "Hostel Type", value: pp.hostelType || hostel.hostelType || "—", icon: <Building2 size={20} className="text-[#00B8D4]" /> },
          ].map(({ label: l, value, icon }) => (
            <div key={l} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2.5 text-slate-500 font-semibold text-sm mb-3">{icon}{l}</div>
              <p className="text-slate-900 font-extrabold text-2xl">{value}</p>
            </div>
          ))}
        </div>

        {/* Health score visual */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm mb-12">
          <h2 className="text-slate-900 font-bold text-xl mb-6">Verified Health Score</h2>
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex flex-col items-center gap-3 shrink-0">
              <span className="text-6xl font-black text-slate-900 tracking-tighter">{score.toFixed(1)}</span>
              <StarRating score={score} size={24} />
              <span className={`text-sm font-bold px-3 py-1.5 rounded-full border ${LABEL_COLORS[label]}`}>{label}</span>
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <span className="text-slate-600 font-semibold w-28 shrink-0">Overall Score</span>
                <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden w-full">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] transition-all" style={{ width: `${(score / 5) * 100}%` }} />
                </div>
                <span className="text-[#00B8D4] font-extrabold text-lg">{((score / 5) * 100).toFixed(0)}%</span>
              </div>
              <p className="text-slate-500 text-base leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
                This score is computed from real issue resolution data — including resolution rate and average time to close. It reflects actual management performance, not subjective user reviews.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-3xl border-2 border-cyan-100 bg-cyan-50/50 p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div>
            <h3 className="text-slate-900 font-bold text-xl mb-2">Are you a resident here?</h3>
            <p className="text-slate-600 font-medium text-lg">Login to report issues, track their real-time status, and hold your hostel accountable.</p>
          </div>
          <Link to="/login" className="inline-flex justify-center items-center gap-2 bg-slate-900 text-white font-bold px-8 py-4 rounded-xl hover:bg-slate-800 transition-all text-base shadow-lg w-full md:w-auto shrink-0">
            Sign In to DormDesk
          </Link>
        </div>
      </div>
    </div>
  );
}
