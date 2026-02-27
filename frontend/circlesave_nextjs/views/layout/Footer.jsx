import Link from "next/link";
import { FOOTER_COLUMNS, BRAND } from "@/lib/constants";

export default function Footer() {
    return (
        <footer className="bg-brand-bg pt-24 pb-12 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-8">
                <div className="grid md:grid-cols-4 gap-16 mb-20">
                    <div className="flex flex-col gap-8">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-sm premium-gradient flex items-center justify-center text-brand-ivory shadow-lg">
                                <span className="material-symbols-outlined text-lg font-light">
                                    account_balance_wallet
                                </span>
                            </div>
                            <span className="text-xl font-serif font-black text-brand-ivory">
                                {BRAND.name}
                            </span>
                        </Link>
                        <p className="text-slate-500 text-sm leading-relaxed font-light">
                            {BRAND.description}
                        </p>
                        <div className="flex gap-6">
                            <a className="text-slate-600 hover:text-brand-gold transition-colors" href="#" aria-label="Share">
                                <span className="material-symbols-outlined font-light">share</span>
                            </a>
                            <a className="text-slate-600 hover:text-brand-gold transition-colors" href="#" aria-label="Website">
                                <span className="material-symbols-outlined font-light">public</span>
                            </a>
                        </div>
                    </div>

                    {FOOTER_COLUMNS.map((col) => (
                        <div key={col.title}>
                            <h5 className="text-xs font-bold uppercase tracking-[0.3em] mb-8 text-brand-ivory">
                                {col.title}
                            </h5>
                            <ul className="flex flex-col gap-5 text-xs font-bold uppercase tracking-widest text-slate-500">
                                {col.links.map((l) => (
                                    <li key={l}>
                                        <a className="hover:text-brand-gold transition-colors" href="#">
                                            {l}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-600 font-bold">
                        © 2024 Prospera Wealth Technologies.
                    </p>
                    <div className="flex gap-8">
                        {["New York", "London", "Dubai"].map((city) => (
                            <span key={city} className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold">
                                {city}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
