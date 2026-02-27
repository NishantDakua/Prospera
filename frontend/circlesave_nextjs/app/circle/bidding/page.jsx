import Link from "next/link";

export const metadata = { title: "Circle Detail & Bidding (Premium) | CircleSave" };

export default function BiddingPage() {
    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#0F0F14] font-display text-[#F1F0CC]">
            <div className="layout-container flex h-full grow flex-col">
                {/* Header */}
                <header className="flex items-center justify-between whitespace-nowrap border-b border-white/5 px-6 lg:px-20 py-5 bg-[#0F0F14]/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-gradient-to-br from-[#D5BF86] to-[#A71D31] rounded-xl flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined text-[#0F0F14] font-bold">toll</span>
                            </div>
                            <h2 className="text-white text-2xl font-extrabold tracking-tighter">CIRCLE<span className="text-gold-b">SAVE</span></h2>
                        </div>
                        <nav className="hidden lg:flex items-center gap-10">
                            <Link className="text-white/60 hover:text-[#D5BF86] transition-colors text-sm font-bold uppercase tracking-widest" href="/dashboard">Dashboard</Link>
                            <a className="text-[#D5BF86] text-sm font-bold uppercase tracking-widest border-b-2 border-[#D5BF86] pb-1" href="#">Circles</a>
                            <a className="text-white/60 hover:text-[#D5BF86] transition-colors text-sm font-bold uppercase tracking-widest" href="#">Bidding</a>
                            <Link className="text-white/60 hover:text-[#D5BF86] transition-colors text-sm font-bold uppercase tracking-widest" href="/profile">Vault</Link>
                        </nav>
                    </div>
                    <div className="flex gap-4 items-center">
                        <button className="flex items-center justify-center rounded-full size-10 bg-white/5 text-[#D5BF86] hover:bg-white/10 transition-colors border border-white/10">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <div className="size-10 rounded-full border-2 border-[#D5BF86] p-0.5">
                            <img className="w-full h-full rounded-full object-cover" alt="User profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAgciu0w_YpoptAl3lutucsMHJeQgECjrA2bg-ygnV4Z77sL2yNSyNAtMw-55iEGf41rR0Vt_mYBBiqsng8ovIPL99iZvsG6LPs2H1uY0eb0uEXMdBcnR75w9zJ8ugB6QLyTOf8Y7c3mkPcxxDmivjy6Gwp5z0hseIHl-Mqjzs7wae5FPripwLCmbjJ8krD_SkOXIGhKb6UYjGYBxQfeS-zfBg-vfXFcx0kN1Em9F-gdWCrQRgQ2W76Ff89uhDeMxLzolgCOh4QPb4" />
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-6 lg:px-20 py-10 max-w-[1440px] mx-auto w-full">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <nav className="flex gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-4">
                                <Link className="hover:text-[#D5BF86]" href="/dashboard">Executive</Link>
                                <span>/</span>
                                <Link className="hover:text-[#D5BF86]" href="/dashboard">Portfolios</Link>
                                <span>/</span>
                                <span className="text-[#D5BF86]">Tech Pioneers Elite</span>
                            </nav>
                            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">Tech Pioneers <span className="text-[#D5BF86]">Elite</span></h1>
                            <p className="text-[#F1F0CC]/60 mt-3 flex items-center gap-3 font-medium">
                                <span className="material-symbols-outlined text-[#D5BF86]">calendar_month</span>
                                High-Yield Monthly Cycle
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D5BF86]/30"></span>
                                <span className="text-[#D5BF86] font-bold tracking-wider">$50,000 Capital Pool</span>
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button className="flex items-center justify-center rounded-xl h-12 px-8 bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all uppercase tracking-wider text-sm">Configure</button>
                            <button className="flex items-center justify-center rounded-xl h-12 px-8 bg-[#A71D31] text-white font-black hover:brightness-110 transition-all shadow-2xl shadow-[#A71D31]/20 uppercase tracking-wider text-sm">
                                <span className="material-symbols-outlined mr-2 text-lg">person_add</span>
                                Invite Delegate
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {[
                                    { label: "Monthly Stake", value: "$5,000.00", sub: "↑ SECURED VIA SMART CONTRACT", subColor: "text-green-500" },
                                    { label: "Active Members", value: "10", valueSuffix: "/ 12" },
                                    { label: "Cycle Phase", value: "04", valueSuffix: "of 12" },
                                ].map((s) => (
                                    <div key={s.label} className="glass-card-bidding p-6 rounded-2xl">
                                        <p className="text-[#D5BF86]/60 text-xs font-black uppercase tracking-widest mb-2">{s.label}</p>
                                        <p className="text-white text-3xl font-black">
                                            {s.value}
                                            {s.valueSuffix && <span className="text-[#D5BF86]/40 text-xl font-bold"> {s.valueSuffix}</span>}
                                        </p>
                                        {s.sub && <div className={`mt-2 text-[10px] ${s.subColor} font-bold`}>{s.sub}</div>}
                                    </div>
                                ))}
                            </div>

                            {/* Tracker */}
                            <div className="glass-card-bidding p-8 rounded-3xl border-l-4 border-l-[#D5BF86]">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-2xl font-black text-white italic">Progression Tracker</h3>
                                    <span className="bg-[#D5BF86]/10 text-[#D5BF86] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-[#D5BF86]/20">Executive Cycle</span>
                                </div>
                                <div className="space-y-0 ml-4">
                                    {[
                                        { phase: "PHASE 01: Genesis Collection", recipient: "Alex Johnson", amount: "$48,500", done: true },
                                        { phase: "PHASE 02: Growth Round", recipient: "Sarah Kim", amount: "$49,000", done: true },
                                        { phase: "PHASE 03: Expansion", recipient: "Mike Lowery", amount: "$47,500", done: true },
                                        { phase: "PHASE 04: LIVE BIDDING OPEN", detail: "Market Intensity: High • Ends in 14h 22m", live: true },
                                    ].map((p, i) => (
                                        <div key={p.phase} className={`relative flex items-start gap-6 ${i < 3 ? "pb-12" : ""}`}>
                                            {p.live ? (
                                                <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#A71D31] text-white shrink-0 animate-pulse shadow-[0_0_20px_rgba(167,29,49,0.5)]">
                                                    <span className="material-symbols-outlined font-black">gavel</span>
                                                </div>
                                            ) : (
                                                <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#D5BF86] text-[#0F0F14] shrink-0 shadow-[0_0_15px_rgba(213,191,134,0.4)]">
                                                    <span className="material-symbols-outlined font-black">check</span>
                                                </div>
                                            )}
                                            {i < 3 && <div className={`absolute left-5 top-10 h-full w-0.5 ${i < 2 ? "progress-line" : "opacity-20 bg-[#D5BF86]"}`}></div>}
                                            <div className="flex-1 pt-1">
                                                {p.live ? (
                                                    <>
                                                        <p className="text-[#A71D31] font-black text-lg">{p.phase}</p>
                                                        <p className="text-[#F1F0CC]/60 font-medium">{p.detail}</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-white font-black text-lg">{p.phase}</p>
                                                        <p className="text-[#F1F0CC]/60 font-medium">Recipient: <span className="text-[#D5BF86]">{p.recipient}</span> • <span className="text-white">{p.amount} Settlement</span></p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Stakeholders */}
                            <div className="glass-card-bidding p-8 rounded-3xl">
                                <h3 className="text-2xl font-black text-white mb-8 italic">Circle Stakeholders</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { name: "Alex Johnson", sub: "Settled (Phase 1)", verified: true, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBH-F_bifYWLa0FApzr9orLaQE8yspvBx1l0hvsg4G5CfDzQxfiY9GxlliPohhnsSrcUatoyPuWZd0Pb6g7C20oNEp0AkvLgRiA79MflysHsrH2RM_NL_y4ql1yhCkyJZumv8HMSHrPs4j99_a0ZZSrCmvDomyDiQL27xdh75wcfBeNLm4xt6EaQifeB9lv2Y3RGfNHs9j0_HUNPEC1l-Pp8QZlz2BnL6e0Kyz6X2BHUVT81syfJPoAhGckvPNrBmSEi5ClRe6RVoQF" },
                                        { name: "Sarah Kim", sub: "Settled (Phase 2)", verified: true, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAH_sfU9rb9S49RPloYNjPDbEML6ZiWLI57ORINNshhBSzSsxuCyAsqFWtND7Yg51u7LII4zpxfWApzTJ_rv2aWgkajg10x6IZ5ma3iKXNR2kLfvanszY23dQAF4wjcrUQr-daZC8OOJCU55AvMKMXy3PDCrfIXLsEvw6EQNaIbab6IwEgpHww8RxezqUoME-XxvQ556nJ79Lu3bG5oX8wf8zGdNKOaTU5lpQWJM6UXU3dEoNNa18Z6ShGjgTXy2KeIk2wzpBWzy_Hr" },
                                    ].map((m) => (
                                        <div key={m.name} className="flex items-center justify-between p-5 rounded-2xl elevated-card border-l-2 border-[#D5BF86]/50">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all">
                                                    <img className="w-full h-full object-cover" alt={m.name} src={m.img} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-white uppercase tracking-tight">{m.name}</p>
                                                    <p className="text-[10px] text-[#D5BF86]/60 font-bold uppercase">{m.sub}</p>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-[#D5BF86]">verified</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-[#3F0D12] to-transparent border border-[#A71D31]/30">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl overflow-hidden border border-[#D5BF86]">
                                                <img className="w-full h-full object-cover" alt="You" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDthCgG2jPHcLVYO01es34BVe_A-2p7lF926VumJ8gPLENYTRUQVeawkrzwyF6ymch6sWmDNl2Lyw75enDnEbq4NBXKuLzii-EmGpXGN_w7fqbOn8rahfevDHUQGoGBNa-JMg3qCKhH3RrxmEM6KRzkfMT_fF6npADWtBP9gRq22eUhjuxXlDrd01VEWjMs0OqGg9_7htFzq46NxslnUU_qKB4N_fbRMCzYPm1V8Ku9ldhB7lX97x7zazdrv65zlXGuEVOix8ClIVrG" />
                                            </div>
                                            <div>
                                                <p className="font-black text-white uppercase tracking-tight">You <span className="text-[#F1F0CC]/40 text-xs">(Lead)</span></p>
                                                <p className="text-[10px] text-[#D5BF86]/60 font-bold uppercase">Equity: $20,000</p>
                                            </div>
                                        </div>
                                        <span className="bg-[#D5BF86] text-[#0F0F14] text-[9px] px-2 py-0.5 rounded-sm font-black uppercase">Active</span>
                                    </div>
                                    <div className="flex items-center justify-between p-5 rounded-2xl elevated-card border-l-2 border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl overflow-hidden opacity-50">
                                                <img className="w-full h-full object-cover" alt="Emily Chen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcpY0o1UwAM0hO_B-CY-n_UbAHqNe0yR-4V_RgjHNg7JWIuBbbE1SEIwcTbILrQptV3mDyXo1i7xT7viUWEanpD4CT10I0g019J_nidDWZXRjRFWgYOB2355RDojX7uP3iYueepBvysoShL4TrVDF0Aa8zPrgTw-XKyB2EK_raNRnSig2yGcA3t0swv81gRIVkQeColb0OpkvMU5evVdHcyXPI1vxs5rYcRQQzZvoeG8wai5TaCo2S3Qx5KogWNyYTV0bIc2LHKC-C" />
                                            </div>
                                            <div>
                                                <p className="font-black text-white/50 uppercase tracking-tight">Emily Chen</p>
                                                <p className="text-[10px] text-white/30 font-bold uppercase">Awaiting Round</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-white/20">pending</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* Bidding Panel */}
                            <div className="bg-[#A71D31] p-[1px] rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(167,29,49,0.3)]">
                                <div className="bg-[#0F0F14] p-8 rounded-[1.95rem] border border-white/5">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-2xl font-black text-white italic">Live Market</h3>
                                        <div className="flex items-center gap-2 bg-[#A71D31]/10 text-[#A71D31] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#A71D31]/20">
                                            <span className="size-2 bg-[#A71D31] rounded-full animate-ping"></span> TRADING
                                        </div>
                                    </div>
                                    <div className="text-center mb-10 bg-white/5 p-6 rounded-2xl border border-white/10 elevated-card">
                                        <p className="text-[#D5BF86]/40 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Current Highest Bid</p>
                                        <p className="text-5xl font-black text-white tracking-tighter">$1,450</p>
                                        <div className="h-px w-12 bg-[#D5BF86]/20 mx-auto my-4"></div>
                                        <p className="text-[#F1F0CC]/40 text-[11px] font-medium leading-relaxed italic">
                                            Projected Payout: <span className="text-white font-bold">$48,550.00</span>
                                        </p>
                                    </div>
                                    <div className="space-y-8">
                                        <div>
                                            <div className="flex justify-between items-end mb-6">
                                                <span className="text-[#D5BF86]/60 text-xs font-black uppercase tracking-widest">Your Position</span>
                                                <span className="text-[#D5BF86] font-black text-2xl tracking-tighter">$1,600.00</span>
                                            </div>
                                            <div className="relative h-2 rounded-full overflow-hidden bg-white/5">
                                                <input className="w-full h-full gradient-slider appearance-none cursor-pointer" max="5000" min="100" step="50" type="range" defaultValue="1600" />
                                            </div>
                                            <div className="flex justify-between text-[9px] text-white/30 mt-3 font-black uppercase tracking-widest">
                                                <span>Floor $100</span>
                                                <span>Ceiling $5,000</span>
                                            </div>
                                        </div>
                                        <div className="bg-[#3F0D12]/20 border border-[#A71D31]/20 p-5 rounded-2xl">
                                            <div className="flex items-start gap-3">
                                                <span className="material-symbols-outlined text-[#A71D31] font-bold">info</span>
                                                <p className="text-[11px] text-[#F1F0CC]/70 leading-relaxed">
                                                    Submitting a bid of <span className="text-white font-bold">$1,600.00</span> locks your stake for this round. Settlement occurs automatically upon cycle completion.
                                                </p>
                                            </div>
                                        </div>
                                        <button className="w-full bg-[#A71D31] hover:bg-[#8B1829] text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-[#A71D31]/30 flex items-center justify-center gap-3 uppercase tracking-[0.1em] text-sm">
                                            Confirm Bid Position <span className="material-symbols-outlined">gavel</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Market Volatility */}
                            <div className="glass-card-bidding p-6 rounded-3xl">
                                <h3 className="text-sm font-black text-[#D5BF86] uppercase tracking-widest mb-6">Market Volatility</h3>
                                <div className="h-32 w-full relative mb-6">
                                    <div className="absolute inset-0 flex items-end gap-2 px-1">
                                        {[
                                            "bg-[#D5BF86]/10 h-1/2",
                                            "bg-[#D5BF86]/20 h-2/3",
                                            "bg-[#D5BF86]/40 h-3/4",
                                            "bg-[#D5BF86] h-1/2",
                                            "bg-[#D5BF86]/20 h-1/3",
                                            "bg-[#A71D31]/60 h-3/5",
                                            "bg-[#A71D31] h-full",
                                        ].map((cls, i) => <div key={i} className={`${cls} w-full rounded-t-md`}></div>)}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-[#D5BF86]/40 uppercase">Total Capital Flow</span>
                                        <span className="text-white">$40,000.00</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-gradient-to-r from-[#D5BF86] to-[#A71D31] h-full w-[80%]"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Protocol Guide */}
                            <div className="relative overflow-hidden elevated-card p-8 rounded-3xl border border-white/5 group">
                                <div className="relative z-10">
                                    <h4 className="text-white font-black text-xl mb-3 italic">Protocol Guide</h4>
                                    <p className="text-[#F1F0CC]/40 text-sm mb-6 leading-relaxed">Master the art of high-frequency bidding within the CircleSave ecosystem.</p>
                                    <button className="text-[#D5BF86] text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 group-hover:gap-4 transition-all">
                                        Review Guidelines <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                </div>
                                <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-[#D5BF86]/5 text-9xl rotate-12 group-hover:scale-110 transition-transform duration-700">menu_book</span>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="border-t border-white/5 mt-20 py-12 px-6 lg:px-20 bg-black/40">
                    <div className="max-w-[1440px] mx-auto flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-6 opacity-30">
                            <span className="material-symbols-outlined text-[#D5BF86]">verified_user</span>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-white">Tier-1 Encryption Secured</p>
                        </div>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">© 2024 CircleSave Institutional. Private &amp; Confidential.</p>
                        <div className="flex justify-center gap-10 mt-8 text-[10px] font-black uppercase tracking-[0.2em]">
                            <a className="text-white/40 hover:text-[#D5BF86] transition-colors" href="#">Legal Policy</a>
                            <a className="text-white/40 hover:text-[#D5BF86] transition-colors" href="#">Privacy Protocol</a>
                            <a className="text-white/40 hover:text-[#D5BF86] transition-colors" href="#">Contact Concierge</a>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
