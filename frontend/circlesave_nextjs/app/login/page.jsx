"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-luxury-dark">
        <span className="material-symbols-outlined animate-spin text-luxury-gold text-4xl">progress_activity</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(form);
      const role = data.user?.role;
      const verified = data.user?.isVerified;
      const kycStatus = data.user?.kycStatus;

      // Route based on role
      if (role === "admin") {
        router.push("/admin");
      } else if (role === "moderator") {
        router.push("/moderator");
      } else if (kycStatus === "pending") {
        // Customer hasn't submitted KYC yet
        router.push("/verify");
      } else if (!verified) {
        // Customer submitted KYC but not yet approved
        router.push("/pending");
      } else {
        // Verified customer → go to requested page or dashboard
        router.push(redirect);
      }
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
        <div className="absolute inset-0 bg-[url('/video/bg.mp4')] bg-cover opacity-20" />
        <div className="relative z-10 p-16 max-w-lg">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <span className="material-symbols-outlined text-white text-2xl">account_balance_wallet</span>
            </div>
            <span className="text-3xl font-serif font-black text-white">Prospera</span>
          </div>
          <h1 className="text-5xl font-serif font-black text-white leading-tight mb-6">
            Welcome back to your <span className="text-luxury-gold">financial circle.</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Access your decentralized savings groups, manage contributions, and grow your wealth collaboratively.
          </p>
          <div className="mt-12 flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-full backdrop-blur-sm border border-white/10">
              <span className="material-symbols-outlined text-luxury-gold text-sm">verified</span>
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest">KYC Protected</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-full backdrop-blur-sm border border-white/10">
              <span className="material-symbols-outlined text-luxury-gold text-sm">lock</span>
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest">On-Chain</span>
            </div>
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
            <span className="text-2xl font-serif font-black text-luxury-cream">Prospera</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-luxury-cream tracking-tight mb-2">Sign In</h2>
            <p className="text-luxury-gold/60 text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-luxury-crimson font-bold hover:underline">
                Create one
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full bg-luxury-gold/5 border border-luxury-gold/10 rounded-xl pl-12 pr-4 py-4 text-luxury-cream placeholder-luxury-gold/30 focus:border-luxury-crimson focus:ring-1 focus:ring-luxury-crimson outline-none transition-all text-sm"
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
                  placeholder="••••••••"
                  required
                  className="w-full bg-luxury-gold/5 border border-luxury-gold/10 rounded-xl pl-12 pr-4 py-4 text-luxury-cream placeholder-luxury-gold/30 focus:border-luxury-crimson focus:ring-1 focus:ring-luxury-crimson outline-none transition-all text-sm"
                />
              </div>
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
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <Link href="/" className="text-luxury-gold/40 text-xs font-bold hover:text-luxury-gold transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
