"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { parseEther, formatEther } from "ethers";
import { useWeb3 } from "@/context/Web3Provider";
import useContract from "@/hooks/useContract";
import ConnectWallet from "@/views/ui/ConnectWallet";
import { fmtEth, fmtEthSymbol, poolTypeName, shortenAddress } from "@/lib/utils";

export default function CircleDetailPage() {
  const params = useParams();
  const groupId = Number(params.id);

  const { address, isAdmin, wrongNetwork } = useWeb3();
  const {
    loading,
    getGroupInfo,
    getGroupTiming,
    getGroupMembers,
    getMemberData,
    getMemberBid,
    getWithdrawableBalance,
    joinGroup,
    contribute,
    placeBid,
    settleRound,
    issueLoan,
    liquidateMember,
    withdrawBalance,
  } = useContract();

  // ── State ──────────────────────────────────────────────────
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberDetails, setMemberDetails] = useState({});
  const [myData, setMyData] = useState(null);
  const [myBid, setMyBid] = useState(0n);
  const [bidAmount, setBidAmount] = useState("");
  const [loanInputs, setLoanInputs] = useState({});
  const [fetching, setFetching] = useState(true);
  const [timing, setTiming] = useState(null);
  const [myWithdrawable, setMyWithdrawable] = useState(0n);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  // Live clock — update every second for countdown accuracy
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Refresh data ───────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!groupId) return;
    setFetching(true);
    try {
      const info = await getGroupInfo(groupId);
      setGroup(info);

      const t = await getGroupTiming(groupId);
      setTiming(t);

      const mems = await getGroupMembers(groupId);
      setMembers(mems);

      // Fetch details for each member
      const details = {};
      for (const m of mems) {
        details[m] = await getMemberData(groupId, m);
      }
      setMemberDetails(details);

      // My data
      if (address) {
        const md = await getMemberData(groupId, address);
        setMyData(md);
        const mb = await getMemberBid(groupId, address);
        setMyBid(mb);
        const wb = await getWithdrawableBalance(address);
        setMyWithdrawable(wb);
      }
    } catch (e) {
      console.error("Failed to load group:", e);
    } finally {
      setFetching(false);
    }
  }, [groupId, address, getGroupInfo, getGroupTiming, getGroupMembers, getMemberData, getMemberBid, getWithdrawableBalance]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Handlers ───────────────────────────────────────────────
  const handleJoin = () => {
    if (!group) return;
    joinGroup(groupId, group.contributionAmount, () => {
      refresh();
      setJustJoined(true);
    });
  };

  const handleContribute = () => {
    if (!group) return;
    contribute(groupId, group.contributionAmount, refresh);
  };

  const handleBid = () => {
    if (!bidAmount) return;
    const bidWei = parseEther(bidAmount);
    if (group.poolAmount === 0n) {
      return; // contract will reject — pool empty
    }
    if (bidWei >= group.poolAmount) {
      return; // contract requires bidAmount < poolAmount
    }
    placeBid(groupId, bidWei, refresh);
  };

  const handleSettleRound = () => {
    settleRound(groupId, refresh);
  };

  const handleWithdraw = () => {
    withdrawBalance(refresh);
  };

  const handleIssueLoan = (memberAddr) => {
    const inp = loanInputs[memberAddr];
    if (!inp?.amount || !inp?.interest) return;
    issueLoan(
      groupId,
      memberAddr,
      parseEther(inp.amount),
      parseEther(inp.interest),
      refresh
    );
  };

  const handleLiquidate = (memberAddr) => {
    liquidateMember(groupId, memberAddr, refresh);
  };

  // ── Join success state ────────────────────────────────────
  const [justJoined, setJustJoined] = useState(false);

  // ── Derived values ─────────────────────────────────────────
  const isMember = myData?.isActive ?? false;
  const grossPool = group ? group.contributionAmount * BigInt(group.maxMembers) : 0n;
  const platformFee = grossPool / 10n;
  const netPool = grossPool - platformFee;
  const isAuction = group?.poolType === 0;
  const hasBid = myBid > 0n;

  // ── Timing helpers ─────────────────────────────────────────
  const roundOpen = timing?.roundOpen ?? false;
  const roundDeadline = timing?.roundDeadline ?? 0;
  const canSettle = roundOpen && roundDeadline > 0 && now >= roundDeadline;

  const fmtCountdown = (deadline) => {
    if (!deadline || deadline === 0) return "—";
    const diff = deadline - now;
    if (diff <= 0) return "Expired";
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // ── Circle Phase ───────────────────────────────────────────
  // "start"     → just created, no members yet
  // "enrolling" → members joining, not yet full
  // "live"      → full, rounds active
  const circlePhase = !group
    ? null
    : group.memberCount === 0
    ? "start"
    : group.memberCount < group.maxMembers
    ? "enrolling"
    : "live";

  if (fetching && !group) {
    return (
      <div className="min-h-screen bg-[#0F0F14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-6xl text-brand-gold animate-spin">progress_activity</span>
          <p className="text-brand-ivory font-bold uppercase tracking-widest text-sm">Loading Circle #{groupId}…</p>
        </div>
      </div>
    );
  }

  if (!group || !group.isActive) {
    return (
      <div className="min-h-screen bg-[#0F0F14] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-red-400 mb-4 block">error</span>
          <h2 className="text-brand-ivory text-2xl font-bold mb-2">Group Not Found</h2>
          <p className="text-slate-400 mb-6">Circle #{groupId} doesn&apos;t exist or is inactive.</p>
          <Link href="/dashboard" className="premium-gradient text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-widest">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Enroll success screen ──────────────────────────────────
  if (justJoined) {
    const spotsLeft = group.maxMembers - group.memberCount;
    const isNowLive = group.memberCount >= group.maxMembers;
    return (
      <div className="min-h-screen bg-[#0F0F14] flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          {/* Animated check */}
          <div className="w-28 h-28 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/20">
            <span className="material-symbols-outlined text-6xl text-emerald-400">check_circle</span>
          </div>

          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
            You&apos;re <span className="text-emerald-400">Enrolled!</span>
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            Welcome to <span className="text-white font-bold">Circle #{groupId}</span>.
            Your security deposit of <span className="text-[#D5BF86] font-bold">Ξ {fmtEth(group.contributionAmount)}</span> has been locked.
          </p>

          {/* Status card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Circle</span>
              <span className="text-white font-bold"># {groupId}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Type</span>
              <span className="text-white font-bold">{poolTypeName(group.poolType)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Members</span>
              <span className="text-white font-bold">{group.memberCount} / {group.maxMembers}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Circle Status</span>
              {isNowLive ? (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-black uppercase tracking-wider">🔴 Live</span>
              ) : (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-black uppercase tracking-wider">Enrolling ({spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left)</span>
              )}
            </div>
            <div className="border-t border-white/10 pt-4 flex justify-between items-center text-sm">
              <span className="text-slate-400">Your deposit</span>
              <span className="text-emerald-400 font-black">Ξ {fmtEth(group.contributionAmount)} locked ✓</span>
            </div>
          </div>

          {isNowLive ? (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-sm font-bold">
              🎉 Circle is now <strong>Live</strong>! All spots filled. Head to the circle to contribute for Round 1.
            </div>
          ) : (
            <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4 text-slate-400 text-sm">
              Waiting for <strong className="text-white">{spotsLeft} more member{spotsLeft !== 1 ? "s" : ""}</strong> to join before the circle goes live.
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="flex-1 bg-white/10 hover:bg-white/15 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              Dashboard
            </Link>
            <button
              onClick={() => setJustJoined(false)}
              className="flex-1 premium-gradient text-white font-black py-4 rounded-xl text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-crimson/20"
            >
              <span className="material-symbols-outlined text-lg">visibility</span>
              View Circle
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#0F0F14] font-display text-[#F1F0CC]">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-white/5 px-6 lg:px-20 py-5 bg-[#0F0F14]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="size-10 bg-gradient-to-br from-[#D5BF86] to-[#A71D31] rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-[#0F0F14] font-bold">toll</span>
            </div>
            <h2 className="text-white text-2xl font-extrabold tracking-tighter">
              Prospera
            </h2>
          </Link>
          <nav className="hidden lg:flex items-center gap-10">
            <Link className="text-white/60 hover:text-[#D5BF86] transition-colors text-sm font-bold uppercase tracking-widest" href="/dashboard">
              Dashboard
            </Link>
            <span className="text-[#D5BF86] text-sm font-bold uppercase tracking-widest border-b-2 border-[#D5BF86] pb-1">
              Circle #{groupId}
            </span>
          </nav>
        </div>
        <ConnectWallet />
      </header>

      <main className="flex-1 px-6 lg:px-20 py-10 max-w-[1440px] mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <nav className="flex gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-4">
              <Link className="hover:text-[#D5BF86]" href="/dashboard">Dashboard</Link>
              <span>/</span>
              <span className="text-[#D5BF86]">Circle #{groupId}</span>
            </nav>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
              Circle <span className="text-[#D5BF86]">#{groupId}</span>
            </h1>
            <p className="text-[#F1F0CC]/60 mt-3 flex items-center gap-3 font-medium flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${
                isAuction
                  ? "bg-brand-crimson/10 text-brand-crimson border-brand-crimson/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>
                {poolTypeName(group.poolType)}
              </span>
              <span className="text-[#D5BF86] font-bold">Round {group.currentRound}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D5BF86]/30" />
              <span>{group.memberCount} / {group.maxMembers} Members</span>
            </p>

            {/* Circle Phase Banner */}
            <div className="mt-4 flex flex-wrap gap-3 items-center">
              {/* Phase pill */}
              {circlePhase === "start" && (
                <div className="inline-flex items-center gap-2 bg-slate-500/10 border border-slate-500/20 text-slate-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm">radio_button_unchecked</span>
                  Phase: Start — Awaiting first enrollments
                </div>
              )}
              {circlePhase === "enrolling" && (
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                  Phase: Enrolling — {group.maxMembers - group.memberCount} spot{group.maxMembers - group.memberCount !== 1 ? "s" : ""} left
                </div>
              )}
              {circlePhase === "live" && (
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Phase: Live — All {group.maxMembers} members enrolled
                </div>
              )}

              {/* Round funding status (only shown when live) */}
              {circlePhase === "live" && (
                roundOpen ? (
                  canSettle ? (
                    <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                      <span className="material-symbols-outlined text-sm">gavel</span>
                      Bidding closed — Ready to settle Round {group.currentRound}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      Bidding closes in {fmtCountdown(roundDeadline)}
                    </div>
                  )
                ) : (
                  group.poolAmount === 0n ? (
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                      <span className="material-symbols-outlined text-sm">pending_actions</span>
                      Round {group.currentRound} — Awaiting contributions ({fmtEth(group.contributionAmount)} ETH each)
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                      <span className="material-symbols-outlined text-sm">hourglass_top</span>
                      Round {group.currentRound} — Waiting for round window to open
                    </div>
                  )
                )
              )}
            </div>
          </div>

          {/* Join Button */}
          {address && !isMember && group.memberCount < group.maxMembers && (
            <button
              onClick={handleJoin}
              disabled={loading || wrongNetwork}
              className="flex items-center justify-center rounded-xl h-12 px-8 bg-[#A71D31] text-white font-black hover:brightness-110 transition-all shadow-2xl shadow-[#A71D31]/20 uppercase tracking-wider text-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined mr-2 text-lg">person_add</span>
              Join Circle (Ξ {fmtEth(group.contributionAmount)} deposit)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ─────────────── Left Column ─────────────── */}
          <div className="lg:col-span-8 space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="glass-card-bidding p-6 rounded-2xl">
                <p className="text-[#D5BF86]/60 text-xs font-black uppercase tracking-widest mb-2">Contribution</p>
                <p className="text-white text-3xl font-black">{fmtEthSymbol(group.contributionAmount)}</p>
                <div className="mt-2 text-[10px] text-green-500 font-bold">↑ PER ROUND</div>
              </div>
              <div className="glass-card-bidding p-6 rounded-2xl">
                <p className="text-[#D5BF86]/60 text-xs font-black uppercase tracking-widest mb-2">Pool Amount</p>
                <p className="text-white text-3xl font-black">{fmtEthSymbol(group.poolAmount)}</p>
              </div>
              <div className="glass-card-bidding p-6 rounded-2xl">
                <p className="text-[#D5BF86]/60 text-xs font-black uppercase tracking-widest mb-2">Round</p>
                <p className="text-white text-3xl font-black">
                  {group.currentRound}
                  <span className="text-[#D5BF86]/40 text-xl font-bold"> / {group.maxMembers}</span>
                </p>
              </div>
            </div>

            {/* Economic Breakdown */}
            <div className="glass-card-bidding p-8 rounded-3xl">
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#D5BF86]">analytics</span>
                Economic Breakdown
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-slate-400 text-sm">Gross Pool (all members contribute)</span>
                  <span className="text-white font-bold">{fmtEthSymbol(grossPool)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-red-400 text-sm">Platform Fee (10%)</span>
                  <span className="text-red-400 font-bold">-{fmtEthSymbol(platformFee)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-emerald-400 text-sm font-bold">Net Pool (90%)</span>
                  <span className="text-emerald-400 font-bold">{fmtEthSymbol(netPool)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-white/[0.02] rounded-lg px-4">
                  <span className="text-white text-sm font-black">Estimated Payout (90%)</span>
                  <span className="text-[#D5BF86] text-xl font-black">{fmtEthSymbol(netPool)}</span>
                </div>
              </div>
            </div>

            {/* Members Table */}
            <div className="glass-card-bidding p-8 rounded-3xl">
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#D5BF86]">group</span>
                Members ({members.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[#D5BF86]/40 text-[10px] uppercase font-black tracking-widest border-b border-white/10">
                    <tr>
                      <th className="pb-4">Address</th>
                      <th className="pb-4">Contributed</th>
                      <th className="pb-4">Round</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4">Deposit</th>
                      {isAdmin && <th className="pb-4">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="text-sm text-white">
                    {members.map((m) => {
                      const d = memberDetails[m];
                      if (!d) return null;
                      return (
                        <tr key={m} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 font-mono text-xs">
                            {shortenAddress(m)}
                            {m.toLowerCase() === address?.toLowerCase() && (
                              <span className="ml-2 text-[#D5BF86] text-[10px] font-black">(YOU)</span>
                            )}
                          </td>
                          <td className="py-4">{fmtEthSymbol(d.totalContributed)}</td>
                          <td className="py-4">
                            {circlePhase === "live" ? (
                              d.contributedThisRound ? (
                                <span className="text-emerald-400 text-[10px] font-black">✓ PAID</span>
                              ) : (
                                <span className="text-amber-400 text-[10px] font-black">PENDING</span>
                              )
                            ) : (
                              <span className="text-slate-500 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="py-4">
                            {!d.isActive ? (
                              <span className="text-red-400 text-xs font-bold">LIQUIDATED</span>
                            ) : d.hasWon ? (
                              <span className="text-emerald-400 text-xs font-bold">WON</span>
                            ) : (
                              <span className="text-[#D5BF86] text-xs font-bold">ACTIVE</span>
                            )}
                          </td>
                          <td className="py-4">
                            {d.depositUsed ? (
                              <span className="text-red-400 text-[10px] font-black">USED</span>
                            ) : (
                              <span className="text-emerald-400 text-[10px] font-black">INTACT</span>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                {d.isActive && !d.hasWon && (
                                  <button
                                    onClick={() => handleLiquidate(m)}
                                    disabled={loading}
                                    className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                    title="Liquidate member"
                                  >
                                    Liquidate
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin: Loan Issuance */}
            {isAdmin && (
              <div className="glass-card-bidding p-8 rounded-3xl border border-brand-crimson/20">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-brand-crimson">credit_score</span>
                  Issue Loan (Admin)
                </h3>
                <div className="space-y-4">
                  {members.filter((m) => {
                    const d = memberDetails[m];
                    return d && d.isActive && !d.hasWon && !d.hasActiveLoan;
                  }).map((m) => (
                    <div key={m} className="bg-white/[0.02] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <span className="font-mono text-xs text-[#D5BF86] min-w-[120px]">{shortenAddress(m)}</span>
                      <input
                        type="number"
                        step="0.001"
                        placeholder="Loan (ETH)"
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white w-32 outline-none focus:border-primary"
                        onChange={(e) =>
                          setLoanInputs((prev) => ({
                            ...prev,
                            [m]: { ...prev[m], amount: e.target.value },
                          }))
                        }
                      />
                      <input
                        type="number"
                        step="0.001"
                        placeholder="Interest (ETH)"
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white w-32 outline-none focus:border-primary"
                        onChange={(e) =>
                          setLoanInputs((prev) => ({
                            ...prev,
                            [m]: { ...prev[m], interest: e.target.value },
                          }))
                        }
                      />
                      <button
                        onClick={() => handleIssueLoan(m)}
                        disabled={loading}
                        className="bg-brand-crimson text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 disabled:opacity-50"
                      >
                        Issue
                      </button>
                    </div>
                  ))}
                  {members.filter((m) => {
                    const d = memberDetails[m];
                    return d && d.isActive && !d.hasWon && !d.hasActiveLoan;
                  }).length === 0 && (
                    <p className="text-slate-500 text-sm">No eligible members for loans.</p>
                  )}
                  <p className="text-slate-500 text-xs">
                    Max loan = 50% of current pool ({fmtEth(group.poolAmount / 2n)} ETH)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ─────────────── Right Column ─────────────── */}
          <div className="lg:col-span-4 space-y-8">
            {/* ── Withdraw Panel — shown when user has funds to collect ── */}
            {address && myWithdrawable > 0n && (
              <div className="bg-emerald-500/5 border-2 border-emerald-500/30 rounded-[2rem] p-8 text-center shadow-2xl shadow-emerald-500/10">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl text-emerald-400">account_balance_wallet</span>
                </div>
                <h3 className="text-white font-black text-lg mb-1">Funds Available</h3>
                <p className="text-emerald-400 text-3xl font-black mb-2">{fmtEthSymbol(myWithdrawable)}</p>
                <p className="text-slate-400 text-xs mb-6">
                  Winnings, surplus, or deposit refunds ready to withdraw to your wallet.
                </p>
                <button
                  onClick={handleWithdraw}
                  disabled={loading || wrongNetwork}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  {loading ? (
                    <span className="animate-spin material-symbols-outlined">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">download</span>
                      Withdraw {fmtEthSymbol(myWithdrawable)}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Enrolled but waiting for circle to go live */}
            {isMember && !myData?.hasWon && circlePhase !== "live" && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2rem] p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-amber-400 mb-3 block">hourglass_top</span>
                <h3 className="text-white font-black text-lg mb-2">You&apos;re Enrolled!</h3>
                <p className="text-slate-400 text-sm">
                  Waiting for <strong className="text-white">{group.maxMembers - group.memberCount}</strong> more member{group.maxMembers - group.memberCount !== 1 ? "s" : ""} to join.
                  Contributions and bidding open once the circle is <span className="text-emerald-400 font-bold">Live</span>.
                </p>
                <div className="mt-4 flex items-center justify-center gap-1">
                  {Array.from({ length: group.maxMembers }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${i < group.memberCount ? "bg-emerald-400" : "bg-white/10"}`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-bold">
                  {group.memberCount} / {group.maxMembers} slots filled
                </p>
              </div>
            )}

            {/* Contribute / Bid Panel — only when Live and round open */}
            {isMember && !myData?.hasWon && circlePhase === "live" && (
              <div className="bg-[#A71D31] p-[1px] rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(167,29,49,0.3)]">
                <div className="bg-[#0F0F14] p-8 rounded-[1.95rem] border border-white/5">
                  {/* Round not open yet */}
                  {!roundOpen && (
                    <div className="text-center py-6">
                      <span className="material-symbols-outlined text-4xl text-sky-400 mb-3 block">hourglass_top</span>
                      <h3 className="text-white font-black text-lg mb-2">Round {group.currentRound} Not Open</h3>
                      <p className="text-slate-400 text-sm">
                        The bidding window hasn&apos;t opened yet. Contribute first to open the round.
                      </p>
                    </div>
                  )}

                  {/* Contribute */}
                  {roundOpen && (
                  <div className="mb-8">
                    <h3 className="text-xl font-black text-white mb-2">Contribute</h3>
                    {myData?.contributedThisRound ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4 flex items-center gap-3">
                        <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                        <p className="text-emerald-400 text-sm font-bold">You&apos;ve contributed for Round {group.currentRound}</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-400 text-sm mb-4">
                          Send Ξ {fmtEth(group.contributionAmount)} for Round {group.currentRound}
                        </p>
                        <button
                          onClick={handleContribute}
                          disabled={loading || wrongNetwork}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm disabled:opacity-50"
                        >
                          {loading ? (
                            <span className="animate-spin material-symbols-outlined">progress_activity</span>
                          ) : (
                            <>
                              <span className="material-symbols-outlined">payments</span>
                              Contribute Ξ {fmtEth(group.contributionAmount)}
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                  )}

                  {/* Bid (Auction only) */}
                  {isAuction && roundOpen && (
                    <div className="pt-6 border-t border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-black text-white">Place Bid</h3>
                        <div className="flex items-center gap-2 bg-[#A71D31]/10 text-[#A71D31] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#A71D31]/20">
                          <span className="size-2 bg-[#A71D31] rounded-full animate-ping" /> AUCTION
                        </div>
                      </div>

                      {/* Countdown */}
                      {!canSettle && roundDeadline > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Bidding closes in</span>
                          <span className="text-[#D5BF86] font-black text-sm tabular-nums">{fmtCountdown(roundDeadline)}</span>
                        </div>
                      )}
                      {canSettle && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 mb-4 text-center">
                          <p className="text-orange-400 text-xs font-bold">Bidding window closed — awaiting settlement</p>
                        </div>
                      )}

                      {hasBid && (
                        <div className="bg-[#D5BF86]/10 border border-[#D5BF86]/20 rounded-xl p-4 mb-4">
                          <p className="text-xs text-[#D5BF86] font-bold">Your current bid: Ξ {fmtEth(myBid)}</p>
                        </div>
                      )}

                      {group.poolAmount > 0n && !canSettle && (
                        <div className="space-y-4">
                          <div className="bg-white/5 rounded-xl px-4 py-2 text-xs text-slate-400 flex justify-between">
                            <span>Current pool</span>
                            <span className="text-white font-bold">{fmtEthSymbol(group.poolAmount)}</span>
                          </div>
                          <div className="bg-white/5 rounded-xl px-4 py-2 text-xs text-slate-400 flex justify-between">
                            <span>Max valid bid (must be less than pool)</span>
                            <span className="text-[#D5BF86] font-bold">&lt; {fmtEth(group.poolAmount)} ETH</span>
                          </div>
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            placeholder="Your bid in ETH"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className={`w-full bg-white/5 border rounded-xl px-4 py-4 text-white text-lg font-bold outline-none transition-colors ${
                              bidAmount && parseFloat(bidAmount) >= parseFloat(formatEther(group.poolAmount))
                                ? "border-red-500 focus:border-red-400"
                                : "border-white/10 focus:border-[#D5BF86]"
                            }`}
                          />
                          {bidAmount && parseFloat(bidAmount) >= parseFloat(formatEther(group.poolAmount)) && (
                            <p className="text-red-400 text-xs font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">warning</span>
                              Bid must be less than {fmtEth(group.poolAmount)} ETH (current pool)
                            </p>
                          )}
                          <button
                            onClick={handleBid}
                            disabled={
                              loading || wrongNetwork || !bidAmount ||
                              parseFloat(bidAmount) <= 0 ||
                              parseFloat(bidAmount) >= parseFloat(formatEther(group.poolAmount))
                            }
                            className="w-full bg-[#A71D31] hover:bg-[#8B1829] text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-[#A71D31]/30 flex items-center justify-center gap-3 uppercase tracking-[0.1em] text-sm disabled:opacity-50"
                          >
                            {loading ? (
                              <span className="animate-spin material-symbols-outlined">progress_activity</span>
                            ) : (
                              <>
                                Confirm Bid <span className="material-symbols-outlined">gavel</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      {group.poolAmount === 0n && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                          <span className="material-symbols-outlined text-amber-400 text-2xl mb-1 block">hourglass_empty</span>
                          <p className="text-amber-400 text-xs font-bold">Pool is empty</p>
                          <p className="text-slate-400 text-xs mt-1">Members must contribute before bidding opens.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!isAuction && roundOpen && (
                    <div className="pt-6 border-t border-white/10 text-center">
                      <span className="material-symbols-outlined text-4xl text-emerald-400 mb-2 block">casino</span>
                      <p className="text-sm text-slate-400">Lucky Draw — winner selected automatically via block hash when the bidding window closes.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* My Loan Status */}
            {isMember && myData?.hasActiveLoan && (
              <div className="glass-card-bidding p-6 rounded-3xl border-l-4 border-l-red-500">
                <h3 className="text-sm font-black text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">warning</span>
                  Active Loan
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Loan Amount</span>
                    <span className="text-white font-bold">{fmtEthSymbol(myData.loanAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Interest</span>
                    <span className="text-red-400 font-bold">+{fmtEthSymbol(myData.loanInterest)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between text-sm">
                    <span className="text-slate-300 font-bold">Total Deduction on Win</span>
                    <span className="text-red-400 font-bold">
                      {fmtEthSymbol(myData.loanAmount + myData.loanInterest)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Settle Round — visible to all when window has expired */}
            {circlePhase === "live" && canSettle && (
              <div className="glass-card-bidding p-6 rounded-3xl border border-orange-500/30">
                <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">gavel</span>
                  Settle Round {group.currentRound}
                </h3>
                <p className="text-slate-400 text-xs mb-4">
                  The bidding window has closed. Anyone can call settle to distribute the pool and advance to the next round.
                </p>
                <button
                  onClick={handleSettleRound}
                  disabled={loading || wrongNetwork}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-3 uppercase tracking-wider text-sm disabled:opacity-50 shadow-lg shadow-orange-500/20"
                >
                  {loading ? (
                    <span className="animate-spin material-symbols-outlined">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">emoji_events</span>
                      Settle Round {group.currentRound}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Pool Type Info */}
            <div className="glass-card-bidding p-6 rounded-3xl">
              <h3 className="text-sm font-black text-[#D5BF86] uppercase tracking-widest mb-4">Pool Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white font-bold">{poolTypeName(group.poolType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Platform Fee</span>
                  <span className="text-white font-bold">10%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Loan</span>
                  <span className="text-white font-bold">50% of pool</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="text-emerald-400 font-bold">{group.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
