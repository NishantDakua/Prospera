"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await signup({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      // After signup, redirect to KYC verification
      router.push("/verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-display bg-luxury-dark">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 premium-gradient opacity-90" />
        <div className="relative z-10 p-16 max-w-lg">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <span className="material-symbols-outlined text-white text-2xl">account_balance_wallet</span>
            </div>
            <span className="text-3xl font-serif font-black text-white">CircleSave</span>
          </div>
          <h1 className="text-5xl font-serif font-black text-white leading-tight mb-6">
            Start building <span className="text-luxury-gold">wealth together.</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Join trusted savings circles powered by blockchain. Your funds are secure, transparent, and always under your control.
          </p>

          {/* Trust badges */}
          <div className="mt-12 space-y-4">
            {[
              { icon: "shield", text: "Aadhaar & PAN verified members" },
              { icon: "token", text: "Smart contract backed savings" },
              { icon: "gavel", text: "Fair auction & lucky draw payouts" },
              { icon: "account_balance", text: "Microfinance loan facility" },
            ].map((b) => (
              <div key={b.text} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-luxury-gold text-sm">{b.icon}</span>
                </div>
                <span className="text-white/70 text-sm font-medium">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center">
              <span className="material-symbols-outlined text-white">account_balance_wallet</span>
            </div>
            <span className="text-2xl font-serif font-black text-luxury-cream">CircleSave</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-luxury-cream tracking-tight mb-2">Create Account</h2>
            <p className="text-luxury-gold/60 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-luxury-crimson font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="text-luxury-gold/60 text-[10px] font-black uppercase tracking-widest mb-2 block">
                Full Name (as per Aadhaar)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-luxury-gold/40 text-lg">person</span>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Rajesh Kumar"
                  required
                  className="w-full bg-luxury-gold/5 border border-luxury-gold/10 rounded-xl pl-12 pr-4 py-3.5 text-luxury-cream placeholder-luxury-gold/30 focus:border-luxury-crimson focus:ring-1 focus:ring-luxury-crimson outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-luxury-gold/60 text-[10px] font-black uppercase tracking-widest mb-2 block">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-luxury-gold/40 text-lg">mail</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-luxury-gold/5 border border-luxury-gold/10 rounded-xl pl-12 pr-4 py-3.5 text-luxury-cream placeholder-luxury-gold/30 focus:border-luxury-crimson focus:ring-1 focus:ring-luxury-crimson outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-luxury-gold/60 text-[10px] font-black uppercase tracking-widest mb-2 block">
                Phone Number
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-luxury-gold/40 text-lg">phone</span>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full bg-luxury-gold/5 border border-luxury-gold/10 rounded-xl pl-12 pr-4 py-3.5 text-luxury-cream placeholder-luxury-gold/30 focus:border-luxury-crimson focus:ring-1 focus:ring-luxury-crimson outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-luxury-gold/60 text-[10px] font-black uppercase tracking-widest mb-2 block">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-luxury-gold/40 text-lg">lock</span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  required
                  className="w-full bg-luxury-gold/5 border border-luxury-gold/10 rounded-xl pl-12 pr-4 py-3.5 text-luxury-cream placeholder-luxury-gold/30 focus:border-luxury-crimson focus:ring-1 focus:ring-luxury-crimson outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-luxury-gold/60 text-[10px] font-black uppercase tracking-widest mb-2 block">
                Confirm Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-luxury-gold/40 text-lg">lock</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  required
                  className="w-full bg-luxury-gold/5 border border-luxury-gold/10 rounded-xl pl-12 pr-4 py-3.5 text-luxury-cream placeholder-luxury-gold/30 focus:border-luxury-crimson focus:ring-1 focus:ring-luxury-crimson outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 pt-1">
              <input type="checkbox" required className="mt-1 accent-luxury-crimson" />
              <p className="text-luxury-gold/50 text-xs leading-relaxed">
                I agree to the <span className="text-luxury-gold font-bold">Terms of Service</span> and{" "}
                <span className="text-luxury-gold font-bold">Privacy Policy</span>. I understand my identity will be verified via KYC.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full premium-gradient text-white font-bold uppercase tracking-widest py-4 rounded-xl text-sm hover:brightness-110 transition-all shadow-xl shadow-luxury-crimson/20 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Creating account…
                </>
              ) : (
                <>
                  Create Account
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/" className="text-luxury-gold/40 text-xs font-bold hover:text-luxury-gold transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
