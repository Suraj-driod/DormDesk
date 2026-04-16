import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Sparkles, ChevronDown, Shield, GraduationCap,
  KeyRound, Building2, Layers, Hash, CheckCircle2
} from "lucide-react";
import { TextInput, ImageUpload } from '../../components/core';
import { Button, Toast, Modal } from '../../UI/Glow.jsx';
import { SelectBetter } from '../../UI/SelectBetter.jsx';
import { useAuth } from "../../auth/AuthContext";
import { scanIdCard } from '../../services/geminiOCR';
import { validateActivationKey, markKeyAsUsed } from '../../services/activationKeys.service';
import { setupHostel, fetchAllHostels, generateFlats } from '../../services/hostel.service';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from '../../firebase';

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                        STUDENT REGISTRATION                              ║
// ╚════════════════════════════════════════════════════════════════════════════╝

const StudentRegistration = ({ onSwitchToAdmin }) => {
  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && user) navigate('/', { replace: true }); }, [user, loading, navigate]);

  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', password: '',
    hostelId: '', floor: '', flatNumber: ''
  });
  const [idCardImage, setIdCardImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ─── Hostel data from Firestore ───
  const [hostels, setHostels] = useState([]);
  const [hostelsLoading, setHostelsLoading] = useState(true);

  useEffect(() => {
    fetchAllHostels()
      .then(setHostels)
      .catch((e) => console.error("Failed to load hostels:", e))
      .finally(() => setHostelsLoading(false));
  }, []);

  // ─── Derived dropdown options ───
  const hostelOptions = useMemo(() =>
    hostels.map(h => ({
      value: h.id,
      label: `${h.hostelName} – ${h.blockName}`
    })),
    [hostels]
  );

  const selectedHostel = useMemo(
    () => hostels.find(h => h.id === formData.hostelId),
    [hostels, formData.hostelId]
  );

  const floorOptions = useMemo(() => {
    if (!selectedHostel) return [];
    return Array.from({ length: selectedHostel.numberOfFloors }, (_, i) => ({
      value: String(i + 1),
      label: `Floor ${i + 1}`
    }));
  }, [selectedHostel]);

  const flatOptions = useMemo(() => {
    if (!selectedHostel || !formData.floor) return [];
    const floorNum = Number(formData.floor);
    return (selectedHostel.generatedFlats || [])
      .filter(f => f.floor === floorNum)
      .map(f => ({ value: f.flat, label: `Flat ${f.flat}` }));
  }, [selectedHostel, formData.floor]);

  useEffect(() => { if (toastMessage) { const t = setTimeout(() => setToastMessage(null), 3000); return () => clearTimeout(t); } }, [toastMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => {
      const next = { ...p, [name]: value };
      // Reset dependent dropdowns
      if (name === 'hostelId') { next.floor = ''; next.flatNumber = ''; }
      if (name === 'floor') { next.flatNumber = ''; }
      return next;
    });
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handleImageUpload = async (file, preview) => {
    setIdCardImage({ file, preview });
    if (file) {
      setFormVisible(true); setIsScanning(true); setToastMessage("Scanning ID card...");
      try {
        const scannedData = await scanIdCard(file);
        if (scannedData) {
          setFormData(p => ({ ...p, fullName: scannedData.fullName || p.fullName, email: scannedData.email || p.email }));
          setToastMessage("Details extracted!");
        } else setToastMessage("Could not extract details. Fill manually.");
      } catch { setToastMessage("Scan failed. Fill manually."); } finally { setIsScanning(false); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setErrors({});
    const ne = {};
    if (!formData.fullName.trim()) ne.fullName = 'Full name is required';
    if (!formData.email.trim()) ne.email = 'Email is required';
    if (!formData.phone.trim()) ne.phone = 'Phone number is required';
    if (!formData.hostelId) ne.hostelId = 'Please select a hostel';
    if (!formData.floor) ne.floor = 'Please select a floor';
    if (!formData.flatNumber) ne.flatNumber = 'Please select a flat';
    if (!formData.password) ne.password = 'Password is required';
    if (!idCardImage) ne.idCard = 'ID Card image is required';
    if (Object.keys(ne).length > 0) { setErrors(ne); setIsSubmitting(false); setToastMessage("Please fix the errors."); return; }

    try {
      const hostel = selectedHostel;
      const { error } = await signUp(formData.email, formData.password, {
        fullName: formData.fullName,
        phone: formData.phone,
        hostelId: formData.hostelId,
        hostelName: hostel?.hostelName || '',
        blockName: hostel?.blockName || '',
        floor: formData.floor,
        flatNumber: formData.flatNumber,
      });
      if (error) throw error;
      setShowSuccessModal(true);
    } catch (error) { setToastMessage(error.message || "Registration failed."); } finally { setIsSubmitting(false); }
  };

  return (
    <>
      <AnimatePresence>{toastMessage && (<motion.div initial={{ opacity: 0, y: -50, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -50, x: "-50%" }} className="fixed top-6 left-1/2 z-[100]"><Toast text={toastMessage} /></motion.div>)}</AnimatePresence>
      <Modal open={showSuccessModal} onClose={() => { setShowSuccessModal(false); navigate('/login'); }}>
        <div className="text-center py-2"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Sparkles className="text-green-600" size={32} /></div><h2 className="text-xl font-bold text-[#064E3B] mb-2">Welcome to DormDesk!</h2><p className="text-[#064E3B]/80 text-sm">Your account has been created successfully.</p></div>
      </Modal>
      <motion.div layout initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6 }} className="w-full max-w-[650px] bg-white/70 backdrop-blur-md rounded-[28px] p-8 shadow-[0_0_40px_rgba(0,229,255,0.25)] border border-[#E6FBFF] my-10">
        <motion.div layout className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00E5FF] to-[#00B8D4] shadow-[0_0_20px_rgba(0,229,255,0.4)] mb-4 text-white"><GraduationCap size={32} strokeWidth={2.5} /></div>
          <h1 className="text-[24px] font-semibold text-[#0f172a]">Student Registration</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Join DormDesk to manage your hostel experience</p>
        </motion.div>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <motion.section layout className={`relative bg-white/40 rounded-2xl p-4 border transition-colors ${errors.idCard ? 'border-red-300 bg-red-50/30' : 'border-[#E6FBFF]'} ${isScanning ? 'ring-2 ring-[#00B8D4] ring-opacity-50' : ''}`}>
            <ImageUpload label="Upload Hostel ID Card" helperText="Full Name and Email will be auto-filled using AI" onChange={handleImageUpload} required />
            {errors.idCard && <p className="text-xs text-red-500 mt-2 ml-2">{errors.idCard}</p>}
            {isScanning && (<div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10"><div className="flex items-center gap-2 text-[#00B8D4] font-semibold animate-pulse"><Sparkles size={20} /><span>AI is scanning ID...</span></div></div>)}
          </motion.section>
          <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="flex items-center gap-4 text-[#94A3B8] text-xs uppercase tracking-wider font-semibold cursor-pointer group" onClick={() => setFormVisible(true)}>
            <div className="flex-1 h-px bg-[#E2E8F0] group-hover:bg-[#00B8D4] transition-colors" /><span className="group-hover:text-[#00B8D4] transition-colors flex items-center gap-1">OR FILL MANUALLY {!formVisible && <ChevronDown size={14} />}</span><div className="flex-1 h-px bg-[#E2E8F0] group-hover:bg-[#00B8D4] transition-colors" />
          </motion.div>
          <AnimatePresence>
            {formVisible && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5 }} className="overflow-hidden flex flex-col gap-6">
                {/* Personal Information */}
                <section>
                  <h2 className="text-sm font-bold text-[#00B8D4] uppercase tracking-wide mb-4 pl-1">Personal Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextInput label="Full Name" name="fullName" placeholder="Enter your full name" value={formData.fullName} onChange={handleChange} error={errors.fullName} required />
                    <TextInput label="Phone Number" name="phone" type="tel" placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={handleChange} error={errors.phone} required />
                    <TextInput label="Email Address" name="email" type="email" placeholder="your.email@example.com" value={formData.email} onChange={handleChange} error={errors.email} required autoComplete="email" />
                  </div>
                </section>

                {/* Hostel Enrollment — Dependent Dropdowns */}
                <section>
                  <h2 className="text-sm font-bold text-[#00B8D4] uppercase tracking-wide mb-4 pl-1">Hostel Enrollment</h2>
                  {hostelsLoading ? (
                    <div className="flex items-center gap-2 text-[#94A3B8] text-sm py-4 justify-center">
                      <span className="w-4 h-4 border-2 border-[#00B8D4]/30 border-t-[#00B8D4] rounded-full animate-spin" />
                      Loading hostels...
                    </div>
                  ) : hostels.length === 0 ? (
                    <p className="text-sm text-[#94A3B8] text-center py-4">No hostels available. Contact your admin.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 1. Hostel */}
                      <div className="sm:col-span-2">
                        <SelectBetter
                          label="Hostel"
                          name="hostelId"
                          placeholder="Select Hostel"
                          options={hostelOptions}
                          value={formData.hostelId}
                          onChange={handleChange}
                          error={errors.hostelId}
                          required
                        />
                      </div>

                      {/* 2. Floor — only after hostel selected */}
                      {formData.hostelId && (
                        <SelectBetter
                          label="Floor"
                          name="floor"
                          placeholder="Select Floor"
                          options={floorOptions}
                          value={formData.floor}
                          onChange={handleChange}
                          error={errors.floor}
                          required
                        />
                      )}

                      {/* 3. Flat Number — only after floor selected */}
                      {formData.hostelId && formData.floor && (
                        <SelectBetter
                          label="Flat Number"
                          name="flatNumber"
                          placeholder="Select Flat"
                          options={flatOptions}
                          value={formData.flatNumber}
                          onChange={handleChange}
                          error={errors.flatNumber}
                          required
                        />
                      )}
                    </div>
                  )}
                </section>

                {/* Security */}
                <section>
                  <h2 className="text-sm font-bold text-[#00B8D4] uppercase tracking-wide mb-4 pl-1">Security</h2>
                  <TextInput label="Password" name="password" type="password" placeholder="Create a strong password" value={formData.password} onChange={handleChange} error={errors.password} required autoComplete="new-password" />
                </section>

                <div className="flex flex-col items-center gap-4 pt-4">
                  <Button type="submit" fullWidth disabled={isSubmitting}>{isSubmitting ? (<div className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating Account...</div>) : "Register"}</Button>
                  <p className="text-sm text-[#64748B]">Already have an account?{' '}<button type="button" onClick={() => navigate('/login')} className="text-[#00B8D4] font-semibold hover:text-[#00E5FF] hover:underline transition-colors bg-transparent border-none cursor-pointer p-0">Login</button></p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
        <div className="mt-6 pt-4 border-t border-[#E6FBFF]"><button type="button" onClick={onSwitchToAdmin} className="w-full flex items-center justify-center gap-2 text-sm text-[#64748B] hover:text-purple-500 transition-colors bg-transparent border-none cursor-pointer py-2"><Shield size={16} /><span>Registering as <strong>Hostel Admin</strong>? Click here</span></button></div>
      </motion.div>
    </>
  );
};

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                         ADMIN REGISTRATION                               ║
// ╚════════════════════════════════════════════════════════════════════════════╝

const NUMBERING_OPTIONS = [
  { value: 'sequential', label: 'Sequential (1, 2, 3, …)' },
  { value: 'floor-prefixed', label: 'Floor-Prefixed (101, 201, …)' },
  { value: 'custom', label: 'Custom Pattern' },
];

function AdminRegistration({ onSwitchToStudent }) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading && user) navigate('/', { replace: true }); }, [user, loading, navigate]);

  // ─── Multi-step state ───
  const [step, setStep] = useState(1); // 1 = key, 2 = hostel setup + personal, 3 = done
  const [formData, setFormData] = useState({
    activationKey: '',
    fullName: '', email: '', phone: '', password: '',
    hostelName: '', blockName: '',
    numberOfFloors: '', flatsPerFloor: '',
    flatNumberingReference: 'floor-prefixed',
    customFlatPattern: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [keyValidated, setKeyValidated] = useState(false);

  useEffect(() => { if (toastMsg) { const t = setTimeout(() => setToastMsg(null), 4000); return () => clearTimeout(t); } }, [toastMsg]);
  const showToast = (msg, type = 'success') => { setToastMsg(msg); setToastType(type); };
  const handleChange = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); if (errors[name]) setErrors(p => ({ ...p, [name]: '' })); };

  // ─── Step 1: Validate activation key ───
  const handleValidateKey = async () => {
    if (!formData.activationKey.trim()) {
      setErrors({ activationKey: 'Required' });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await validateActivationKey(formData.activationKey);
      if (!result.valid) {
        setErrors({ activationKey: result.error });
        showToast(result.error, 'error');
      } else {
        setKeyValidated(true);
        setStep(2);
        showToast("Key validated! Now set up your hostel.", 'success');
      }
    } catch {
      showToast("Validation failed.", 'error');
    } finally { setIsSubmitting(false); }
  };

  // ─── Flat preview ───
  const flatPreview = useMemo(() => {
    if (!formData.numberOfFloors || !formData.flatsPerFloor) return [];
    return generateFlats(
      Number(formData.numberOfFloors),
      Number(formData.flatsPerFloor),
      formData.flatNumberingReference,
      formData.customFlatPattern
    ).slice(0, 8); // Show first 8 as preview
  }, [formData.numberOfFloors, formData.flatsPerFloor, formData.flatNumberingReference, formData.customFlatPattern]);

  // ─── Step 2: Submit registration + hostel ───
  const handleSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setErrors({});
    const ne = {};
    if (!formData.fullName.trim()) ne.fullName = 'Required';
    if (!formData.email.trim()) ne.email = 'Required';
    if (!formData.password || formData.password.length < 6) ne.password = 'Min 6 characters';
    if (!formData.hostelName.trim()) ne.hostelName = 'Required';
    if (!formData.blockName.trim()) ne.blockName = 'Required';
    if (!formData.numberOfFloors || Number(formData.numberOfFloors) < 1) ne.numberOfFloors = 'Min 1 floor';
    if (!formData.flatsPerFloor || Number(formData.flatsPerFloor) < 1) ne.flatsPerFloor = 'Min 1 flat';
    if (formData.flatNumberingReference === 'custom' && !formData.customFlatPattern.trim()) ne.customFlatPattern = 'Pattern required';
    if (Object.keys(ne).length > 0) { setErrors(ne); setIsSubmitting(false); showToast("Fix the errors.", 'error'); return; }

    try {
      // 1. Create Firebase Auth account
      const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(result.user, { displayName: formData.fullName });

      // 2. Create hostel + admin management profile
      await setupHostel(
        {
          hostelName: formData.hostelName,
          blockName: formData.blockName,
          numberOfFloors: Number(formData.numberOfFloors),
          flatsPerFloor: Number(formData.flatsPerFloor),
          flatNumberingReference: formData.flatNumberingReference,
          customFlatPattern: formData.customFlatPattern || undefined,
        },
        {
          uid: result.user.uid,
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone,
        }
      );

      // 3. Mark key used
      await markKeyAsUsed(formData.activationKey, result.user.uid);
      setShowSuccessModal(true);
    } catch (error) {
      let msg = "Registration failed.";
      if (error.code === 'auth/email-already-in-use') msg = "Email already registered.";
      else if (error.code === 'auth/weak-password') msg = "Password too weak.";
      else if (error.code === 'auth/invalid-email') msg = "Invalid email.";
      showToast(msg, 'error');
    } finally { setIsSubmitting(false); }
  };

  return (
    <>
      <AnimatePresence>{toastMsg && (<motion.div initial={{ opacity: 0, y: -50, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -50, x: "-50%" }} className="fixed top-6 left-1/2 z-[100]"><div className={`min-w-[300px] max-w-md px-8 py-3 text-center rounded-xl font-medium text-[15px] backdrop-blur-md ${toastType === 'error' ? 'text-red-800 bg-red-100/90 border border-red-300' : 'text-[#064E3B] bg-[#4ADE80]/85 border border-[#22C55E]/50'}`}>{toastMsg}</div></motion.div>)}</AnimatePresence>
      <Modal open={showSuccessModal} onClose={() => { setShowSuccessModal(false); window.location.href = '/'; }}>
        <div className="text-center py-2"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Shield className="text-green-600" size={32} /></div><h2 className="text-xl font-bold text-[#064E3B] mb-2">Admin Account Created!</h2><p className="text-[#064E3B]/80 text-sm">Your hostel has been set up. You'll be redirected to your dashboard.</p></div>
      </Modal>
      <motion.div layout initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6 }} className="w-full max-w-[600px] bg-white/70 backdrop-blur-md rounded-[28px] p-8 shadow-[0_0_40px_rgba(139,92,246,0.25)] border border-purple-100 my-10">
        <motion.div layout className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.4)] mb-4 text-white"><Shield size={32} strokeWidth={2.5} /></div>
          <h1 className="text-[24px] font-semibold text-[#0f172a]">Admin Registration</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Register and set up your hostel</p>
        </motion.div>

        {/* ─── Step Indicator ─── */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step >= s ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                {step > s ? <CheckCircle2 size={16} /> : s}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${step >= s ? 'text-purple-600' : 'text-gray-400'}`}>
                {s === 1 ? 'Activation Key' : 'Hostel Setup'}
              </span>
              {s < 2 && <div className={`w-8 h-0.5 ${step > 1 ? 'bg-purple-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* ═══════ STEP 1: Activation Key ═══════ */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-5">
              <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100">
                <div className="flex items-center gap-2 mb-3"><KeyRound size={16} className="text-purple-500" /><span className="text-sm font-bold text-purple-700 uppercase tracking-wide">Activation Key</span></div>
                <TextInput name="activationKey" placeholder="e.g. DORM-XXXX-YYYY" value={formData.activationKey} onChange={handleChange} error={errors.activationKey} required autoComplete="off" />
                <p className="text-xs text-purple-400 mt-2 ml-1">Contact DormDesk team for your hostel's key</p>
              </div>
              <button
                type="button"
                onClick={handleValidateKey}
                disabled={isSubmitting}
                className="relative w-full px-6 py-3 flex items-center justify-center gap-2 cursor-pointer rounded-full text-white font-bold text-[15px] bg-gradient-to-r from-purple-500 to-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.45)] hover:shadow-[0_0_35px_rgba(139,92,246,0.75)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (<div className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Validating...</div>) : (<><KeyRound size={18} />Validate Key</>)}
              </button>
            </motion.div>
          )}

          {/* ═══════ STEP 2: Hostel Setup + Personal Info ═══════ */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-5">
              {/* Key indicator */}
              <div className="flex items-center gap-2 bg-green-50 rounded-xl px-4 py-2 border border-green-200">
                <CheckCircle2 size={16} className="text-green-600" />
                <span className="text-sm text-green-700 font-medium">Key verified: <code className="bg-green-100 px-2 py-0.5 rounded text-xs">{formData.activationKey}</code></span>
              </div>

              {/* Hostel Configuration */}
              <section className="bg-purple-50/30 rounded-2xl p-5 border border-purple-100">
                <div className="flex items-center gap-2 mb-4"><Building2 size={16} className="text-purple-500" /><span className="text-sm font-bold text-purple-700 uppercase tracking-wide">Hostel Configuration</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextInput label="Hostel Name" name="hostelName" placeholder='e.g. "Sunrise Hostel"' value={formData.hostelName} onChange={handleChange} error={errors.hostelName} required />
                  <TextInput label="Block Name" name="blockName" placeholder='e.g. "Block A" or "A"' value={formData.blockName} onChange={handleChange} error={errors.blockName} required />
                  <TextInput label="Number of Floors" name="numberOfFloors" type="number" placeholder="e.g. 5" value={formData.numberOfFloors} onChange={handleChange} error={errors.numberOfFloors} required />
                  <TextInput label="Flats per Floor" name="flatsPerFloor" type="number" placeholder="e.g. 10" value={formData.flatsPerFloor} onChange={handleChange} error={errors.flatsPerFloor} required />
                  <div className="sm:col-span-2">
                    <SelectBetter
                      label="Flat Numbering"
                      name="flatNumberingReference"
                      placeholder="Select scheme"
                      options={NUMBERING_OPTIONS}
                      value={formData.flatNumberingReference}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {formData.flatNumberingReference === 'custom' && (
                    <div className="sm:col-span-2">
                      <TextInput label="Custom Pattern" name="customFlatPattern" placeholder="e.g. A-{floor}{unit}" value={formData.customFlatPattern} onChange={handleChange} error={errors.customFlatPattern} required />
                      <p className="text-xs text-purple-400 mt-1 ml-1">Use <code className="bg-purple-100 px-1 rounded">{'{floor}'}</code> and <code className="bg-purple-100 px-1 rounded">{'{unit}'}</code> as placeholders</p>
                    </div>
                  )}
                </div>

                {/* Flat Preview */}
                {flatPreview.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-purple-100">
                    <p className="text-xs font-semibold text-purple-500 uppercase mb-2">Preview of generated flats</p>
                    <div className="flex flex-wrap gap-1.5">
                      {flatPreview.map((f, i) => (
                        <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-mono">
                          {f.flat}
                        </span>
                      ))}
                      {Number(formData.numberOfFloors) * Number(formData.flatsPerFloor) > 8 && (
                        <span className="text-xs text-purple-400 px-2 py-1">
                          +{Number(formData.numberOfFloors) * Number(formData.flatsPerFloor) - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Personal Info */}
              <section>
                <h2 className="text-sm font-bold text-purple-500 uppercase tracking-wide mb-4 pl-1">Personal Info</h2>
                <div className="flex flex-col gap-4">
                  <TextInput label="Full Name" name="fullName" placeholder="Your name" value={formData.fullName} onChange={handleChange} error={errors.fullName} required />
                  <TextInput label="Email" name="email" type="email" placeholder="admin@hostel.com" value={formData.email} onChange={handleChange} error={errors.email} required autoComplete="email" />
                  <TextInput label="Phone (optional)" name="phone" type="tel" placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={handleChange} />
                </div>
              </section>

              {/* Security */}
              <section>
                <h2 className="text-sm font-bold text-purple-500 uppercase tracking-wide mb-4 pl-1">Security</h2>
                <TextInput label="Password" name="password" type="password" placeholder="Min 6 characters" value={formData.password} onChange={handleChange} error={errors.password} required autoComplete="new-password" />
              </section>

              <div className="flex flex-col items-center gap-4 pt-2">
                <div className="flex gap-3 w-full">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 px-6 py-3 rounded-full text-purple-600 font-bold text-[15px] bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-all duration-200 cursor-pointer">
                    Back
                  </button>
                  <button type="submit" disabled={isSubmitting} className="flex-[2] px-6 py-3 flex items-center justify-center gap-2 cursor-pointer rounded-full text-white font-bold text-[15px] bg-gradient-to-r from-purple-500 to-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.45)] hover:shadow-[0_0_35px_rgba(139,92,246,0.75)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? (<div className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating...</div>) : (<><Shield size={18} />Register & Setup Hostel</>)}
                  </button>
                </div>
                <p className="text-sm text-[#64748B]">Already have an account?{' '}<button type="button" onClick={() => navigate('/login')} className="text-purple-500 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0">Login</button></p>
              </div>
            </motion.div>
          )}
        </form>
        <div className="mt-6 pt-4 border-t border-purple-100"><button type="button" onClick={onSwitchToStudent} className="w-full flex items-center justify-center gap-2 text-sm text-[#64748B] hover:text-[#00B8D4] transition-colors bg-transparent border-none cursor-pointer py-2"><GraduationCap size={16} /><span>Registering as <strong>Student</strong>? Click here</span></button></div>
      </motion.div>
    </>
  );
}

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                          PAGE WRAPPER                                    ║
// ╚════════════════════════════════════════════════════════════════════════════╝

export default function Register() {
  const [mode, setMode] = useState('student');
  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(#f7fdff,#ffffff)] font-['Poppins',sans-serif] text-[#0f172a] p-4 relative">
      <AnimatePresence mode="wait">
        {mode === 'student' ? (
          <motion.div key="student" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.3 }} className="flex flex-col items-center w-full">
            <StudentRegistration onSwitchToAdmin={() => setMode('admin')} />
          </motion.div>
        ) : (
          <motion.div key="admin" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="flex flex-col items-center w-full">
            <AdminRegistration onSwitchToStudent={() => setMode('student')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}