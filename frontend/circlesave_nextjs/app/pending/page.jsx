"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import Navbar from "@/views/layout/Navbar";

export default function PendingPage() {
  const { user, isKycDone, isVerified } = useAuth();

  const kycStatus = user?.kycStatus || "pending";
  const [kycData, setKycData] = useState(null);

  // Fetch KYC details so we can show rejection reason + submitted info
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch("/api/kyc");
        const data = await res.json();
        if (data.kyc) setKycData(data.kyc);
      } catch { /* ignore */ }
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-luxury-dark">
      <Navbar />
      <main className="pt-36 pb-24 px-8">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center">
            {kycStatus === "pending" ? (
              <span className="material-symbols-outlined text-luxury-gold text-5xl">description</span>
            ) : kycStatus === "submitted" ? (
              <span className="material-symbols-outlined text-luxury-gold text-5xl animate-pulse">hourglass_top</span>
            ) : kycStatus === "rejected" ? (
              <span className="material-symbols-outlined text-red-400 text-5xl">cancel</span>
            ) : (
              <span className="material-symbols-outlined text-green-400 text-5xl">verified</span>
            )}
          </div>

          {/* Status-specific content */}
          {kycStatus === "pending" && (
            <>
              <h1 className="text-4xl font-serif font-black text-luxury-cream mb-4">
                Complete Your Verification
              </h1>
              <p className="text-luxury-gold/60 text-lg mb-8 max-w-lg mx-auto">
                Before you can access the platform, we need to verify your identity. 
                This is a one-time process required by financial regulations.
              </p>
              <Link
                href="/verify"
                className="inline-flex items-center gap-3 premium-gradient text-white font-bold uppercase tracking-widest px-10 py-4 rounded-sm text-sm hover:brightness-110 transition-all shadow-xl shadow-luxury-crimson/20"
              >
                Start KYC Verification
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </>
          )}

          {kycStatus === "submitted" && (
            <>
              <h1 className="text-4xl font-serif font-black text-luxury-cream mb-4">
                Verification In Progress
              </h1>
              <p className="text-luxury-gold/60 text-lg mb-8 max-w-lg mx-auto">
                Your KYC documents have been submitted and are being reviewed by our team. 
                This typically takes 24-48 hours. You&apos;ll get access once approved.
              </p>
              <div className="inline-flex items-center gap-3 bg-luxury-gold/5 border border-luxury-gold/10 rounded-full px-6 py-3">
                <span className="material-symbols-outlined text-luxury-gold animate-spin">progress_activity</span>
                <span className="text-luxury-gold text-sm font-bold uppercase tracking-widest">Under Review</span>
              </div>
            </>
          )}

          {kycStatus === "rejected" && (
            <>
              <h1 className="text-4xl font-serif font-black text-red-400 mb-4">
                Verification Rejected
              </h1>

              {/* Admin Feedback */}
              {kycData?.rejectionReason && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8 text-left max-w-lg mx-auto">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-400 text-xl mt-0.5">feedback</span>
                    <div>
                      <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">Admin Feedback</p>
                      <p className="text-red-300/90 text-sm leading-relaxed">&ldquo;{kycData.rejectionReason}&rdquo;</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submitted Details Summary */}
              {kycData && (
                <div className="max-w-lg mx-auto mb-8 text-left">
                  <p className="text-luxury-gold/40 text-[10px] font-black uppercase tracking-widest mb-3 text-center">Your Submitted Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Name", user?.fullName],
                      ["DOB", kycData.dateOfBirth],
                      ["Gender", kycData.gender],
                      ["Address", kycData.addressLine],
                      ["City", kycData.city],
                      ["State", kycData.state],
                      ["Pincode", kycData.pincode],
                      ["Aadhaar", kycData.aadhaarNumber],
                      ["PAN", kycData.panNumber],
                      ["Nominee", kycData.nomineeName || "—"],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-white/5 border border-white/5 rounded-lg p-3 min-w-0">
                        <p className="text-luxury-gold/40 text-[9px] font-bold uppercase tracking-widest">{label}</p>
                        <p className="text-luxury-cream text-xs font-bold break-all">{val || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-luxury-gold/60 text-sm mb-6 max-w-lg mx-auto">
                Please review the feedback above, correct any issues, and resubmit. Your previous details will be pre-filled.
              </p>
              <Link
                href="/verify"
                className="inline-flex items-center gap-3 premium-gradient text-white font-bold uppercase tracking-widest px-10 py-4 rounded-sm text-sm hover:brightness-110 transition-all shadow-xl shadow-luxury-crimson/20"
              >
                Fix &amp; Resubmit KYC
                <span className="material-symbols-outlined text-lg">edit</span>
              </Link>
            </>
          )}

          {/* Timeline */}
          <div className="mt-16 max-w-md mx-auto">
            <div className="flex flex-col gap-0">
              {[
                { label: "Account Created", icon: "person_add", done: true },
                { label: "KYC Submitted", icon: "upload_file", done: kycStatus !== "pending" },
                { label: "Admin Review", icon: "admin_panel_settings", done: kycStatus === "verified" },
                { label: "Platform Access", icon: "lock_open", done: isVerified },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      step.done
                        ? "bg-green-500/20 border-green-500/40 text-green-400"
                        : "bg-white/5 border-white/10 text-white/30"
                    }`}>
                      <span className="material-symbols-outlined text-lg">
                        {step.done ? "check_circle" : step.icon}
                      </span>
                    </div>
                    {i < 3 && <div className={`w-0.5 h-8 ${step.done ? "bg-green-500/30" : "bg-white/5"}`} />}
                  </div>
                  <span className={`text-sm font-bold uppercase tracking-widest ${
                    step.done ? "text-green-400" : "text-white/30"
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
