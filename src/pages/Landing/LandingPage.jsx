import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search, Star, StarHalf, Shield, Users, BarChart3,
  ChevronRight, Building2, MapPin, CheckCircle2, Clock,
  ArrowRight, Menu, X,
} from "lucide-react";
import { fetchPublicHostels } from "../../services/publicHostel.service";

// ── Utility: stable Unsplash image per hostelId ────────────────────────────
const UNSPLASH_SEEDS = [
  "hostel1", "hostel2", "hostel3", "hostel4", "hostel5",
  "hostel6", "hostel7", "hostel8", "hostel9", "hostel10",
];
function hostelImage(hostelId) {
  const seed = hostelId ? hostelId.slice(0, 8) : "dorm";
  return `https://source.unsplash.com/400x240/?dormitory,hostel,building&sig=${seed}`;
}

// ── Star Rating ────────────────────────────────────────────────────────────
function StarRating({ score }) {
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array(full).fill(0).map((_, i) => (
        <Star key={`f${i}`} size={16} className="fill-[#00B8D4] text-[#00B8D4]" />
      ))}
      {half && <StarHalf size={16} className="fill-[#00B8D4] text-[#00B8D4]" />}
      {Array(empty).fill(0).map((_, i) => (
        <Star key={`e${i}`} size={16} className="text-slate-200" />
      ))}
    </div>
  );
}

// ── Health label badge color ───────────────────────────────────────────────
const LABEL_COLORS = {
  "Excellent":      "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Good":           "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Average":        "bg-amber-50 text-amber-700 border-amber-200",
  "Needs Attention":"bg-orange-50 text-orange-700 border-orange-200",
  "Poor":           "bg-red-50 text-red-700 border-red-200",
  "No Data":        "bg-slate-100 text-slate-600 border-slate-200",
};

const TYPE_COLORS = {
  Boys:   "bg-blue-50 text-blue-700 border-blue-200",
  Girls:  "bg-pink-50 text-pink-700 border-pink-200",
  "Co-ed":"bg-purple-50 text-purple-700 border-purple-200",
};

// ── Hostel Card ─────────────────────────────────────────────────────────────
function HostelCard({ hostel }) {
  const navigate = useNavigate();
  const pp = hostel.publicProfile || {};
  const hs = hostel.healthScore || {};
  const label = hs.label || "No Data";
  const score = hs.score || 0;
  const hostelType = pp.hostelType || hostel.hostelType || "Co-ed";

  return (
    <div
      onClick={() => navigate(`/hostel/${hostel.id}`)}
      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white hover:border-[#00E5FF]/40 hover:shadow-[0_8px_30px_rgb(0,229,255,0.12)] transition-all duration-300 overflow-hidden flex flex-col"
    >
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img
          src={hostelImage(hostel.id)}
          alt={hostel.hostelName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = `https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=240&fit=crop`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
        <span className={`absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-md ${TYPE_COLORS[hostelType] || TYPE_COLORS["Co-ed"]}`}>
          {hostelType}
        </span>
      </div>
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div>
          <h3 className="text-slate-900 font-bold text-lg leading-snug group-hover:text-[#00B8D4] transition-colors">
            {hostel.hostelName}
          </h3>
          {(pp.city || pp.area || hostel.blockName) && (
            <div className="flex items-center gap-1.5 mt-1.5 text-slate-500 text-sm">
              <MapPin size={14} />
              <span>{[pp.area, pp.city].filter(Boolean).join(", ") || hostel.blockName}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
          <div className="flex flex-col gap-1.5">
            <StarRating score={score} />
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border w-fit ${LABEL_COLORS[label]}`}>
              {label}
            </span>
          </div>
          <div className="text-right flex flex-col items-end">
             <div className="flex items-baseline gap-1">
                 <span className="text-slate-900 font-extrabold text-2xl leading-none">{hs.totalResolved ?? 0}</span>
             </div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-1">Issues Fixed</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Landing Page ───────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const directoryRef = useRef(null);
  const heroRef = useRef(null);
  const [navSearch, setNavSearch] = useState("");
  const [dirSearch, setDirSearch] = useState("");
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToDirectory = () => {
    directoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNavSearch = (e) => {
    e.preventDefault();
    if (navSearch.trim()) setDirSearch(navSearch.trim());
    scrollToDirectory();
  };

  const loadHostels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPublicHostels();
      setHostels(data);
      setFetched(true);
    } catch {
      setHostels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtered hostels
  const filtered = hostels.filter((h) => {
    if (!dirSearch.trim()) return true;
    const q = dirSearch.toLowerCase();
    const pp = h.publicProfile || {};
    return (
      (h.hostelName || "").toLowerCase().includes(q) ||
      (pp.city || "").toLowerCase().includes(q) ||
      (pp.area || "").toLowerCase().includes(q) ||
      (h.blockName || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-[Inter,system-ui,sans-serif]">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#00B8D4] flex items-center justify-center shadow-sm">
              <Building2 size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-slate-900 font-extrabold text-xl tracking-tight">DormDesk</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8 ml-8">
            {[["Features","#features"],["How It Works","#how-it-works"],["Find a Hostel","#directory"]].map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={(e) => { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior: "smooth" }); }}
                className="text-slate-600 hover:text-[#00B8D4] text-sm font-semibold transition-colors"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Navbar search */}
          <form onSubmit={handleNavSearch} className="hidden md:flex flex-1 max-w-xs ml-auto items-center gap-2 bg-slate-100/80 border border-transparent rounded-xl px-4 py-2 group focus-within:border-[#00E5FF]/40 focus-within:bg-white transition-all shadow-sm">
            <Search size={16} className="text-slate-400 group-focus-within:text-[#00B8D4] transition-colors shrink-0" />
            <input
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search hostel or city..."
              className="bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none flex-1 min-w-0 font-medium"
            />
          </form>

          <Link
            to="/login"
            className="ml-4 hidden md:inline-flex items-center gap-1.5 bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shrink-0 shadow-sm"
          >
            Sign In
          </Link>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden ml-auto text-slate-600 hover:text-slate-900">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-5 flex flex-col gap-5 shadow-lg absolute w-full">
            {[["Features","#features"],["How It Works","#how-it-works"],["Find a Hostel","#directory"]].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMobileOpen(false)} className="text-slate-700 font-medium text-base">{label}</a>
            ))}
            <form onSubmit={handleNavSearch} className="flex items-center gap-3 bg-slate-100 rounded-xl px-4 py-3">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input value={navSearch} onChange={(e) => setNavSearch(e.target.value)} placeholder="Search hostel..." className="bg-transparent text-base text-slate-900 placeholder-slate-500 outline-none flex-1" />
            </form>
            <Link to="/login" onClick={() => setMobileOpen(false)} className="text-center bg-slate-900 text-white font-semibold py-3 rounded-xl text-base">
              Sign In
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[85vh] flex items-center bg-white">
        {/* Subtle grid background */}
        <div className="absolute inset-0 z-0 opacity-[0.4]" style={{
          backgroundImage: "radial-gradient(circle, #e2e8f0 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} />
        {/* Abstract shapes */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-cyan-50/80 blur-[80px] pointer-events-none z-0" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-50/80 blur-[80px] pointer-events-none z-0" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center text-center gap-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
            <Shield size={14} className="text-cyan-600" />
            The New Standard for Hostels
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Your hostel, <br className="hidden sm:block" />
            <span className="relative inline-block mt-2">
               <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#00B8D4] to-blue-600">
                  held accountable.
               </span>
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-slate-600 text-lg sm:text-xl max-w-2xl leading-relaxed font-medium">
            Report issues, track resolutions in real-time, and discover hostels that actually care about their residents.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <button
              onClick={() => { scrollToDirectory(); if (!fetched) loadHostels(); }}
              className="inline-flex justify-center items-center gap-2 bg-slate-900 text-white font-semibold px-8 py-4 rounded-xl hover:bg-slate-800 transition-all text-base shadow-lg hover:shadow-xl w-full sm:w-auto"
            >
              Explore Hostels <ArrowRight size={18} />
            </button>
            <Link
              to="/login"
              className="inline-flex justify-center items-center gap-2 bg-white border-2 border-slate-200 text-slate-700 font-semibold px-8 py-4 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all text-base w-full sm:w-auto"
            >
              Resident Login <ChevronRight size={18} />
            </Link>
          </div>

          {/* Stat strip */}
          <div className="mt-12 flex flex-wrap justify-center gap-x-12 gap-y-6 text-sm border-t border-slate-100 pt-8 w-full max-w-3xl">
            {[["Verified Data", "Real resolution metrics"],
              ["Transparent","Issues stay on record"],
              ["Health Scores","Data-driven ratings"]].map(([title, sub]) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={20} className="text-[#00B8D4]" />
                </div>
                <div className="text-left">
                  <p className="text-slate-900 font-bold">{title}</p>
                  <p className="text-slate-500 text-xs font-medium">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIFFERENTIATORS ────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Beyond ordinary management</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto font-medium">We built DormDesk to solve real problems for students, creating a system where accountability is built-in.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield size={28} className="text-[#00B8D4]" />,
                title: "Radical Transparency",
                body: "Every reported issue is tracked from creation to resolution. Timestamps ensure nothing is swept under the rug.",
              },
              {
                icon: <Users size={28} className="text-[#00B8D4]" />,
                title: "Student-First Design",
                body: "Empowering residents to report easily, track progress instantly, and hold administration accountable for living conditions.",
              },
              {
                icon: <BarChart3 size={28} className="text-[#00B8D4]" />,
                title: "Data-Driven Health Scores",
                body: "Hostels earn their reputation. Public scores are generated from actual resolution times, not subjective reviews.",
              },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {icon}
                </div>
                <h3 className="text-slate-900 font-bold text-xl mb-3">{title}</h3>
                <p className="text-slate-600 text-base leading-relaxed font-medium">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">How the platform works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connector line on desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            {[
              {
                step: "1",
                icon: <Search size={24} className="text-slate-700" />,
                title: "Report an Issue",
                body: "Students log an issue with category and photos. It takes seconds.",
              },
              {
                step: "2",
                icon: <Clock size={24} className="text-slate-700" />,
                title: "Active Resolution",
                body: "Caretakers are assigned immediately. Progress is visible to everyone.",
              },
              {
                step: "3",
                icon: <BarChart3 size={24} className="text-slate-700" />,
                title: "Score Updates",
                body: "The hostel's public performance score adjusts based on resolution speed.",
              },
            ].map(({ step, icon, title, body }) => (
              <div key={step} className="flex flex-col items-center text-center relative z-10">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-slate-50 shadow-lg flex items-center justify-center mb-6 relative">
                  {icon}
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#00B8D4] text-white font-bold flex items-center justify-center border-4 border-white shadow-sm">
                    {step}
                  </div>
                </div>
                <h3 className="text-slate-900 font-bold text-xl mb-2">{title}</h3>
                <p className="text-slate-600 font-medium">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOSTEL DIRECTORY ───────────────────────────────── */}
      <section id="directory" ref={directoryRef} className="py-24 px-4 sm:px-6 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Find a Better Hostel</h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto font-medium">
              Browse hostels with verified Health Scores. Data you can trust.
            </p>
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mb-16">
            <div className="flex flex-1 items-center gap-3 bg-white border border-slate-300 rounded-2xl px-5 py-4 focus-within:border-[#00B8D4] focus-within:ring-4 focus-within:ring-[#00B8D4]/10 transition-all shadow-sm">
              <Search size={20} className="text-slate-400 shrink-0" />
              <input
                value={dirSearch}
                onChange={(e) => setDirSearch(e.target.value)}
                placeholder="Search by hostel name, city, or area..."
                className="bg-transparent text-base text-slate-900 placeholder-slate-400 outline-none flex-1 font-medium"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (!fetched) loadHostels();
                  }
                }}
              />
            </div>
            <button
              onClick={() => { if (!fetched) loadHostels(); }}
              disabled={loading}
              className="bg-slate-900 text-white font-bold px-8 py-4 rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-70 text-base whitespace-nowrap shadow-md hover:shadow-lg"
            >
              {loading ? "Searching..." : "Search Directory"}
            </button>
          </div>

          {/* States */}
          {!fetched && !loading && (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg font-medium">Enter a location or click search to browse all public hostels.</p>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-24">
              <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#00B8D4] animate-spin" />
            </div>
          )}

          {fetched && !loading && filtered.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                <Search size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg font-medium">No hostels found matching "{dirSearch}".</p>
            </div>
          )}

          {fetched && !loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((hostel) => (
                <HostelCard key={hostel.id} hostel={hostel} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#00B8D4] flex items-center justify-center">
              <Building2 size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-slate-900 font-bold text-base">DormDesk</p>
              <p className="text-slate-500 text-sm font-medium">Accountability, made transparent.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <Link to="/login" className="hover:text-slate-900 transition-colors">Resident Login</Link>
          </div>
          <p className="text-slate-400 text-sm font-medium">© {new Date().getFullYear()} DormDesk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
