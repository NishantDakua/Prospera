import Link from "next/link";

export const metadata = { title: "Circle Creation Wizard - Step 2 | CircleSave" };

export default function CreateStep2() {
    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-dark font-display text-text-ivory">
            <div className="layout-container flex h-full grow flex-col">
                {/* Header */}
                <header className="flex items-center justify-between border-b border-primary/20 px-10 py-4 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="text-primary size-8">
                            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fillRule="evenodd"></path>
                            </svg>
                        </div>
                        <h2 className="text-text-ivory text-xl font-extrabold tracking-tight">CircleSave</h2>
                    </div>
                    <div className="flex items-center gap-10">
                        <nav className="hidden md:flex items-center gap-8">
                            <Link className="text-text-ivory/60 hover:text-primary transition-colors text-sm font-semibold" href="/dashboard">Dashboard</Link>
                            <a className="text-primary text-sm font-semibold" href="#">Circles</a>
                            <a className="text-text-ivory/60 hover:text-primary transition-colors text-sm font-semibold" href="#">Investments</a>
                            <Link className="text-text-ivory/60 hover:text-primary transition-colors text-sm font-semibold" href="/profile">Account</Link>
                        </nav>
                        <div className="flex gap-3">
                            <button className="flex items-center justify-center rounded-xl size-10 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
                                <span className="material-symbols-outlined text-[20px]">notifications</span>
                            </button>
                            <div className="rounded-full border-2 border-accent-gold/30 p-0.5">
                                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuByoMnqAzvk_UOpaaULY7IaVXirRUF6UixX7pMXlee0tDaYQaRpgEHsJNERSaHQ1cuGuHSOLIpnQIB73O-MJWPhDQguhK1WDaPeKrRu4lpypWoYPBBirDSk77iJFRIdxtjVJcwmOVqfoTAcpqVv5P1oqtmF5ikBw0MY3SckO5y1oTyKv6JX2lLzQ-JDjFdg08dgOuTBnUcqraOGfdKCUBC9LNwaluTg_ktlg6svkjiUrlCi-l2Pxk9rh3xq0BHjjiPMT1u0ae1ea2Xq")` }}></div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex flex-col items-center py-12 px-4">
                    <div className="max-w-[800px] w-full space-y-8">
                        {/* Wizard Header */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-accent-gold text-sm font-bold uppercase tracking-widest">
                                <span>Step 2 of 4</span>
                                <div className="h-1 w-24 bg-primary/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-1/2"></div>
                                </div>
                            </div>
                            <h1 className="text-text-ivory text-4xl font-black leading-tight tracking-tight">Member Invitations</h1>
                            <p className="text-accent-gold/70 text-lg">Build your trusted circle. Add members who share your financial goals.</p>
                        </div>

                        {/* Invitation Controls */}
                        <div className="glass-card-alt rounded-xl p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="text-text-ivory font-semibold text-sm">Invite via Email Address</label>
                                <div className="flex gap-3">
                                    <div className="flex-1 relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-accent-gold/50 group-focus-within:text-primary transition-colors">mail</span>
                                        <input className="w-full bg-background-dark border border-accent-gold/20 rounded-xl py-4 pl-12 pr-4 text-text-ivory focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-accent-gold/30 transition-all outline-none" placeholder="Enter colleague or friend's email..." type="email" />
                                    </div>
                                    <button className="gradient-primary px-8 rounded-xl font-bold text-white hover:opacity-90 transition-opacity flex items-center gap-2">
                                        <span className="material-symbols-outlined">person_add</span>
                                        Add
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 py-4">
                                <div className="h-px flex-1 bg-accent-gold/10"></div>
                                <span className="text-accent-gold/40 text-xs font-bold uppercase">or</span>
                                <div className="h-px flex-1 bg-accent-gold/10"></div>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <button className="flex-1 flex items-center justify-center gap-3 bg-primary/10 border border-primary/30 py-4 rounded-xl hover:bg-primary/20 transition-all group">
                                    <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">contact_page</span>
                                    <span className="text-text-ivory font-semibold">Sync Contacts</span>
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-3 bg-primary/10 border border-primary/30 py-4 rounded-xl hover:bg-primary/20 transition-all group">
                                    <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">link</span>
                                    <span className="text-text-ivory font-semibold">Copy Invite Link</span>
                                </button>
                            </div>
                        </div>

                        {/* Member List */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end px-2">
                                <h3 className="text-text-ivory font-bold text-xl">Invited Members (3)</h3>
                                <span className="text-accent-gold text-sm">Maximum 12 members</span>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { name: "Sarah Jenkins", email: "sarah.j@enterprise.com", status: "Pending", statusColor: "bg-primary/20 text-primary", avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDufMnV4UydXGCDq11rOKQNfMm1wPPokkowi9rqEudx5PjuslGmWFHWbzP1jVx5nDa5mkWohfHvn4tJoEoiJpEjErLZ4EP-aThL5TOftDNw3-RqoPrCVjenC5RurVKLOutW0AL_RyRyEs_PjAMTwbMvn0nFjcooaFm6uqeNdhDGvAIr8ncKkCzGON1qPN5BG-PqA2A5smqCNgiqYDHMexzm5_RDRESTLF5lyRMp2q0Nfgi7ARQBxoH2BMnPE12qMgfy2JnnxaItpa_8", borderAccent: "border-l-primary" },
                                    { name: "Michael Chen", email: "m.chen@fintech.io", status: "Accepted", statusColor: "bg-emerald-500/10 text-emerald-500", avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuClYbK8CHZn1xPC2tn0PPAfs2NuXqugUHmh-Cj7ZTcWghq6W_na4HC8DaLhjnNm1L2bvMm21_tR9OGjxm6G_yXAWTI8lHs407PORGksOk4r0r2ASn-OJJ-t4F5CM3HWmvnQz12cKSds8YtR3TusEKVZ5eU0iJIaGuJlkRhvdUPlsh89teI-OLXDGwzPmP0G34YLcOLqRfsm1-NMFi4eSlsms9YgeQ1CQJ8Y_CaWBTsVcsWtsCAOJMLokNCg5X4gs1ojhhuVb711Q8IT", borderAccent: "border-l-primary/30" },
                                    { name: "Alex Morgan", email: "alex@nexus.com", initials: "AM", status: "Pending", statusColor: "bg-primary/20 text-primary", borderAccent: "border-l-primary/30" },
                                ].map((m) => (
                                    <div key={m.name} className={`glass-card-alt flex items-center justify-between p-4 rounded-xl border-l-4 ${m.borderAccent} transition-all hover:bg-primary/10`}>
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-full border border-accent-gold/20 p-0.5 overflow-hidden">
                                                {m.avatarUrl ? (
                                                    <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${m.avatarUrl}')` }}></div>
                                                ) : (
                                                    <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                                                        <span className="text-primary font-bold">{m.initials}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-text-ivory font-bold">{m.name}</h4>
                                                <p className="text-accent-gold text-xs">{m.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`${m.statusColor} text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider`}>{m.status}</span>
                                            <button className="text-accent-gold/40 hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Privacy Setting */}
                        <div className="glass-card-alt rounded-xl p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">lock</span>
                                </div>
                                <div>
                                    <h4 className="text-text-ivory font-bold">Privacy Settings</h4>
                                    <p className="text-accent-gold text-xs">Keep this circle private to invited members only.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-accent-gold/60">Public</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input defaultChecked className="sr-only peer" type="checkbox" />
                                    <div className="w-11 h-6 bg-accent-gold/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                                <span className="text-xs font-bold text-text-ivory">Private</span>
                            </div>
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex items-center justify-between pt-8 border-t border-accent-gold/10">
                            <Link href="/create/step-1" className="px-8 py-3 rounded-xl border border-accent-gold/30 text-accent-gold font-bold hover:bg-accent-gold/5 transition-all flex items-center gap-2">
                                <span className="material-symbols-outlined">arrow_back</span>
                                Back
                            </Link>
                            <Link href="/create/review" className="gradient-primary px-12 py-3 rounded-xl text-white font-bold hover:shadow-[0_0_20px_rgba(165,29,49,0.4)] transition-all flex items-center gap-2">
                                Continue
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </main>

                <footer className="py-6 px-10 text-center border-t border-accent-gold/5">
                    <p className="text-accent-gold/30 text-xs">© 2024 CircleSave Premium Fintech. Secure &amp; Encrypted.</p>
                </footer>
            </div>
        </div>
    );
}
