import Link from "next/link";

export const metadata = { title: "Circle Creation Wizard - Step 1 | Prospera" };

export default function CreateStep1() {
    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-dark font-display text-slate-100">
            {/* Decorative backgrounds */}
            <div className="fixed top-0 right-0 -z-10 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full"></div>
            <div className="fixed bottom-0 left-0 -z-10 w-1/3 h-1/3 bg-accent-gold/5 blur-[100px] rounded-full"></div>

            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/20 px-10 py-4 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="size-8 bg-primary rounded flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                    </div>
                    <h2 className="text-slate-100 text-xl font-extrabold leading-tight tracking-tight uppercase">Prospera</h2>
                </div>
                <nav className="hidden md:flex items-center gap-8">
                    <Link className="text-slate-400 hover:text-primary transition-colors text-sm font-semibold uppercase tracking-wider" href="/dashboard">Dashboard</Link>
                    <a className="text-slate-100 text-sm font-semibold uppercase tracking-wider border-b-2 border-primary pb-1" href="#">My Circles</a>
                    <a className="text-slate-400 hover:text-primary transition-colors text-sm font-semibold uppercase tracking-wider" href="#">Investments</a>
                    <Link className="text-slate-400 hover:text-primary transition-colors text-sm font-semibold uppercase tracking-wider" href="/profile">Settings</Link>
                </nav>
                <div className="flex items-center gap-4">
                    <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-white/5 text-slate-300 hover:bg-primary/20 transition-all">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <div className="h-10 w-10 rounded-full overflow-hidden border border-primary/30">
                        <img className="w-full h-full object-cover" alt="User profile avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdYMKq0IokMfo79OSimuqLCCebFmeWDeGeA3pTzvp8LGoXYpqBPzcl9l-HSwYowKk3ZqYwNJSW1bPgehtj2IeeYzFklUjmnBNZDuTwHCyrqdskDbUpMaJJyVC6fOp9GL-CGXXZpLpUm635y3DwEK1hBZnuKQGA6P82C-0vAl3ZWeRacntmxJOh6IHl8OFK3vmcabZj-7xloHRSRzDKP5vvJ_Xhl5ZLTtJL8MaC1dF_CmA68zDQyLI0ehTMBfg-JwNZKU9Vw1x-Qi_9" />
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <div className="w-full max-w-2xl">
                    {/* Progress Stepper */}
                    <div className="mb-10 px-4">
                        <div className="flex justify-between items-end mb-3">
                            <div>
                                <span className="text-primary font-bold text-xs uppercase tracking-widest">Step 1 of 3</span>
                                <h3 className="text-slate-100 text-lg font-bold">Basic Details</h3>
                            </div>
                            <span className="text-slate-400 text-sm font-medium">33% Completed</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full step-gradient rounded-full" style={{ width: "33%" }}></div>
                        </div>
                    </div>

                    {/* Card */}
                    <div className="glass-panel-wizard rounded-xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <span className="material-symbols-outlined text-9xl">group_add</span>
                        </div>
                        <div className="relative z-10">
                            <div className="mb-8">
                                <h1 className="text-3xl font-extrabold text-slate-100 mb-2">Create Your Circle</h1>
                                <p className="text-slate-400">Establish the foundation for your premium savings community.</p>
                            </div>
                            <form className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Circle Name</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="e.g., Global Ventures Elite" type="text" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Monthly Contribution</label>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-4 text-accent-gold"><span className="material-symbols-outlined">payments</span></div>
                                            <input className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-4 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="0.00" type="number" />
                                            <div className="absolute right-4 text-slate-500 font-bold text-sm">USD</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Duration (Months)</label>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-4 text-slate-500"><span className="material-symbols-outlined">calendar_today</span></div>
                                            <select className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-4 text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none appearance-none cursor-pointer">
                                                <option className="bg-background-dark">6 Months</option>
                                                <option className="bg-background-dark" defaultValue>12 Months</option>
                                                <option className="bg-background-dark">18 Months</option>
                                                <option className="bg-background-dark">24 Months</option>
                                            </select>
                                            <div className="absolute right-4 pointer-events-none"><span className="material-symbols-outlined text-slate-500">expand_more</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Purpose (Optional)</label>
                                    <textarea className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none" placeholder="Describe the goal of this circle..." rows={2}></textarea>
                                </div>
                                <div className="pt-6 flex items-center justify-between">
                                    <Link href="/dashboard" className="text-slate-400 hover:text-slate-100 transition-colors font-bold uppercase text-sm tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                                        Cancel
                                    </Link>
                                    <Link href="/create/step-2" className="bg-primary hover:bg-primary/90 text-white font-bold uppercase text-sm tracking-widest px-10 py-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-3">
                                        Next Step
                                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-8 flex items-center justify-center gap-8 text-slate-500 text-xs uppercase tracking-widest font-bold">
                        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-primary">verified_user</span>Secure Protocol</div>
                        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-primary">encrypted</span>End-to-End Encrypted</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
