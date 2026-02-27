"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_LINKS } from "@/lib/constants";

export default function Sidebar({ user }) {
    const pathname = usePathname();

    return (
        <aside className="w-72 border-r border-luxury-gold/10 flex flex-col justify-between p-8 bg-luxury-dark sticky top-0 h-screen">
            <div className="flex flex-col gap-10">
                <Link href="/" className="flex items-center gap-4">
                    <div className="bg-luxury-crimson rounded-lg p-2.5 flex items-center justify-center shadow-lg shadow-luxury-crimson/20">
                        <span className="material-symbols-outlined text-white text-2xl">
                            account_balance_wallet
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-luxury-cream text-xl font-extrabold tracking-tight">CircleSave</h1>
                        <p className="text-luxury-gold/60 text-[10px] uppercase tracking-widest font-bold">Premium Tier</p>
                    </div>
                </Link>

                <nav className="flex flex-col gap-2">
                    {SIDEBAR_LINKS.map((link) => {
                        const isActive = pathname === link.href && link.href !== "#";
                        return (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={`flex items-center gap-4 px-5 py-3.5 transition-all rounded-xl ${isActive ? "nav-item-active" : "text-luxury-gold hover:bg-luxury-gold/5"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl">{link.icon}</span>
                                <span className="text-sm font-semibold">{link.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="flex flex-col gap-6">
                <Link
                    href="/create/step-1"
                    className="w-full bg-luxury-crimson hover:bg-luxury-crimson/90 text-white rounded-xl py-4 font-bold text-sm shadow-xl shadow-luxury-crimson/10 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    Launch Circle
                </Link>

                {user && (
                    <div className="flex items-center gap-4 p-3 border border-luxury-gold/10 rounded-xl bg-luxury-gold/5">
                        <div className="size-11 rounded-full border-2 border-luxury-gold p-0.5">
                            <img alt={user.name} className="rounded-full w-full h-full object-cover" src={user.avatar} />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-xs font-bold text-luxury-cream">{user.name}</p>
                            <p className="text-[10px] text-luxury-gold">{user.tier}</p>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
