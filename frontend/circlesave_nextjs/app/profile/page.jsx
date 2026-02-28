"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWeb3 } from "@/context/Web3Provider";
import { useAuth } from "@/context/AuthProvider";
import useContract from "@/hooks/useContract";
import ConnectWallet from "@/views/ui/ConnectWallet";
import { fmtEth, fmtEthSymbol, shortenAddress, poolTypeName } from "@/lib/utils";
import { exportTransactionsPDF } from "@/lib/exportPdf";
import { TrustScoreCard, TrustScoreBadge, useTrustScore } from "@/components/TrustScore";

/** Transaction display metadata */
const TX_META = {
    join:       { icon: "person_add",         bg: "bg-blue-500/15 text-blue-400",      label: () => "Joined Circle (Security Deposit)" },
    contribute: { icon: "account_balance",    bg: "bg-amber-500/15 text-amber-400",    label: (tx) => `Contributed — Round ${tx.round ?? "?"}` },
    bid:        { icon: "gavel",              bg: "bg-purple-500/15 text-purple-400",   label: () => "Placed Auction Bid" },
    credit:     { icon: "savings",            bg: "bg-emerald-500/15 text-emerald-400", label: (tx) => {
        const reasons = { round_winner: "Round Won — Payout", auction_surplus: "Auction Surplus Share", deposit_refund: "Security Deposit Returned", loan: "Loan Issued" };
        return reasons[tx.reason] || "Balance Credited";
    }},
    won_round:  { icon: "emoji_events",       bg: "bg-yellow-500/15 text-yellow-400",  label: (tx) => `Won Round ${tx.round ?? "?"}` },
    withdraw:   { icon: "account_balance_wallet", bg: "bg-emerald-500/15 text-emerald-400", label: () => "Withdrawal to Wallet" },
    _default:   { icon: "receipt",            bg: "bg-white/10 text-white/40",         label: () => "Transaction" },
};

export default function ProfilePage() {
    const { address, isAdmin, wrongNetwork, walletConflict, contract, connect, connecting } = useWeb3();
    const { user, role, isAdmin: isAdminRole, isModerator: isModRole, isVerified, refetchUser } = useAuth();
    const { getGroupCount, getGroupInfo, getGroupMembers, getMemberData, getTransactionHistory, getWithdrawableBalance, withdrawBalance, loading: contractLoading } = useContract();

    const [myGroups, setMyGroups] = useState([]);
    const [totalContributed, setTotalContributed] = useState(0n);
    const [totalWinnings, setTotalWinnings] = useState(0n);
    const [withdrawable, setWithdrawable] = useState(0n);
    const [totalLoans, setTotalLoans] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [activeTab, setActiveTab] = useState("circles");
    const [fetching, setFetching] = useState(true);
    const [linkedWallets, setLinkedWallets] = useState([]);
    const [walletActionLoading, setWalletActionLoading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const fileInputRef = useRef(null);
    const { scoreData, loading: scoreLoading } = useTrustScore();

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarUploading(true);
        try {
            // Client-side resize to 512px max before uploading (keeps it fast)
            const resized = await resizeImage(file, 512);
            const form = new FormData();
            form.append("file", resized);
            const res = await fetch("/api/avatar", { method: "POST", body: form });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Upload failed.");
            } else {
                await refetchUser();
            }
        } catch (err) {
            alert("Upload failed: " + err.message);
        } finally {
            setAvatarUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    /** Resize image client-side to maxPx before upload */
    const resizeImage = (file, maxPx) => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let { width, height } = img;
                if (width > maxPx || height > maxPx) {
                    const ratio = Math.min(maxPx / width, maxPx / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: "image/jpeg" }));
                }, "image/jpeg", 0.85);
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const handleAvatarRemove = async () => {
        if (!confirm("Remove your profile photo?")) return;
        setAvatarUploading(true);
        try {
            await fetch("/api/avatar", { method: "DELETE" });
            await refetchUser();
        } finally {
            setAvatarUploading(false);
        }
    };

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
            if (res.ok) {
                fetchLinkedWallets();
            } else {
                const data = await res.json().catch(() => ({}));
                if (data.code === "IS_PRIMARY") {
                    alert("Primary wallet cannot be removed.");
                } else if (data.code === "IN_POOL") {
                    alert(data.error || "Wallet is active in a circle pool and cannot be removed.");
                } else {
                    alert(data.error || "Failed to unlink wallet.");
                }
            }
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

            // Check membership across ALL linked wallets, not just the active one
            const allAddresses = linkedWallets.length > 0
                ? linkedWallets.map(w => w.wallet_address.toLowerCase())
                : [address.toLowerCase()];

            for (let i = 1; i <= count; i++) {
                const members = await getGroupMembers(i);
                const membersLower = members.map(m => m.toLowerCase());

                // Find which of our wallets is a member of this group
                const matchedAddr = allAddresses.find(a => membersLower.includes(a));
                if (!matchedAddr) continue;

                // Use the matched wallet for getMemberData (need checksum format)
                const memberOnChain = members.find(m => m.toLowerCase() === matchedAddr);
                const info = await getGroupInfo(i);
                const md = await getMemberData(i, memberOnChain);
                contrib += md.totalContributed;
                if (md.hasActiveLoan) loans++;

                groups.push({ id: i, ...info, memberData: md, memberWallet: matchedAddr });
            }

            setMyGroups(groups);
            setTotalContributed(contrib);
            setTotalLoans(loans);

            // Fetch withdrawable balance — only for active wallet (withdraw() needs msg.sender)
            try {
                const wb = await getWithdrawableBalance(address);
                console.log("[profile] Withdrawable for", address, ":", wb?.toString());
                setWithdrawable(wb ?? 0n);
            } catch (wbErr) {
                console.error("[profile] getWithdrawableBalance error:", wbErr);
                setWithdrawable(0n);
            }

            // Fetch transaction history from on-chain events (for all linked wallets)
            try {
                let allTx = [];
                for (const addr of allAddresses) {
                    const txs = await getTransactionHistory(addr);
                    allTx.push(...txs);
                }
                // Deduplicate by txHash+type
                const seen = new Set();
                allTx = allTx.filter(t => {
                    const key = `${t.txHash}-${t.type}-${t.extra || ""}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                allTx.sort((a, b) => b.timestamp - a.timestamp);
                setTransactions(allTx);
                // Sum up winnings from credit events
                const winSum = allTx
                    .filter(t => t.type === "credit" && (t.reason === "round_winner" || t.reason === "auction_surplus" || t.reason === "deposit_refund"))
                    .reduce((sum, t) => sum + t.amount, 0n);
                setTotalWinnings(winSum);
            } catch { setTransactions([]); setTotalWinnings(0n); }
        } catch (e) {
            console.error("Profile refresh:", e);
        } finally {
            setFetching(false);
        }
    }, [contract, address, linkedWallets, getGroupCount, getGroupMembers, getGroupInfo, getMemberData, getWithdrawableBalance, getTransactionHistory]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // When wallet is connected (including auto-reconnect on page load),
    // bind ALL permitted MetaMask accounts to this Prospera account.
    useEffect(() => {
        if (!address) return;
        (async () => {
            try {
                // Get all accounts MetaMask has granted permission for
                let allAccounts = [address];
                if (window.ethereum) {
                    try {
                        const permissions = await window.ethereum.request({ method: "wallet_getPermissions" });
                        const ethPerm = permissions?.find(p => p.parentCapability === "eth_accounts");
                        const caveat = ethPerm?.caveats?.find(c => c.type === "restrictReturnedAccounts");
                        if (caveat?.value?.length > 0) allAccounts = caveat.value;
                    } catch { /* fallback to just active address */ }
                }
                // Bind each one
                for (const acct of allAccounts) {
                    await fetch("/api/auth/wallet", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ walletAddress: acct }),
                    }).catch(() => {});
                }
            } catch { /* ignore */ }
            fetchLinkedWallets();
        })();
    }, [address, fetchLinkedWallets]);

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
                        <h2 className="text-luxury-cream text-2xl font-extrabold tracking-tight">Prospera</h2>
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
                                    <div className="relative group">
                                        <div className="size-32 rounded-full border-4 border-luxury-crimson/30 p-1 flex items-center justify-center bg-luxury-dark overflow-hidden">
                                            {user?.avatarUrl ? (
                                                <Image
                                                    src={user.avatarUrl}
                                                    alt="Profile"
                                                    width={128}
                                                    height={128}
                                                    className="size-full rounded-full object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <span className="material-symbols-outlined text-6xl text-luxury-gold">account_circle</span>
                                            )}
                                        </div>
                                        {/* Upload overlay */}
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={avatarUploading}
                                            className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer disabled:cursor-wait"
                                        >
                                            {avatarUploading ? (
                                                <span className="material-symbols-outlined text-2xl text-white animate-spin">progress_activity</span>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-2xl text-white">photo_camera</span>
                                                    <span className="text-[10px] text-white/80 font-bold mt-1 uppercase tracking-widest">
                                                        {user?.avatarUrl ? "Change" : "Upload"}
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                        />
                                        {/* Remove button */}
                                        {user?.avatarUrl && !avatarUploading && (
                                            <button
                                                onClick={handleAvatarRemove}
                                                title="Remove photo"
                                                className="absolute -top-1 -right-1 size-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center border-2 border-luxury-dark shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <span className="absolute bottom-1 right-1 bg-luxury-crimson text-white size-10 rounded-full flex items-center justify-center border-4 border-luxury-dark shadow-xl text-xs font-black">
                                                A
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        {user?.fullName && (
                                            <h2 className="text-luxury-cream text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
                                                {user.fullName}
                                                {scoreData && <TrustScoreBadge score={scoreData.score} size="md" />}
                                            </h2>
                                        )}
                                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
                                            <p className="text-luxury-gold/60 font-mono text-sm tracking-tight">{shortenAddress(address)}</p>
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
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-xl bg-luxury-gold/10 flex items-center justify-center border border-luxury-gold/20">
                                            <span className="material-symbols-outlined text-2xl text-luxury-gold">account_balance_wallet</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-luxury-cream tracking-tight">Linked Wallets</h3>
                                            <p className="text-luxury-gold/40 text-xs mt-0.5">
                                                {linkedWallets.length} wallet{linkedWallets.length !== 1 ? "s" : ""} linked to your account
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            try {
                                                if (!window.ethereum) return alert("MetaMask not found.");
                                                // Request permissions — forces MetaMask account picker
                                                const permissions = await window.ethereum.request({
                                                    method: "wallet_requestPermissions",
                                                    params: [{ eth_accounts: {} }],
                                                });
                                                // Extract ALL granted accounts from the permission result
                                                const ethPerm = permissions.find(p => p.parentCapability === "eth_accounts");
                                                let allAccounts = [];
                                                if (ethPerm?.caveats) {
                                                    const valueCaveat = ethPerm.caveats.find(c => c.type === "restrictReturnedAccounts");
                                                    if (valueCaveat?.value) allAccounts = valueCaveat.value;
                                                }
                                                // Fallback: also grab from eth_requestAccounts
                                                if (allAccounts.length === 0) {
                                                    allAccounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                                                }
                                                // Bind every granted account to this user
                                                let linked = 0, errors = [];
                                                for (const acct of allAccounts) {
                                                    const res = await fetch("/api/auth/wallet", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ walletAddress: acct }),
                                                    });
                                                    const data = await res.json();
                                                    if (res.ok) {
                                                        if (!data.alreadyLinked) linked++;
                                                    } else {
                                                        errors.push(`${acct.slice(0,8)}…: ${data.error}`);
                                                    }
                                                }
                                                if (errors.length > 0) alert(errors.join("\n"));
                                                fetchLinkedWallets();
                                            } catch (e) {
                                                if (e.code !== 4001) console.error("Add wallet:", e);
                                            }
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold text-xs font-bold uppercase tracking-widest border border-luxury-gold/20 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-base">add_link</span>
                                        Add Wallet
                                    </button>
                                </div>

                                <div className="mb-6 bg-gradient-to-r from-luxury-gold/[0.04] to-transparent border border-luxury-gold/10 rounded-2xl p-5 text-xs text-slate-400 flex items-start gap-3">
                                    <span className="material-symbols-outlined text-luxury-gold text-lg mt-0.5 shrink-0">info</span>
                                    <div className="space-y-1.5">
                                        <p>
                                            One account can link <strong className="text-luxury-cream">multiple wallets</strong>.
                                            Each wallet address can only belong to <strong className="text-luxury-cream">one account</strong>.
                                        </p>
                                        <p className="text-luxury-gold/30">
                                            Your <strong className="text-luxury-gold/60">primary wallet</strong> and wallets <strong className="text-luxury-gold/60">active in a circle</strong> are protected from removal.
                                        </p>
                                    </div>
                                </div>

                                {linkedWallets.length === 0 ? (
                                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                                        <span className="material-symbols-outlined text-5xl text-luxury-gold/15 mb-4 block">wallet</span>
                                        <p className="text-slate-400 text-sm font-medium">No wallets linked yet</p>
                                        <p className="text-slate-500 text-xs mt-2 mb-5">Connect MetaMask to link your first wallet.</p>
                                        {!address ? (
                                            <button
                                                onClick={connect}
                                                disabled={connecting}
                                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-luxury-crimson hover:bg-luxury-crimson/90 text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-luxury-crimson/20 transition-all disabled:opacity-50"
                                            >
                                                <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                                                {connecting ? "Connecting…" : "Connect Wallet"}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await fetch("/api/auth/wallet", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ walletAddress: address }),
                                                        });
                                                        fetchLinkedWallets();
                                                    } catch { /* ignore */ }
                                                }}
                                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold font-bold text-sm uppercase tracking-widest border border-luxury-gold/20 transition-all"
                                            >
                                                <span className="material-symbols-outlined text-lg">link</span>
                                                Link Current Wallet
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {linkedWallets.map((w) => {
                                            const isActive = address?.toLowerCase() === w.wallet_address;
                                            const isPrimary = !!w.is_primary;
                                            const inGroups = w.in_groups || [];
                                            const isInPool = inGroups.length > 0;
                                            const canDelete = !isPrimary && !isInPool && !isActive;
                                            const deleteReason = isPrimary
                                                ? "Primary wallet cannot be removed"
                                                : isInPool
                                                ? `Active in Circle${inGroups.length > 1 ? "s" : ""} #${inGroups.join(", #")}`
                                                : isActive
                                                ? "Cannot remove currently active wallet"
                                                : "";

                                            return (
                                                <div
                                                    key={w.wallet_address}
                                                    className={`group relative rounded-2xl border transition-all overflow-hidden ${
                                                        isPrimary
                                                            ? "border-luxury-gold/30 bg-gradient-to-r from-luxury-gold/[0.06] to-luxury-gold/[0.02]"
                                                            : isActive
                                                            ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                                                            : "border-white/5 bg-white/[0.015] hover:border-white/10 hover:bg-white/[0.03]"
                                                    }`}
                                                >
                                                    {/* Primary indicator stripe */}
                                                    {isPrimary && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-luxury-gold to-luxury-gold/40" />
                                                    )}

                                                    <div className="flex items-center justify-between p-5 pl-6">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            {/* Status dot */}
                                                            <div className="relative shrink-0">
                                                                <div className={`size-10 rounded-xl flex items-center justify-center ${
                                                                    isPrimary
                                                                        ? "bg-luxury-gold/15 border border-luxury-gold/30"
                                                                        : isActive
                                                                        ? "bg-emerald-500/15 border border-emerald-500/30"
                                                                        : "bg-white/5 border border-white/10"
                                                                }`}>
                                                                    <span className={`material-symbols-outlined text-xl ${
                                                                        isPrimary ? "text-luxury-gold" : isActive ? "text-emerald-400" : "text-white/40"
                                                                    }`}>
                                                                        {isPrimary ? "star" : "account_balance_wallet"}
                                                                    </span>
                                                                </div>
                                                                {isActive && (
                                                                    <div className="absolute -bottom-0.5 -right-0.5 size-3.5 bg-emerald-400 rounded-full border-2 border-luxury-dark animate-pulse" />
                                                                )}
                                                            </div>

                                                            {/* Address + meta */}
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className="font-mono text-sm text-luxury-cream truncate">{w.wallet_address}</p>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                    {/* Badges */}
                                                                    {isPrimary && (
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-luxury-gold/15 text-luxury-gold text-[10px] font-black uppercase tracking-widest border border-luxury-gold/25">
                                                                            <span className="material-symbols-outlined text-[11px]">shield</span>
                                                                            Primary
                                                                        </span>
                                                                    )}
                                                                    {isActive ? (
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/25">
                                                                            <span className="material-symbols-outlined text-[11px]">radio_button_checked</span>
                                                                            In Use
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 text-white/30 text-[10px] font-black uppercase tracking-widest border border-white/10">
                                                                            <span className="material-symbols-outlined text-[11px]">radio_button_unchecked</span>
                                                                            Not In Use
                                                                        </span>
                                                                    )}
                                                                    {isInPool && inGroups.map((gid) => (
                                                                        <span
                                                                            key={gid}
                                                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/25"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[11px]">groups</span>
                                                                            Circle #{gid}
                                                                        </span>
                                                                    ))}
                                                                    <span className="text-[10px] text-white/20 ml-1">
                                                                        Linked {new Date(w.linked_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Action: remove or protected */}
                                                        <div className="shrink-0 ml-4">
                                                            {canDelete ? (
                                                                <button
                                                                    onClick={() => handleUnlinkWallet(w.wallet_address)}
                                                                    disabled={walletActionLoading}
                                                                    title="Unlink wallet"
                                                                    className="size-9 rounded-xl flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">link_off</span>
                                                                </button>
                                                            ) : (
                                                                <div
                                                                    title={deleteReason}
                                                                    className="size-9 rounded-xl flex items-center justify-center text-white/10 cursor-not-allowed"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">lock</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
                                <div className="luxury-glass p-6 flex flex-col gap-2 rounded-custom">
                                    <p className="text-luxury-gold/60 text-[10px] font-bold uppercase tracking-widest">Circles</p>
                                    <p className="text-3xl font-extrabold text-luxury-cream">{myGroups.length}</p>
                                </div>
                                <div className="luxury-glass p-6 flex flex-col gap-2 rounded-custom">
                                    <p className="text-luxury-gold/60 text-[10px] font-bold uppercase tracking-widest">Contributed</p>
                                    <p className="text-3xl font-extrabold text-luxury-cream">{fmtEthSymbol(totalContributed)}</p>
                                </div>
                                <div className="luxury-glass p-6 flex flex-col gap-2 rounded-custom">
                                    <p className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-widest">Total Winnings</p>
                                    <p className="text-3xl font-extrabold text-emerald-400">{fmtEthSymbol(totalWinnings)}</p>
                                </div>
                                <div className="luxury-glass p-6 flex flex-col gap-2 rounded-custom relative overflow-hidden">
                                    <p className="text-luxury-gold/60 text-[10px] font-bold uppercase tracking-widest">Withdrawable</p>
                                    <p className="text-3xl font-extrabold text-luxury-cream">{fmtEthSymbol(withdrawable)}</p>
                                    {withdrawable > 0n && (
                                        <button
                                            onClick={() => withdrawBalance(() => { setWithdrawable(0n); refresh(); })}
                                            disabled={contractLoading}
                                            className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                        >
                                            Claim
                                        </button>
                                    )}
                                </div>
                                <div className="luxury-glass p-6 flex flex-col gap-2 rounded-custom">
                                    <p className="text-luxury-gold/60 text-[10px] font-bold uppercase tracking-widest">Active Loans</p>
                                    <p className="text-3xl font-extrabold text-luxury-cream">{totalLoans}</p>
                                </div>
                            </div>

                            {/* Trust Score Card */}
                            <div className="mb-12">
                                <TrustScoreCard scoreData={scoreData} loading={scoreLoading} />
                            </div>

                            {/* Tab Navigation */}
                            <div className="flex gap-2 mb-8">
                                {["circles", "transactions"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
                                            activeTab === tab
                                                ? "bg-luxury-crimson text-white shadow-lg shadow-luxury-crimson/20"
                                                : "text-luxury-gold/60 hover:text-luxury-gold hover:bg-luxury-gold/5"
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-base align-middle mr-2">
                                            {tab === "circles" ? "groups" : "receipt_long"}
                                        </span>
                                        {tab === "circles" ? "My Circles" : `Transactions (${transactions.length})`}
                                    </button>
                                ))}
                            </div>

                            {/* Circles Tab */}
                            {activeTab === "circles" && (
                            <section className="luxury-glass p-8 rounded-custom mb-12">
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
                            )}

                            {/* Transactions Tab */}
                            {activeTab === "transactions" && (
                            <section className="luxury-glass p-8 rounded-custom mb-12">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-bold text-luxury-cream tracking-tight">Transaction History</h3>
                                    {transactions.length > 0 && (
                                        <button
                                            onClick={() => exportTransactionsPDF({
                                                transactions,
                                                address,
                                                userName: user?.name || user?.email || "",
                                                totalContributed,
                                                totalWinnings,
                                                withdrawable,
                                                circleCount: myGroups.length,
                                            })}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-luxury-crimson/10 border border-luxury-crimson/30 text-luxury-crimson hover:bg-luxury-crimson hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
                                        >
                                            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                                            Export PDF
                                        </button>
                                    )}
                                </div>
                                {fetching ? (
                                    <div className="flex items-center justify-center py-12">
                                        <span className="material-symbols-outlined text-4xl text-luxury-gold animate-spin">progress_activity</span>
                                    </div>
                                ) : transactions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <span className="material-symbols-outlined text-5xl text-luxury-gold/15 mb-4 block">receipt_long</span>
                                        <p className="text-slate-400">No transactions found on-chain.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {transactions.map((tx, i) => {
                                            const meta = TX_META[tx.type] || TX_META._default;
                                            const isIncoming = ["credit", "won_round", "withdraw"].includes(tx.type);
                                            const isOutgoing = ["join", "contribute"].includes(tx.type);
                                            return (
                                                <div key={tx.txHash + i} className="flex items-center gap-4 p-5 rounded-xl border border-luxury-gold/10 bg-luxury-gold/[0.02] hover:bg-luxury-gold/5 transition-all">
                                                    <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                                                        <span className="material-symbols-outlined text-xl">{meta.icon}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-luxury-cream font-bold text-sm">{meta.label(tx)}</p>
                                                        <p className="text-luxury-gold/40 text-xs mt-0.5">
                                                            {new Date(tx.timestamp * 1000).toLocaleString()}
                                                            {tx.groupId != null && ` • Circle #${tx.groupId}`}
                                                            {tx.round != null && ` • Round ${tx.round}`}
                                                        </p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        {tx.amount > 0n && (
                                                            <p className={`font-bold text-sm ${
                                                                isIncoming ? "text-emerald-400" : isOutgoing ? "text-red-400" : "text-luxury-cream"
                                                            }`}>
                                                                {isIncoming ? "+" : isOutgoing ? "-" : ""}{fmtEth(tx.amount)} ETH
                                                            </p>
                                                        )}
                                                        <p
                                                            title={tx.txHash}
                                                            className="text-luxury-gold/30 text-[10px] font-mono"
                                                        >
                                                            {tx.txHash?.slice(0, 10)}…
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                            )}

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
                        <span className="text-[10px] font-black text-luxury-gold uppercase tracking-[0.4em]">Prospera On-Chain © 2024</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
