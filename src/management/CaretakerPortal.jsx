import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Users, Phone, Mail, Calendar, Shield, ShieldOff,
  Trash2, RefreshCw, CheckCircle, AlertTriangle, Eye, EyeOff, Copy
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { AlertModal } from "../UI/Glow";
import { useAlert } from "../hooks/useAlert";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import {
  createCaretakerDoc,
  fetchCaretakersByHostel,
  toggleCaretakerDisabled,
  deleteCaretakerDoc,
} from "../services/caretaker.service";

const CaretakerPortal = () => {
  const { profile } = useAuth();
  const { alertState, closeAlert, error: showError, success: showSuccess } = useAlert();

  // ── Create Caretaker Form ──
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [formErrors, setFormErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null); // { email, password }
  const [showPwd, setShowPwd] = useState(false);

  // ── Caretaker List ──
  const [caretakers, setCaretakers] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Delete Confirmation ──
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const hostelId = profile?.hostelId;
  const hostelName = profile?.hostelName || "";
  const adminUid = profile?.id;

  // ── Load caretakers ──
  const loadCaretakers = useCallback(async () => {
    if (!hostelId) return;
    try {
      const data = await fetchCaretakersByHostel(hostelId);
      setCaretakers(data);
    } catch (err) {
      console.error("Failed to load caretakers:", err);
    } finally {
      setListLoading(false);
      setRefreshing(false);
    }
  }, [hostelId]);

  useEffect(() => { loadCaretakers(); }, [loadCaretakers]);

  const handleRefresh = () => { setRefreshing(true); loadCaretakers(); };

  // ── Form handlers ──
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleCreateCaretaker = async (e) => {
    e.preventDefault();
    setCreating(true);
    setFormErrors({});
    setCreatedCreds(null);

    const errs = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.email.trim()) errs.email = "Required";
    if (!form.password || form.password.length < 6) errs.password = "Min 6 chars";
    if (Object.keys(errs).length) { setFormErrors(errs); setCreating(false); return; }

    try {
      // 1. Create Firebase Auth account for caretaker
      //    NOTE: This will sign in as the new user on the client.
      //    We save the current user's token first for re-auth if needed.
      const result = await createUserWithEmailAndPassword(auth, form.email, form.password);

      // 2. Write caretaker doc to management collection
      await createCaretakerDoc(result.user.uid, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        hostelId,
        hostelName,
        createdBy: adminUid,
      });

      // 3. Show credentials
      setCreatedCreds({ email: form.email, password: form.password });
      setForm({ name: "", email: "", password: "", phone: "" });
      showSuccess("Caretaker account created successfully!");

      // Refresh list
      loadCaretakers();

      // NOTE: createUserWithEmailAndPassword switches the auth state to the new user.
      // The admin will be logged out. We need to inform them.
      // In a production app you'd use Firebase Admin SDK server-side.
      // Since we're client-only, the admin will need to re-login.

    } catch (error) {
      let msg = "Failed to create caretaker.";
      if (error.code === "auth/email-already-in-use") msg = "Email already in use.";
      else if (error.code === "auth/invalid-email") msg = "Invalid email address.";
      else if (error.code === "auth/weak-password") msg = "Password too weak.";
      showError(msg);
    } finally {
      setCreating(false);
    }
  };

  // ── Toggle disable ──
  const handleToggleDisable = async (ct) => {
    const newDisabled = !ct.disabled;
    try {
      await toggleCaretakerDisabled(ct.id, newDisabled);
      setCaretakers((prev) =>
        prev.map((c) => (c.id === ct.id ? { ...c, disabled: newDisabled, isActive: !newDisabled, active: !newDisabled } : c))
      );
      showSuccess(newDisabled ? "Caretaker disabled." : "Caretaker enabled.");
    } catch { showError("Failed to update status."); }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCaretakerDoc(deleteTarget.id);
      setCaretakers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      showSuccess("Caretaker removed.");
      setDeleteTarget(null);
    } catch { showError("Failed to delete."); } finally { setDeleting(false); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess("Copied to clipboard!");
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-['Poppins',sans-serif]">
      <AlertModal {...alertState} onClose={closeAlert} />
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-lg">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Caretaker Management</h1>
              <p className="text-gray-500 text-sm">Create and manage caretaker accounts for your hostel</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ═══ SECTION A — Create Caretaker ═══ */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-violet-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><UserPlus size={20} className="text-purple-600" /></div>
                  <div><h2 className="text-lg font-bold text-gray-800">New Caretaker</h2><p className="text-xs text-gray-500">Create account credentials</p></div>
                </div>
              </div>

              <form onSubmit={handleCreateCaretaker} className="p-6 flex flex-col gap-4">
                {[
                  { name: "name", label: "Full Name", placeholder: "John Doe", type: "text", icon: Users },
                  { name: "email", label: "Email", placeholder: "caretaker@hostel.com", type: "email", icon: Mail },
                  { name: "phone", label: "Phone", placeholder: "+91 XXXXX XXXXX", type: "tel", icon: Phone },
                ].map(({ name, label, placeholder, type, icon: Icon }) => (
                  <div key={name}>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5"><Icon size={13} />{label}</label>
                    <input name={name} type={type} placeholder={placeholder} value={form[name]} onChange={handleFormChange}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-purple-200 focus:border-purple-400 ${formErrors[name] ? 'border-red-300 bg-red-50/50' : 'border-gray-200'}`} />
                    {formErrors[name] && <p className="text-xs text-red-500 mt-1">{formErrors[name]}</p>}
                  </div>
                ))}

                {/* Password with toggle */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5"><Shield size={13} />Password</label>
                  <div className="relative">
                    <input name="password" type={showPwd ? "text" : "password"} placeholder="Min 6 characters" value={form.password} onChange={handleFormChange}
                      className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-purple-200 focus:border-purple-400 ${formErrors.password ? 'border-red-300 bg-red-50/50' : 'border-gray-200'}`} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
                </div>

                <button type="submit" disabled={creating}
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
                  {creating ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>) : (<><UserPlus size={16} />Create Account</>)}
                </button>
              </form>

              {/* Created Credentials Display */}
              <AnimatePresence>
                {createdCreds && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden">
                    <div className="mx-6 mb-6 p-4 rounded-xl bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 mb-3"><CheckCircle size={16} className="text-green-600" /><span className="text-sm font-bold text-green-800">Account Created!</span></div>
                      <p className="text-xs text-green-700 mb-2">Share these credentials with the caretaker:</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-100">
                          <div><span className="text-[10px] text-gray-400 uppercase block">Email</span><span className="text-sm font-medium text-gray-800">{createdCreds.email}</span></div>
                          <button onClick={() => copyToClipboard(createdCreds.email)} className="p-1.5 hover:bg-green-100 rounded-lg transition-colors bg-transparent border-none cursor-pointer"><Copy size={14} className="text-green-600" /></button>
                        </div>
                        <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-100">
                          <div><span className="text-[10px] text-gray-400 uppercase block">Password</span><span className="text-sm font-medium text-gray-800">{createdCreds.password}</span></div>
                          <button onClick={() => copyToClipboard(createdCreds.password)} className="p-1.5 hover:bg-green-100 rounded-lg transition-colors bg-transparent border-none cursor-pointer"><Copy size={14} className="text-green-600" /></button>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-100">
                        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                        <span><strong>Important:</strong> Creating a caretaker account will sign you out. Please log back in with your admin credentials. Also note the password above — it won't be shown again.</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* ═══ SECTION B — Caretaker List ═══ */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Users size={20} className="text-blue-600" /></div>
                  <div><h2 className="text-lg font-bold text-gray-800">Caretaker List</h2><p className="text-xs text-gray-500">{caretakers.length} caretaker{caretakers.length !== 1 ? "s" : ""}</p></div>
                </div>
                <button onClick={handleRefresh} disabled={refreshing} className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors bg-white cursor-pointer">
                  <RefreshCw size={16} className={refreshing ? "animate-spin text-blue-500" : "text-gray-500"} />
                </button>
              </div>

              {listLoading ? (
                <div className="p-20 text-center"><div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-gray-500 text-sm">Loading caretakers...</p></div>
              ) : caretakers.length === 0 ? (
                <div className="p-16 text-center"><div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4"><Users className="text-gray-300" size={32} /></div><h3 className="text-gray-800 font-semibold">No caretakers yet</h3><p className="text-gray-400 text-sm mt-1">Create one using the form</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {caretakers.map((ct) => (
                        <tr key={ct.id} className={`transition-colors ${ct.disabled ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50/30'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${ct.disabled ? 'bg-gray-200 text-gray-500' : 'bg-purple-100 text-purple-700'}`}>
                                {(ct.name || ct.full_name || "?").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className={`text-sm font-semibold ${ct.disabled ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{ct.name || ct.full_name}</span>
                                {ct.disabled && <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">DISABLED</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{ct.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{ct.phone || "—"}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{formatDate(ct.createdAt)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleToggleDisable(ct)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${ct.disabled ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'}`}>
                                {ct.disabled ? <><Shield size={13} />Enable</> : <><ShieldOff size={13} />Disable</>}
                              </button>
                              <button onClick={() => setDeleteTarget(ct)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer">
                                <Trash2 size={13} />Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ═══ Delete Confirmation Modal ═══ */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteTarget(null)}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-600" /></div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Caretaker</h3>
                <p className="text-sm text-gray-500 mb-1">Are you sure you want to remove</p>
                <p className="text-sm font-semibold text-gray-800 mb-4">{deleteTarget.name || deleteTarget.full_name}?</p>
                <p className="text-xs text-gray-400 mb-6">This will remove their management record. Their Firebase Auth account will remain but they won't be able to access the system.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  {deleting ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</>) : (<><Trash2 size={14} />Delete</>)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CaretakerPortal;
