"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import ConnectWallet from "@/views/ui/ConnectWallet";

export default function Navbar() {
    const { isAuthenticated, user, logout, role, isVerified, loading } = useAuth();

    if (loading) return (
        <header className="fixed top-0 w-full z-50 bg-brand-bg/80 backdrop-blur-md border-b border-white/5 h-24" />
    );

    const isStaff = role === "admin" || role === "moderator";

    /* Only customers get nav links — staff have no navbar nav */
    const navLinks = [];
    if (!isStaff && isVerified) {
        navLinks.push({ label: "Dashboard", href: "/dashboard" });
        navLinks.push({ label: "Profile", href: "/profile" });
    }

    const roleBadge = role === "admin" ? { label: "Admin", color: "bg-purple-600" }
        : role === "moderator" ? { label: "Mod", color: "bg-blue-600" }
        : null;

    return (
        <header className="fixed top-0 w-full z-50 bg-brand-bg/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm premium-gradient flex items-center justify-center shadow-lg shadow-brand-crimson/20">
                        <span className="material-symbols-outlined text-brand-ivory font-light">
                            account_balance_wallet
                        </span>
                    </div>
                    <span className="text-2xl font-serif font-black tracking-tight text-brand-ivory">
                        CircleSave
                    </span>
                </Link>

                {navLinks.length > 0 && (
                    <nav className="hidden lg:flex items-center gap-12">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-brand-gold transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                )}

                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            {/* Only customers get Connect Wallet */}
                            {!isStaff && <ConnectWallet />}

                            {roleBadge && (
                                <span className={`${roleBadge.color} text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full`}>
                                    {roleBadge.label}
                                </span>
                            )}
                            <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black ${
                                    role === "admin" ? "bg-purple-600" : role === "moderator" ? "bg-blue-600" : "premium-gradient"
                                }`}>
                                    {user?.fullName?.charAt(0) || "U"}
                                </div>
                                <span className="text-brand-ivory text-xs font-bold">{user?.fullName?.split(" ")[0]}</span>
                            </div>
                            <button
                                onClick={logout}
                                className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-brand-crimson transition-colors"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-brand-ivory hover:text-brand-gold transition-all">
                                Sign In
                            </Link>
                            <Link href="/signup" className="premium-gradient text-white text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-sm hover:brightness-110 transition-all shadow-xl shadow-brand-crimson/20">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
