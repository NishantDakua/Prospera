"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import Navbar from "@/views/layout/Navbar";

export default function PendingPage() {
  const { user, isKycDone, isVerified } = useAuth();

  const kycStatus = user?.kycStatus || "pending";

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
              <p className="text-luxury-gold/60 text-lg mb-8 max-w-lg mx-auto">
                Unfortunately your KYC submission was rejected. Please review your details and resubmit. 
                If you believe this is an error, contact support.
              </p>
              <Link
                href="/verify"
                className="inline-flex items-center gap-3 premium-gradient text-white font-bold uppercase tracking-widest px-10 py-4 rounded-sm text-sm hover:brightness-110 transition-all shadow-xl shadow-luxury-crimson/20"
              >
                Resubmit KYC
                <span className="material-symbols-outlined text-lg">refresh</span>
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
