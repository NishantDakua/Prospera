"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";

const STEPS = [
  { key: "personal", label: "Personal Details", icon: "person" },
  { key: "identity", label: "Identity Verification", icon: "badge" },
  { key: "bank", label: "Nominee", icon: "family_restroom" },
  { key: "review", label: "Review & Submit", icon: "verified" },
];

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Chandigarh",
];

const InputField = ({ label, name, type = "text", placeholder, required = false, icon, maxLength, value, onChange, hasError = false }) => (
  <div>
    <label className="text-luxury-gold/60 text-[10px] font-black uppercase tracking-widest mb-2 block">
      {label} {required && <span className="text-luxury-crimson">*</span>}
    </label>
    <div className="relative">
      {icon && (
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-luxury-gold/40 text-lg">{icon}</span>
      )}
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full bg-luxury-gold/5 border rounded-xl ${icon ? "pl-12" : "pl-4"} pr-4 py-3.5 text-luxury-cream placeholder-luxury-gold/30 focus:ring-1 outline-none transition-all text-sm ${
          hasError
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/40"
            : "border-luxury-gold/10 focus:border-luxury-crimson focus:ring-luxury-crimson"
        }`}
      />
    </div>
  </div>
);

export default function VerifyPage() {
  const router = useRouter();
  const { user, isKycDone, submitKyc, loading: authLoading } = useAuth();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Track which field failed validation so we can highlight it
  const [errorField, setErrorField] = useState("");

  const [form, setForm] = useState({
    dateOfBirth: "",
    gender: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    aadhaarNumber: "",
    panNumber: "",
    nomineeName: "",
    nomineeRelation: "",
  });

  const [rejectionReason, setRejectionReason] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  // If already KYC done, redirect to dashboard
  useEffect(() => {
    if (!authLoading && isKycDone) {
      router.push("/dashboard");
    }
  }, [authLoading, isKycDone, router]);

  // If not logged in, redirect to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Pre-fill form from existing KYC data (for resubmission after rejection)
  useEffect(() => {
    if (!user || prefilled) return;
    (async () => {
      try {
        const res = await fetch("/api/kyc");
        const data = await res.json();
        if (data.kyc && (data.kyc.status === "rejected" || data.kyc.status === "submitted")) {
          setForm({
            dateOfBirth: data.kyc.dateOfBirth || "",
            gender: data.kyc.gender || "",
            addressLine: data.kyc.addressLine || "",
            city: data.kyc.city || "",
            state: data.kyc.state || "",
            pincode: data.kyc.pincode || "",
            aadhaarNumber: data.kyc.aadhaarNumber || "",
            panNumber: data.kyc.panNumber || "",
            nomineeName: data.kyc.nomineeName || "",
            nomineeRelation: data.kyc.nomineeRelation || "",
          });
          if (data.kyc.rejectionReason) {
            setRejectionReason(data.kyc.rejectionReason);
          }
        }
      } catch { /* ignore */ }
      finally { setPrefilled(true); }
    })();
  }, [user, prefilled]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    // Clear error only for the field that was just edited
    if (e.target.name === errorField) {
      setError("");
      setErrorField("");
    }
  };

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!form.dateOfBirth) return { msg: "Date of birth is required.", field: "dateOfBirth" };
        if (!form.gender) return { msg: "Gender is required.", field: "gender" };
        if (!form.addressLine) return { msg: "Address is required.", field: "addressLine" };
        if (!form.city) return { msg: "City is required.", field: "city" };
        if (!form.state) return { msg: "State is required.", field: "state" };
        if (!form.pincode || !/^\d{6}$/.test(form.pincode)) return { msg: "Valid 6-digit pincode is required.", field: "pincode" };
        break;
      case 1: {
        const aadhaar = form.aadhaarNumber.replace(/\s/g, "");
        if (!aadhaar || !/^\d{12}$/.test(aadhaar)) return { msg: "Valid 12-digit Aadhaar number is required.", field: "aadhaarNumber" };
        const pan = form.panNumber.toUpperCase();
        if (!pan || !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) return { msg: "Valid PAN (e.g. ABCDE1234F) is required.", field: "panNumber" };
        break;
      }
      case 2:
        // Nominee details are optional, no strict validation
        break;
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) {
      setError(err.msg);
      setErrorField(err.field);
      return;
    }
    setError("");
    setErrorField("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => {
    setError("");
    setErrorField("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitKyc(form);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxury-dark">
        <span className="material-symbols-outlined text-5xl text-luxury-gold animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-dark font-display">
      {/* Header */}
      <header className="border-b border-luxury-gold/10 bg-luxury-dark/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center">
              <span className="material-symbols-outlined text-white">account_balance_wallet</span>
            </div>
            <span className="text-xl font-bold text-luxury-cream">Prospera</span>
          </div>
          <div className="text-right">
            <p className="text-luxury-cream text-sm font-bold">{user.fullName}</p>
            <p className="text-luxury-gold/50 text-[10px] uppercase tracking-widest">{user.email}</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Rejection Banner */}
        {rejectionReason && (
          <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-red-400">feedback</span>
              </div>
              <div>
                <h3 className="text-red-400 font-bold text-sm uppercase tracking-widest mb-1">KYC Rejected — Admin Feedback</h3>
                <p className="text-red-300/80 text-sm leading-relaxed">&ldquo;{rejectionReason}&rdquo;</p>
                <p className="text-luxury-gold/40 text-xs mt-2">Your previous details have been loaded below. Please fix the issue and resubmit.</p>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-luxury-crimson/10 border border-luxury-crimson/20 text-luxury-crimson text-[10px] font-black uppercase tracking-widest mb-4">
            <span className="material-symbols-outlined text-sm">security</span>
            {rejectionReason ? "Resubmission Required" : "Identity Verification Required"}
          </div>
          <h1 className="text-3xl font-bold text-luxury-cream tracking-tight mb-2">
            {rejectionReason ? "Fix & Resubmit KYC" : "Complete Your KYC Verification"}
          </h1>
          <p className="text-luxury-gold/60 text-sm max-w-lg mx-auto">
            {rejectionReason
              ? "Review the admin feedback above, correct any issues in your details, and submit again."
              : "As a regulated financial platform, we require identity verification before you can participate in savings circles. Your data is encrypted and stored securely."}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
                  i === step
                    ? "bg-luxury-crimson text-white shadow-lg shadow-luxury-crimson/30"
                    : i < step
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20"
                    : "bg-luxury-gold/5 text-luxury-gold/40 border border-luxury-gold/10"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {i < step ? "check_circle" : s.icon}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px mx-1 ${i < step ? "bg-emerald-500/40" : "bg-luxury-gold/10"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3 max-w-2xl mx-auto">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {/* Form Card */}
        <div className="luxury-glass rounded-custom p-8 md:p-12 max-w-2xl mx-auto">
          {/* Step 0: Personal Details */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-luxury-crimson/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-luxury-crimson">person</span>
                </div>
                <div>
                  <h3 className="text-luxury-cream font-bold text-lg">Personal Details</h3>
                  <p className="text-luxury-gold/50 text-xs">As they appear on your government ID</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField label="Date of Birth" name="dateOfBirth" type="date" required icon="calendar_month" value={form.dateOfBirth} onChange={handleChange} hasError={errorField==="dateOfBirth"} />
                <div>
                  <label className="text-luxury-gold/60 text-[10px] font-black uppercase tracking-widest mb-2 block">
                    Gender <span className="text-luxury-crimson">*</span>
                  </label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full bg-luxury-gold/5 border border-luxury-gold/10 rounded-xl px-4 py-3.5 text-luxury-cream focus:border-luxury-crimson focus:ring-1 focus:ring-luxury-crimson outline-none transition-all text-sm appearance-none"
                  >
                    <option value="" className="bg-luxury-dark">Select</option>
                    <option value="male" className="bg-luxury-dark">Male</option>
                    <option value="female" className="bg-luxury-dark">Female</option>
                    <option value="other" className="bg-luxury-dark">Other</option>
                  </select>
                </div>
              </div>

              <InputField label="Address" name="addressLine" placeholder="House No, Street, Locality" required icon="home" value={form.addressLine} onChange={handleChange} hasError={errorField==="addressLine"} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <InputField label="City" name="city" placeholder="Mumbai" required icon="location_city" value={form.city} onChange={handleChange} hasError={errorField==="city"} />
                <div>
                  <label className="text-luxury-gold/60 text-[10px] font-black uppercase tracking-widest mb-2 block">
                    State <span className="text-luxury-crimson">*</span>
                  </label>
                  <select
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className="w-full bg-luxury-gold/5 border border-luxury-gold/10 rounded-xl px-4 py-3.5 text-luxury-cream focus:border-luxury-crimson focus:ring-1 focus:ring-luxury-crimson outline-none transition-all text-sm appearance-none"
                  >
                    <option value="" className="bg-luxury-dark">Select</option>
                    {STATES.map((s) => (
                      <option key={s} value={s} className="bg-luxury-dark">{s}</option>
                    ))}
                  </select>
                </div>
                <InputField label="Pincode" name="pincode" placeholder="400001" required maxLength={6} icon="pin_drop" value={form.pincode} onChange={handleChange} hasError={errorField==="pincode"} />
              </div>
            </div>
          )}

          {/* Step 1: Identity Verification */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-luxury-crimson/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-luxury-crimson">badge</span>
                </div>
                <div>
                  <h3 className="text-luxury-cream font-bold text-lg">Identity Documents</h3>
                  <p className="text-luxury-gold/50 text-xs">Government-issued identification numbers</p>
                </div>
              </div>

              {/* Aadhaar */}
              <div className="p-6 rounded-xl border border-luxury-gold/10 bg-luxury-gold/[0.02]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-luxury-gold">fingerprint</span>
                  <div>
                    <p className="text-luxury-cream font-bold text-sm">Aadhaar Card Number</p>
                    <p className="text-luxury-gold/40 text-[10px]">12-digit UIDAI number</p>
                  </div>
                </div>
                <input
                  type="text"
                  name="aadhaarNumber"
                  value={form.aadhaarNumber}
                  onChange={handleChange}
                  placeholder="XXXX XXXX XXXX"
                  maxLength={14}
                  className="w-full bg-luxury-dark border border-luxury-gold/10 rounded-xl px-4 py-3.5 text-luxury-cream placeholder-luxury-gold/30 focus:border-luxury-crimson focus:ring-1 focus:ring-luxury-crimson outline-none transition-all text-sm font-mono tracking-widest text-center text-lg"
                />
                <p className="text-luxury-gold/30 text-[10px] mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">lock</span>
                  Encrypted & stored securely. Used only for identity verification.
                </p>
              </div>

              {/* PAN */}
              <div className="p-6 rounded-xl border border-luxury-gold/10 bg-luxury-gold/[0.02]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-luxury-gold">credit_card</span>
                  <div>
                    <p className="text-luxury-cream font-bold text-sm">PAN Card Number</p>
                    <p className="text-luxury-gold/40 text-[10px]">Permanent Account Number (Income Tax)</p>
                  </div>
                </div>
                <input
                  type="text"
                  name="panNumber"
                  value={form.panNumber}
                  onChange={handleChange}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full bg-luxury-dark border border-luxury-gold/10 rounded-xl px-4 py-3.5 text-luxury-cream placeholder-luxury-gold/30 focus:border-luxury-crimson focus:ring-1 focus:ring-luxury-crimson outline-none transition-all text-sm font-mono tracking-widest text-center text-lg uppercase"
                />
                <p className="text-luxury-gold/30 text-[10px] mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">info</span>
                  Required for all financial transactions above ₹50,000.
                </p>
              </div>

              {/* Info banner */}
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-400 text-lg mt-0.5">info</span>
                <p className="text-blue-300/80 text-xs leading-relaxed">
                  Your identity documents are verified in compliance with RBI KYC guidelines and the Prevention of Money Laundering Act (PMLA). Data is encrypted at rest.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Nominee */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-luxury-crimson/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-luxury-crimson">family_restroom</span>
                </div>
                <div>
                  <h3 className="text-luxury-cream font-bold text-lg">Nominee Details</h3>
                  <p className="text-luxury-gold/50 text-xs">Person to contact in case of emergency</p>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-luxury-gold/10 bg-luxury-gold/[0.02] space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Nominee Name" name="nomineeName" placeholder="Full legal name" icon="person" value={form.nomineeName} onChange={handleChange} hasError={errorField==="nomineeName"} />
                  <div>
                    <label className="text-luxury-gold/60 text-[10px] font-black uppercase tracking-widest mb-2 block">
                      Relationship
                    </label>
                    <select
                      name="nomineeRelation"
                      value={form.nomineeRelation}
                      onChange={handleChange}
                      className="w-full bg-luxury-gold/5 border border-luxury-gold/10 rounded-xl px-4 py-3.5 text-luxury-cream focus:border-luxury-crimson focus:ring-1 focus:ring-luxury-crimson outline-none transition-all text-sm appearance-none"
                    >
                      <option value="" className="bg-luxury-dark">Select</option>
                      {["Spouse", "Father", "Mother", "Son", "Daughter", "Brother", "Sister", "Other"].map((r) => (
                        <option key={r} value={r.toLowerCase()} className="bg-luxury-dark">{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-400 text-lg mt-0.5">info</span>
                <p className="text-blue-300/80 text-xs leading-relaxed">
                  Nominee details are optional. This person will be contacted by our team in case of account disputes or emergencies.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-400">verified</span>
                </div>
                <div>
                  <h3 className="text-luxury-cream font-bold text-lg">Review Your Information</h3>
                  <p className="text-luxury-gold/50 text-xs">Please verify all details before submitting</p>
                </div>
              </div>

              {/* Review sections */}
              {[
                {
                  title: "Personal Details",
                  icon: "person",
                  fields: [
                    ["Date of Birth", form.dateOfBirth],
                    ["Gender", form.gender],
                    ["Address", form.addressLine],
                    ["City", form.city],
                    ["State", form.state],
                    ["Pincode", form.pincode],
                  ],
                },
                {
                  title: "Identity Documents",
                  icon: "badge",
                  fields: [
                    ["Aadhaar", form.aadhaarNumber || "—"],
                    ["PAN", form.panNumber ? form.panNumber.toUpperCase() : "—"],
                  ],
                },
                {
                  title: "Nominee",
                  icon: "family_restroom",
                  fields: [
                    ["Nominee", form.nomineeName || "Not provided"],
                    ["Relation", form.nomineeRelation || "Not provided"],
                  ],
                },
              ].map((section) => (
                <div key={section.title} className="p-5 rounded-xl border border-luxury-gold/10 bg-luxury-gold/[0.02]">
                  <p className="text-luxury-gold/60 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">{section.icon}</span>
                    {section.title}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {section.fields.map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <p className="text-luxury-gold/40 text-[10px] uppercase tracking-widest">{label}</p>
                        <p className="text-luxury-cream text-sm font-bold capitalize break-all">{value || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Consent */}
              <div className="p-5 rounded-xl bg-luxury-crimson/5 border border-luxury-crimson/20 flex items-start gap-3">
                <input type="checkbox" id="consent" required className="mt-1 accent-luxury-crimson" />
                <label htmlFor="consent" className="text-luxury-gold/60 text-xs leading-relaxed cursor-pointer">
                  I hereby declare that all the information provided above is true and accurate to the best of my knowledge. I authorize Prospera to verify my identity documents as per applicable KYC regulations.
                </label>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-10 pt-8 border-t border-luxury-gold/10">
            {step > 0 ? (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 text-luxury-gold text-sm font-bold hover:text-luxury-cream transition-colors"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Previous
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={nextStep}
                className="premium-gradient text-white font-bold uppercase tracking-widest py-3 px-8 rounded-xl text-sm hover:brightness-110 transition-all shadow-lg shadow-luxury-crimson/20 flex items-center gap-2"
              >
                Continue
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-widest py-3 px-8 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Submitting…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">verified</span>
                    Submit Verification
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
