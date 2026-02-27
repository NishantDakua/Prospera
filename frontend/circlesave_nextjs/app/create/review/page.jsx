import Link from "next/link";

export const metadata = { title: "Circle Creation - Final Review | Prospera" };

export default function CreateReview() {
    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#201214] font-display text-slate-100">
            <div className="layout-container flex h-full grow flex-col">
                {/* Header */}
                <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/20 px-10 py-4 bg-[#201214]/50 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-wealth">
                            <span className="material-symbols-outlined">account_balance_wallet</span>
                        </div>
                        <h2 className="text-slate-100 text-xl font-bold leading-tight tracking-tight">Prospera</h2>
                    </div>
                    <div className="flex flex-1 justify-end gap-8">
                        <nav className="flex items-center gap-8">
                            <Link className="text-slate-300 hover:text-primary transition-colors text-sm font-medium" href="/dashboard">Dashboard</Link>
                            <a className="text-slate-100 text-sm font-bold border-b-2 border-primary pb-1" href="#">Circles</a>
                            <a className="text-slate-300 hover:text-primary transition-colors text-sm font-medium" href="#">Wealth</a>
                            <a className="text-slate-300 hover:text-primary transition-colors text-sm font-medium" href="#">Support</a>
                        </nav>
                        <div className="flex items-center gap-4">
                            <button className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all">
                                <span className="material-symbols-outlined">notifications</span>
                            </button>
                            <div className="size-10 rounded-full border-2 border-primary/30 overflow-hidden">
                                <img className="w-full h-full object-cover" alt="User profile avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEC5bRhiaHxlyWQIArcwhhuRXH4MLR592tFQyiMIgV2SLmOMLaEB31P4NDs7ImZaSkeV2we1ZvVHQD6uqJFVrn4EPd6aHn-Xyz8i3DV48IBQY76HqMtxs4XCHbJd8D-RyXnJGy0HKpt3X2FIt313T_vZWjM8hpRMfhp8A4imy4gUVqGrIId2NQh0y9S6oFnk-6ZQ5JeFfJpgIu1OglUDZy9OPQAO6mpjGmuxIrGdd6SwLUSJSkSuORRUdOqtMzmkdc3Hvsu0alze96" />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex flex-col items-center py-10 px-4">
                    <div className="w-full max-w-4xl">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 mb-8 justify-center">
                            <span className="text-primary/60 text-sm font-medium">Create Circle</span>
                            <span className="material-symbols-outlined text-xs text-primary/40">chevron_right</span>
                            <span className="text-primary/60 text-sm font-medium">Configuration</span>
                            <span className="material-symbols-outlined text-xs text-primary/40">chevron_right</span>
                            <span className="text-wealth text-sm font-bold bg-primary/20 px-3 py-1 rounded-full">Review &amp; Launch</span>
                        </div>

                        {/* Header Section */}
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/20 mb-4 border border-primary/30">
                                <span className="material-symbols-outlined text-primary text-4xl">verified</span>
                            </div>
                            <h1 className="text-slate-100 text-4xl font-black tracking-tight mb-2">Final Review</h1>
                            <p className="text-slate-400 text-lg">Your premium savings circle is almost ready to go live.</p>
                        </div>

                        {/* Summary Card */}
                        <div className="glass-card rounded-xl p-8 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Pool Summary */}
                                <div className="flex flex-col justify-center border-r border-primary/10 pr-8">
                                    <span className="text-primary font-bold uppercase tracking-widest text-xs mb-2">Total Pool Size</span>
                                    <h2 className="text-wealth text-6xl font-black mb-6">$120,000.00</h2>
                                    <div className="space-y-4">
                                        {[
                                            { icon: "event_repeat", label: "Monthly Contribution", value: "$10,000.00 / member" },
                                            { icon: "group", label: "Total Members", value: "12 Verified Members" },
                                            { icon: "calendar_month", label: "Circle Duration", value: "12 Months (Cycle Complete)" },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-accent">{item.icon}</span>
                                                <div>
                                                    <p className="text-slate-400 text-xs">{item.label}</p>
                                                    <p className="text-slate-100 font-bold">{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Visual + Schedule */}
                                <div className="space-y-6">
                                    <div className="relative h-48 rounded-lg overflow-hidden border border-primary/20">
                                        <img className="w-full h-full object-cover opacity-60" alt="Abstract golden geometric pattern" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCu2DSqdtvG54UWVo3FTnRh5ixqbEi1XXLNw9kvL12yMjOhxFq7bYhIHuWGrEKku2Q-sqbvrox7AcizIG4yqcyz4CVRuq06ctu0ZrTel-VVkuLsJmMKc1awgQwxYiocGoMpGuDbZnfL-V4yaqVEgxvbd2CZts0EEuWnu7HO9t5kMrfoMKyXknNio4_pwPyn7YIJtsNXdOYKFx_t9f1BGViLImSPIsH3vOJfeQ7ga6tmPjBzsS9MpEgoHFjS9BgecMUe14rp3vcE4K2" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#3F0D12] to-transparent"></div>
                                        <div className="absolute bottom-4 left-4">
                                            <h3 className="text-wealth text-xl font-bold">Elite Founders Circle</h3>
                                            <p className="text-slate-300 text-sm">Private High-Yield Collective</p>
                                        </div>
                                    </div>
                                    <div className="bg-primary/10 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-slate-100 font-bold">Schedule Preview</span>
                                            <button className="text-primary text-xs font-bold hover:underline">View All Dates</button>
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                { label: "First Contribution", date: "Oct 01, 2023" },
                                                { label: "First Payout (Member #1)", date: "Oct 05, 2023" },
                                                { label: "Last Payout", date: "Sep 05, 2024" },
                                            ].map((item, i) => (
                                                <div key={item.label} className={`flex justify-between items-center text-sm py-2 ${i < 2 ? "border-b border-primary/5" : ""}`}>
                                                    <span className="text-slate-400">{item.label}</span>
                                                    <span className="text-slate-100">{item.date}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-center gap-6">
                            <Link href="/dashboard" className="glow-button w-full md:w-[480px] h-14 bg-primary text-wealth rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-primary/90 transition-all border border-accent/20">
                                <span className="material-symbols-outlined">rocket_launch</span>
                                Confirm &amp; Launch Circle
                            </Link>
                            <div className="flex items-center gap-6">
                                <Link href="/create/step-2" className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                    Edit Details
                                </Link>
                                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                <button className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">download</span>
                                    Save PDF Draft
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="py-8 px-10 border-t border-primary/10 text-center">
                    <p className="text-slate-500 text-xs">
                        Prospera uses bank-grade encryption to secure your financial assets.<br />
                        Premium Savings Circle agreements are legally binding upon launch.
                    </p>
                </footer>
            </div>
        </div>
    );
}
