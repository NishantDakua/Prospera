import Link from "next/link";
import Navbar from "@/views/layout/Navbar";
import Footer from "@/views/layout/Footer";
import GlassSurface from "@/views/ui/GlassSurface";
import { getLandingData } from "@/controllers/landingController";

export default function LandingPage() {
    // ── Controller call ────────────────────────────────────────────────────
    const { features, heroUsers, portfolioItems, totalAssets, cumulativeSavings } =
        getLandingData();

    return (
        <div className="relative min-h-screen flex flex-col">
            {/* Background video */}
            <video id="bg-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
                <source src="/video/bg.mp4" type="video/mp4" />
                <source src="/video/bg.webm" type="video/webm" />
            </video>

            {/* ── VIEW ──────────────────────────────────────────────────── */}
            <Navbar />

            <main className="flex-1">
                {/* Hero */}
                <section className="relative pt-48 pb-32 overflow-hidden">
                    <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-brand-crimson/5 blur-[160px] rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-brand-gold/5 blur-[140px] rounded-full -translate-x-1/2 translate-y-1/2" />

                    <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-24 items-center">
                        {/* Copy */}
                        <div className="flex flex-col gap-10">
                            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-brand-gold/5 border border-brand-gold/20 text-brand-gold text-[10px] font-bold uppercase tracking-[0.2em]">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
                                Elite Wealth Management
                            </div>
                            <h1 className="text-7xl md:text-8xl font-serif font-black leading-[0.95] tracking-tighter text-brand-ivory">
                                Save Together.<br />
                                <span className="text-gold-gradient">Win Smarter.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-400 max-w-lg leading-relaxed font-light">
                                Step into the future of social finance. A bespoke environment for high-trust circles to accumulate wealth and secure premium payouts with mathematical precision.
                            </p>
                            <div className="flex flex-wrap gap-6 pt-4">
                                <Link href="/create" className="premium-gradient text-white font-bold uppercase tracking-widest px-10 py-5 rounded-sm text-sm flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-95 shadow-2xl shadow-brand-crimson/30">
                                    Create Your Circle <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                                <Link href="/dashboard" className="glass-card hover:bg-white/10 text-brand-ivory font-bold uppercase tracking-widest px-10 py-5 rounded-sm text-sm transition-all gold-border-subtle">
                                    Explore Circles
                                </Link>
                            </div>
                            <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                                <div className="flex -space-x-4">
                                    {heroUsers.map((src, i) => (
                                        <img key={i} alt={`User ${i + 1}`} className="w-12 h-12 rounded-full border-2 border-brand-bg object-cover" src={src} />
                                    ))}
                                </div>
                                <p className="text-xs uppercase tracking-widest font-bold text-slate-500">
                                    Managing <span className="text-brand-gold">{totalAssets}</span> in assets
                                </p>
                            </div>
                        </div>

                        {/* Portfolio preview card */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-brand-crimson/20 to-brand-gold/20 blur opacity-25 group-hover:opacity-40 transition duration-1000" />
                            <div className="glass-card rounded-2xl p-8 relative overflow-hidden border border-white/10">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-brand-ivory font-serif text-xl font-bold">Portfolio Overview</h3>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Real-time circle analytics</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-brand-crimson/10 flex items-center justify-center text-brand-crimson border border-brand-crimson/20">
                                        <span className="material-symbols-outlined text-xl">account_balance</span>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {portfolioItems.map((item) => (
                                        <div key={item.name} className="bg-white/[0.02] rounded-xl p-5 border border-white/5 hover:border-brand-gold/20 transition-all">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${item.iconBg}`}>
                                                        <span className="material-symbols-outlined">{item.icon}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-brand-ivory">{item.name}</p>
                                                        <p className="text-[10px] uppercase tracking-tighter text-slate-500">{item.tag}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-brand-gold">{item.amount}</p>
                                                    <p className={`text-[9px] uppercase tracking-widest font-bold ${item.statusColor}`}>{item.status}</p>
                                                </div>
                                            </div>
                                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                                <div className={`${item.bar} h-full`} style={{ width: item.progress }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/10">
                                            <span className="material-symbols-outlined text-lg">payments</span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Cumulative Savings</p>
                                            <p className="text-lg font-serif font-bold text-brand-ivory">{cumulativeSavings}</p>
                                        </div>
                                    </div>
                                    <div className="h-12 w-28 opacity-60">
                                        <svg className="w-full h-full stroke-brand-gold fill-none stroke-[1.5]" viewBox="0 0 100 30">
                                            <path d="M0 28 Q 10 25, 20 27 T 40 15 T 60 22 T 80 8 T 100 12" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            {/* Floating badge */}
                            <div className="absolute -bottom-8 -left-8 glass-card p-5 rounded-xl flex items-center gap-4 gold-border-subtle shadow-2xl">
                                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                    <span className="material-symbols-outlined">check_circle</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-brand-ivory">Premium Payout Disbursed</p>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500">TXN: #CS-8921-XPR</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="max-w-7xl mx-auto px-8 py-40 border-t border-white/5">
                    <div className="text-center mb-24">
                        <h2 className="text-brand-gold font-bold tracking-[0.4em] uppercase text-[10px] mb-4">Unparalleled Standards</h2>
                        <h3 className="text-5xl md:text-6xl font-serif font-black text-brand-ivory mb-6">Designed for the Discerning.</h3>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                            Prospera redefines group economics with institutional-grade security and a user experience tailored for wealth builders.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((f) => (
                            <div key={f.title} className="glass-card group p-10 rounded-sm hover:bg-white/[0.05] transition-all gold-border-subtle">
                                <div className="w-16 h-16 rounded-sm bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-8 group-hover:scale-110 transition-transform duration-500 border border-brand-gold/20">
                                    <span className="material-symbols-outlined text-3xl font-light">{f.icon}</span>
                                </div>
                                <h4 className="text-lg font-serif font-bold mb-4 text-brand-ivory tracking-wide">{f.title}</h4>
                                <p className="text-slate-400 text-sm leading-relaxed font-light">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Glass Surface */}
                <section className="max-w-7xl mx-auto px-8 pb-32">
                    <GlassSurface id="landing-cta" minHeight={340}>
                        <div className="py-16 px-8 md:px-24 text-center w-full">
                            <div className="max-w-3xl mx-auto flex flex-col items-center gap-10">
                                <h2 className="text-5xl md:text-7xl font-serif font-black leading-[1.1] text-brand-ivory">Begin Your Legacy.</h2>
                                <p className="text-lg md:text-xl text-brand-ivory/70 font-light max-w-xl">
                                    Join the exclusive network of collaborative savers building substantial wealth through disciplined group economics.
                                </p>
                                <div className="flex flex-wrap justify-center gap-6 mt-4">
                                    <Link href="/signup" className="bg-brand-ivory text-brand-deep hover:bg-white font-bold uppercase tracking-widest px-12 py-6 rounded-sm text-sm transition-all shadow-2xl">
                                        Get Started
                                    </Link>
                                    <Link href="/login" className="bg-transparent hover:bg-white/10 text-brand-ivory font-bold uppercase tracking-widest px-12 py-6 rounded-sm text-sm transition-all border border-brand-ivory/30">
                                        Sign In
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </GlassSurface>
                </section>
            </main>

            <Footer />
        </div>
    );
}
