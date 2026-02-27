"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useWeb3 } from "@/context/Web3Provider";
import { useAuth } from "@/context/AuthProvider";
import useContract from "@/hooks/useContract";
import ConnectWallet from "@/views/ui/ConnectWallet";
import { fmtEthSymbol, shortenAddress, poolTypeName } from "@/lib/utils";

export default function ProfilePage() {
    const { address, isAdmin, wrongNetwork, walletConflict, contract } = useWeb3();
    const { user, role, isAdmin: isAdminRole, isModerator: isModRole, isVerified } = useAuth();
    const { getGroupCount, getGroupInfo, getGroupMembers, getMemberData } = useContract();

    const [myGroups, setMyGroups] = useState([]);
    const [totalContributed, setTotalContributed] = useState(0n);
    const [totalLoans, setTotalLoans] = useState(0);
    const [fetching, setFetching] = useState(true);
    const [linkedWallets, setLinkedWallets] = useState([]);
    const [walletActionLoading, setWalletActionLoading] = useState(false);

    const fetchLinkedWallets = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/wallet");
            if (res.ok) {
                const data = await res.json();
                setLinkedWallets(data.wallets || []);
            }
        } catch { /* ignore */ }
    }, []);

    const handleUnlinkWallet = async (walletAddress) => {
        if (!confirm(`Unlink wallet ${walletAddress}?`)) return;
        setWalletActionLoading(true);
        try {
            const res = await fetch("/api/auth/wallet", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress }),
            });
            if (res.ok) fetchLinkedWallets();
        } finally {
            setWalletActionLoading(false);
        }
    };

    const refresh = useCallback(async () => {
        if (!contract || !address) return;
        setFetching(true);
        try {
            const count = await getGroupCount();
            const groups = [];
            let contrib = 0n;
            let loans = 0;

            for (let i = 1; i <= count; i++) {
                const members = await getGroupMembers(i);
                const addrLower = address.toLowerCase();
                const isMember = members.some((m) => m.toLowerCase() === addrLower);
                if (!isMember) continue;

                const info = await getGroupInfo(i);
                const md = await getMemberData(i, address);
                contrib += md.totalContributed;
                if (md.hasActiveLoan) loans++;

                groups.push({ id: i, ...info, memberData: md });
            }

            setMyGroups(groups);
            setTotalContributed(contrib);
            setTotalLoans(loans);
        } catch (e) {
            console.error("Profile refresh:", e);
        } finally {
            setFetching(false);
        }
    }, [contract, address, getGroupCount, getGroupMembers, getGroupInfo, getMemberData]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        fetchLinkedWallets();
    }, [fetchLinkedWallets]);

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-luxury-dark text-luxury-cream font-display">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-luxury-gold/10 px-6 lg:px-24 py-5 bg-luxury-dark/80 sticky top-0 z-50 backdrop-blur-md">
                <div className="flex items-center gap-10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="size-10 flex items-center justify-center bg-luxury-crimson rounded-xl">
                            <span className="material-symbols-outlined text-white">account_balance_wallet</span>
                        </div>
                        <h2 className="text-luxury-cream text-2xl font-extrabold tracking-tight">CircleSave</h2>
                    </Link>
                </div>
                <ConnectWallet />
            </header>

            <main className="flex flex-1 flex-col lg:flex-row px-6 lg:px-24 py-12 gap-12">
                {/* Sidebar */}
                <aside className="w-full lg:w-72 flex flex-col gap-3">
                    <div className="mb-6">
                        <h3 className="text-luxury-gold/60 text-[10px] font-black uppercase tracking-[0.3em] px-4">Navigation</h3>
                    </div>
                    <Link className="flex items-center gap-4 px-5 py-4 rounded-xl text-luxury-gold hover:bg-luxury-gold/5 transition-all" href="/dashboard">
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-sm font-bold">Overview</span>
                    </Link>
                    <a className="flex items-center gap-4 px-5 py-4 rounded-xl bg-luxury-crimson text-white shadow-xl shadow-luxury-crimson/20" href="#">
                        <span className="material-symbols-outlined">shield_person</span>
                        <span className="text-sm font-bold">Profile</span>
                    </a>
                    {isAdminRole && (
                        <Link className="flex items-center gap-4 px-5 py-4 rounded-xl text-luxury-gold hover:bg-luxury-gold/5 transition-all" href="/create">
                            <span className="material-symbols-outlined">add_circle</span>
                            <span className="text-sm font-bold">Create Circle</span>
                        </Link>
                    )}
                    {isAdminRole && (
                        <Link className="flex items-center gap-4 px-5 py-4 rounded-xl text-luxury-gold hover:bg-luxury-gold/5 transition-all" href="/admin">
                            <span className="material-symbols-outlined">admin_panel_settings</span>
                            <span className="text-sm font-bold">Admin Console</span>
                        </Link>
                    )}
                    {isModRole && (
                        <Link className="flex items-center gap-4 px-5 py-4 rounded-xl text-luxury-gold hover:bg-luxury-gold/5 transition-all" href="/moderator">
                            <span className="material-symbols-outlined">shield_person</span>
                            <span className="text-sm font-bold">Mod Console</span>
                        </Link>
                    )}
                </aside>

                {/* Content */}
                <div className="flex-1 max-w-5xl">
                    <div className="mb-12">
                        <h1 className="text-luxury-cream text-4xl lg:text-5xl font-black tracking-tight mb-4">Wallet Profile</h1>
                        <p className="text-luxury-gold/60 text-lg max-w-2xl">Your on-chain identity and participation summary.</p>
                    </div>

                    {!address && (
                        <div className="luxury-glass p-12 rounded-custom text-center">
                            <span className="material-symbols-outlined text-6xl text-luxury-gold mb-4 block">account_balance_wallet</span>
                            <h3 className="text-2xl font-bold text-luxury-cream mb-2">Connect Your Wallet</h3>
                            <p className="text-luxury-gold/60 mb-6">Connect MetaMask to view your profile.</p>
                            <ConnectWallet />
                        </div>
                    )}

                    {address && (
                        <>
                            {/* Wallet Card */}
                            <section className="luxury-glass rounded-custom p-10 mb-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-luxury-crimson/10 blur-[100px] -mr-32 -mt-32" />
                                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                                    <div className="relative">
                                        <div className="size-32 rounded-full border-4 border-luxury-crimson/30 p-1 flex items-center justify-center bg-luxury-dark">
                                            <span className="material-symbols-outlined text-6xl text-luxury-gold">account_circle</span>
                                        </div>
                                        {isAdmin && (
                                            <span className="absolute bottom-1 right-1 bg-luxury-crimson text-white size-10 rounded-full flex items-center justify-center border-4 border-luxury-dark shadow-xl text-xs font-black">
                                                A
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
                                            <h2 className="text-luxury-cream text-2xl font-black font-mono tracking-tight">{shortenAddress(address)}</h2>
                                            {/* Auth role badge */}
                                            {isAdminRole && (
                                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-lg">
                                                    <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                                                    Admin
                                                </span>
                                            )}
                                            {isModRole && (
                                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-lg">
                                                    <span className="material-symbols-outlined text-[14px]">shield_person</span>
                                                    Moderator
                                                </span>
                                            )}
                                            {role === "customer" && (
                                                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-lg ${
                                                    isVerified ? "bg-emerald-600" : "bg-amber-600"
                                                }`}>
                                                    <span className="material-symbols-outlined text-[14px]">{isVerified ? "verified" : "pending"}</span>
                                                    {isVerified ? "Verified Customer" : "Pending Verification"}
                                                </span>
                                            )}
                                            {/* On-chain admin indicator */}
                                            {isAdmin && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-luxury-crimson/20 text-luxury-crimson text-[10px] font-black uppercase tracking-widest border border-luxury-crimson/30">
                                                    <span className="material-symbols-outlined text-[14px]">token</span>
                                                    Contract Owner
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-luxury-gold/60 font-mono text-xs break-all">{address}</p>
                                        {user?.email && (
                                            <p className="text-luxury-gold/40 text-xs mt-1">{user.email}</p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Wallet conflict warning */}
                            {walletConflict && (
                                <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4">
                                    <span className="material-symbols-outlined text-red-400 text-3xl mt-0.5">link_off</span>
                                    <div>
                                        <p className="text-red-300 font-black text-sm uppercase tracking-widest mb-1">Wallet Already Linked to Another Account</p>
                                        <p className="text-slate-400 text-sm">
                                            The wallet <span className="text-white font-mono">{shortenAddress(address)}</span> is registered to a different account.
                                            You can use it to browse, but it cannot be used for transactions on this account.
                                            Please switch to a different wallet address.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Linked Wallets Section */}
                            <section className="luxury-glass p-8 rounded-custom mb-12">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-luxury-cream tracking-tight flex items-center gap-3">
                                        <span className="material-symbols-outlined text-luxury-gold">account_balance_wallet</span>
                                        Linked Wallets
                                    </h3>
                                    <span className="text-luxury-gold/40 text-xs font-bold uppercase tracking-widest">
                                        {linkedWallets.length} wallet{linkedWallets.length !== 1 ? "s" : ""} linked
                                    </span>
                                </div>

                                <div className="mb-4 bg-white/[0.02] border border-white/5 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3">
                                    <span className="material-symbols-outlined text-luxury-gold text-base mt-0.5">info</span>
                                    <span>
                                        One account can link <strong className="text-white">multiple wallets</strong>.
                                        Each wallet address can only belong to <strong className="text-white">one account</strong>.
                                        Connect a wallet via MetaMask and it will be automatically linked.
                                    </span>
                                </div>

                                {linkedWallets.length === 0 ? (
                                    <div className="text-center py-8">
                                        <span className="material-symbols-outlined text-4xl text-luxury-gold/20 mb-3 block">wallet</span>
                                        <p className="text-slate-400 text-sm">No wallets linked yet.</p>
                                        <p className="text-slate-500 text-xs mt-1">Connect your MetaMask above to link your first wallet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {linkedWallets.map((w) => {
                                            const isActive = address?.toLowerCase() === w.wallet_address;
                                            return (
                                                <div
                                                    key={w.wallet_address}
                                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                                        isActive
                                                            ? "border-luxury-gold/30 bg-luxury-gold/5"
                                                            : "border-white/5 bg-white/[0.02]"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
                                                        <div>
                                                            <p className="font-mono text-sm text-luxury-cream">{w.wallet_address}</p>
                                                            <p className="text-xs text-luxury-gold/40 mt-0.5">
                                                                {isActive && <span className="text-emerald-400 font-bold mr-2">● Active</span>}
                                                                Linked {new Date(w.linked_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleUnlinkWallet(w.wallet_address)}
                                                        disabled={walletActionLoading || isActive}
                                                        title={isActive ? "Cannot remove currently active wallet" : "Unlink wallet"}
                                                        className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">link_off</span>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                                <div className="luxury-glass p-8 flex flex-col gap-3 rounded-custom">
                                    <p className="text-luxury-gold/60 text-xs font-bold uppercase tracking-widest">Circles Joined</p>
                                    <p className="text-4xl font-extrabold text-luxury-cream">{myGroups.length}</p>
                                </div>
                                <div className="luxury-glass p-8 flex flex-col gap-3 rounded-custom">
                                    <p className="text-luxury-gold/60 text-xs font-bold uppercase tracking-widest">Total Contributed</p>
                                    <p className="text-4xl font-extrabold text-luxury-cream">{fmtEthSymbol(totalContributed)}</p>
                                </div>
                                <div className="luxury-glass p-8 flex flex-col gap-3 rounded-custom">
                                    <p className="text-luxury-gold/60 text-xs font-bold uppercase tracking-widest">Active Loans</p>
                                    <p className="text-4xl font-extrabold text-luxury-cream">{totalLoans}</p>
                                </div>
                            </div>

                            {/* My Circles Detail */}
                            <section className="luxury-glass p-8 rounded-custom">
                                <h3 className="text-xl font-bold text-luxury-cream mb-8 tracking-tight">My Circle Participation</h3>
                                {fetching ? (
                                    <div className="flex items-center justify-center py-12">
                                        <span className="material-symbols-outlined text-4xl text-luxury-gold animate-spin">progress_activity</span>
                                    </div>
                                ) : myGroups.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-slate-400 mb-4">You haven&apos;t joined any circles yet.</p>
                                        <Link href="/dashboard" className="text-luxury-gold text-sm font-bold hover:underline">Browse Circles →</Link>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {myGroups.map((g) => (
                                            <Link
                                                key={g.id}
                                                href={`/circle/${g.id}`}
                                                className="block p-6 rounded-xl border border-luxury-gold/10 hover:border-luxury-gold/30 bg-luxury-gold/[0.02] hover:bg-luxury-gold/5 transition-all"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-12 rounded-lg bg-luxury-crimson/10 flex items-center justify-center border border-luxury-crimson/20">
                                                            <span className="material-symbols-outlined text-luxury-crimson">groups</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-luxury-cream font-bold">Circle #{g.id}</p>
                                                            <p className="text-luxury-gold/60 text-xs">{poolTypeName(g.poolType)} • {g.memberCount}/{g.maxMembers} members</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-8 text-sm">
                                                        <div>
                                                            <p className="text-luxury-gold/40 text-[10px] uppercase tracking-widest">Contributed</p>
                                                            <p className="text-luxury-cream font-bold">{fmtEthSymbol(g.memberData.totalContributed)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-luxury-gold/40 text-[10px] uppercase tracking-widest">Loan</p>
                                                            <p className="text-luxury-cream font-bold">
                                                                {g.memberData.hasActiveLoan ? fmtEthSymbol(g.memberData.loanAmount) : "None"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-luxury-gold/40 text-[10px] uppercase tracking-widest">Round</p>
                                                            <p className="text-luxury-cream font-bold">{g.currentRound}</p>
                                                        </div>
                                                        <span className="material-symbols-outlined text-luxury-gold">arrow_forward</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Network Info */}
                            <section className="mt-12 luxury-glass p-8 rounded-custom">
                                <h3 className="text-xl font-bold text-luxury-cream mb-6 tracking-tight">Account Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 rounded-xl border border-luxury-gold/10">
                                        <p className="text-luxury-gold/40 text-[10px] uppercase tracking-widest mb-2">Connected Network</p>
                                        <p className="text-luxury-cream font-bold">{wrongNetwork ? "⚠️ Wrong Network" : "Anvil Local (31337)"}</p>
                                    </div>
                                    <div className="p-6 rounded-xl border border-luxury-gold/10">
                                        <p className="text-luxury-gold/40 text-[10px] uppercase tracking-widest mb-2">Platform Role</p>
                                        <p className={`font-bold capitalize ${
                                            isAdminRole ? "text-purple-400" : isModRole ? "text-blue-400" : "text-luxury-cream"
                                        }`}>{role || "—"}</p>
                                    </div>
                                    <div className="p-6 rounded-xl border border-luxury-gold/10">
                                        <p className="text-luxury-gold/40 text-[10px] uppercase tracking-widest mb-2">Verification</p>
                                        <p className={`font-bold ${
                                            isVerified ? "text-emerald-400" : "text-amber-400"
                                        }`}>
                                            {isAdminRole || isModRole ? "Auto-Verified (Staff)" : isVerified ? "✓ KYC Approved" : "⏳ Pending"}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </main>

            <footer className="px-6 lg:px-24 py-12 border-t border-luxury-gold/10 mt-20">
                <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-3 opacity-80">
                        <span className="material-symbols-outlined text-luxury-crimson">account_balance_wallet</span>
                        <span className="text-[10px] font-black text-luxury-gold uppercase tracking-[0.4em]">CircleSave On-Chain © 2024</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
