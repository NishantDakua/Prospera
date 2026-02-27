"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useWeb3 } from "@/context/Web3Provider";
import { useAuth } from "@/context/AuthProvider";
import useContract from "@/hooks/useContract";
import ConnectWallet from "@/views/ui/ConnectWallet";
import { fmtEth, fmtEthSymbol, poolTypeName, shortenAddress } from "@/lib/utils";

export default function DashboardPage() {
  const { address, isAdmin, wrongNetwork, contract } = useWeb3();
  const { role: authRole, isModerator: isModRole, isAdmin: isAdminRole } = useAuth();
  const {
    getGroupCount,
    getGroupInfo,
    getGroupMembers,
    getMemberData,
    getPlatformBalance,
    withdrawPlatformFees,
    loading,
  } = useContract();

  const [groups, setGroups] = useState([]);
  const [platformBal, setPlatformBal] = useState(0n);
  const [fetching, setFetching] = useState(true);
  const [myStats, setMyStats] = useState({ totalContributed: 0n, groupCount: 0, activeLoans: 0 });

  const refresh = useCallback(async () => {
    if (!contract) return;
    setFetching(true);
    try {
      const count = await getGroupCount();
      const allGroups = [];
      let totalContrib = 0n;
      let myGroupCount = 0;
      let activeLoans = 0;

      for (let i = 1; i <= count; i++) {
        const info = await getGroupInfo(i);
        const members = await getGroupMembers(i);

        let isMember = false;
        let myContrib = 0n;
        let hasLoan = false;

        if (address) {
          const addrLower = address.toLowerCase();
          for (const m of members) {
            if (m.toLowerCase() === addrLower) {
              isMember = true;
              const md = await getMemberData(i, m);
              myContrib = md.totalContributed;
              totalContrib += md.totalContributed;
              if (md.hasActiveLoan) {
                activeLoans++;
                hasLoan = true;
              }
              break;
            }
          }
          if (isMember) myGroupCount++;
        }

        allGroups.push({
          id: i,
          ...info,
          memberAddresses: members,
          isMember,
          myContrib,
          hasLoan,
        });
      }

      setGroups(allGroups);
      setMyStats({ totalContributed: totalContrib, groupCount: myGroupCount, activeLoans });

      if (isAdmin) {
        const pb = await getPlatformBalance();
        setPlatformBal(pb);
      }
    } catch (e) {
      console.error("Dashboard refresh error:", e);
    } finally {
      setFetching(false);
    }
  }, [contract, address, isAdmin, getGroupCount, getGroupInfo, getGroupMembers, getMemberData, getPlatformBalance]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleWithdraw = () => {
    withdrawPlatformFees(refresh);
  };

  return (
    <div className="flex min-h-screen font-display bg-luxury-dark text-luxury-cream">
      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className="w-72 border-r border-luxury-gold/10 flex flex-col justify-between p-8 bg-luxury-dark sticky top-0 h-screen">
        <div className="flex flex-col gap-10">
          <Link href="/" className="flex items-center gap-4">
            <div className="bg-luxury-crimson rounded-lg p-2.5 flex items-center justify-center shadow-lg shadow-luxury-crimson/20">
              <span className="material-symbols-outlined text-white text-2xl">account_balance_wallet</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-luxury-cream text-xl font-extrabold tracking-tight">CircleSave</h1>
              <p className="text-luxury-gold/60 text-[10px] uppercase tracking-widest font-bold">On-Chain</p>
            </div>
          </Link>

          <nav className="flex flex-col gap-2">
            <Link href="/dashboard" className="flex items-center gap-4 px-5 py-3.5 transition-all rounded-xl nav-item-active">
              <span className="material-symbols-outlined text-xl">dashboard</span>
              <span className="text-sm font-semibold">Overview</span>
            </Link>
            {isAdminRole && (
              <Link href="/create" className="flex items-center gap-4 px-5 py-3.5 transition-all rounded-xl text-luxury-gold hover:bg-luxury-gold/5">
                <span className="material-symbols-outlined text-xl">add_circle</span>
                <span className="text-sm font-semibold">Create Circle</span>
              </Link>
            )}
            {isAdminRole && (
              <Link href="/admin" className="flex items-center gap-4 px-5 py-3.5 transition-all rounded-xl text-luxury-gold hover:bg-luxury-gold/5">
                <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                <span className="text-sm font-semibold">Admin Console</span>
              </Link>
            )}
            {isModRole && (
              <Link href="/moderator" className="flex items-center gap-4 px-5 py-3.5 transition-all rounded-xl text-luxury-gold hover:bg-luxury-gold/5">
                <span className="material-symbols-outlined text-xl">shield_person</span>
                <span className="text-sm font-semibold">Mod Console</span>
              </Link>
            )}
            <Link href="/learn" className="flex items-center gap-4 px-5 py-3.5 transition-all rounded-xl text-luxury-gold hover:bg-luxury-gold/5">
              <span className="material-symbols-outlined text-xl">school</span>
              <span className="text-sm font-semibold">How It Works</span>
            </Link>
            <Link href="/profile" className="flex items-center gap-4 px-5 py-3.5 transition-all rounded-xl text-luxury-gold hover:bg-luxury-gold/5">
              <span className="material-symbols-outlined text-xl">settings</span>
              <span className="text-sm font-semibold">Profile</span>
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-6">
          {isAdminRole && (
            <Link
              href="/create"
              className="w-full bg-luxury-crimson hover:bg-luxury-crimson/90 text-white rounded-xl py-4 font-bold text-sm shadow-xl shadow-luxury-crimson/10 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Launch Circle
            </Link>
          )}

          {address && (
            <div className="flex items-center gap-4 p-3 border border-luxury-gold/10 rounded-xl bg-luxury-gold/5">
              <div className={`size-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                isAdminRole ? "bg-purple-600" : isModRole ? "bg-blue-600" : "bg-luxury-crimson"
              }`}>
                {isAdminRole ? "A" : isModRole ? "M" : "C"}
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-bold text-luxury-cream">{shortenAddress(address)}</p>
                <p className="text-[10px] text-luxury-gold capitalize">{authRole}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-luxury-dark">
        <header className="flex items-center justify-between px-10 py-8 sticky top-0 bg-luxury-dark/90 backdrop-blur-xl z-10 border-b border-luxury-gold/5">
          <div>
            <h2 className="text-3xl font-bold text-luxury-cream tracking-tight">Dashboard</h2>
            <p className="text-sm text-luxury-gold/60 mt-1">Real-time on-chain data from your circles.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/learn"
              className="flex items-center gap-2 text-luxury-gold text-xs font-bold border border-luxury-gold/20 px-5 py-2.5 rounded-xl hover:bg-luxury-gold/5 hover:border-luxury-gold/40 transition-all duration-300 uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-sm">school</span>
              How It Works
            </Link>
            <ConnectWallet />
          </div>
        </header>

        <div className="px-10 pb-12 space-y-10">
          {/* Not connected */}
          {!address && (
            <div className="luxury-glass p-12 rounded-custom text-center">
              <span className="material-symbols-outlined text-6xl text-luxury-gold mb-4 block">account_balance_wallet</span>
              <h3 className="text-2xl font-bold text-luxury-cream mb-2">Connect Your Wallet</h3>
              <p className="text-luxury-gold/60 mb-6">Connect MetaMask to view your circles and interact on-chain.</p>
              <ConnectWallet />
            </div>
          )}

          {/* Wrong Network */}
          {address && wrongNetwork && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-center gap-4">
              <span className="material-symbols-outlined text-red-400 text-3xl">warning</span>
              <div>
                <p className="text-red-300 font-bold">Wrong Network</p>
                <p className="text-slate-400 text-sm">Please switch MetaMask to Anvil (Chain ID 31337).</p>
              </div>
            </div>
          )}

          {address && !wrongNetwork && (
            <>
              {/* KPI Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4">
                <div className="luxury-glass p-8 flex flex-col gap-4 relative overflow-hidden group rounded-custom">
                  <p className="text-luxury-gold/60 text-xs font-bold uppercase tracking-widest">My Circles</p>
                  <p className="text-4xl font-extrabold text-luxury-cream">{myStats.groupCount}</p>
                </div>
                <div className="luxury-glass p-8 flex flex-col gap-4 relative overflow-hidden group rounded-custom">
                  <p className="text-luxury-gold/60 text-xs font-bold uppercase tracking-widest">Total Contributed</p>
                  <p className="text-4xl font-extrabold text-luxury-cream">{fmtEthSymbol(myStats.totalContributed)}</p>
                </div>
                <div className="luxury-glass p-8 flex flex-col gap-4 relative overflow-hidden group rounded-custom">
                  <p className="text-luxury-gold/60 text-xs font-bold uppercase tracking-widest">Active Loans</p>
                  <p className="text-4xl font-extrabold text-luxury-cream">{myStats.activeLoans}</p>
                </div>
                {isAdmin && (
                  <div className="luxury-glass p-8 flex flex-col gap-4 relative overflow-hidden group rounded-custom border border-luxury-crimson/20">
                    <p className="text-luxury-crimson text-xs font-bold uppercase tracking-widest">Platform Fees</p>
                    <p className="text-4xl font-extrabold text-luxury-cream">{fmtEthSymbol(platformBal)}</p>
                    {platformBal > 0n && (
                      <button
                        onClick={handleWithdraw}
                        disabled={loading}
                        className="mt-2 bg-luxury-crimson text-white py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 disabled:opacity-50"
                      >
                        Withdraw Fees
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Loading */}
              {fetching && (
                <div className="flex items-center justify-center py-12">
                  <span className="material-symbols-outlined text-4xl text-luxury-gold animate-spin">progress_activity</span>
                </div>
              )}

              {/* All Groups Table */}
              {!fetching && (
                <div className="luxury-glass p-8 rounded-custom">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="font-bold text-xl text-luxury-cream tracking-tight">
                      All Circles ({groups.length})
                    </h4>
                    {isAdminRole && (
                      <Link
                        href="/create"
                        className="text-luxury-gold text-xs font-bold border border-luxury-gold/20 px-4 py-2 rounded-full hover:bg-luxury-gold/5 transition-colors"
                      >
                        + Create New
                      </Link>
                    )}
                  </div>

                  {groups.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-5xl text-luxury-gold/20 mb-4 block">groups</span>
                      <p className="text-slate-400">No circles created yet.</p>
                      {isAdmin && (
                        <Link
                          href="/create"
                          className="inline-block mt-4 premium-gradient text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-widest"
                        >
                          Create First Circle
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="text-luxury-gold/40 text-[10px] uppercase font-black tracking-widest border-b border-luxury-gold/10">
                          <tr>
                            <th className="pb-5">ID</th>
                            <th className="pb-5">Type</th>
                            <th className="pb-5">Contribution</th>
                            <th className="pb-5">Members</th>
                            <th className="pb-5">Pool</th>
                            <th className="pb-5">Round</th>
                            <th className="pb-5">Status</th>
                            <th className="pb-5"></th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-luxury-cream">
                          {groups.map((g) => (
                            <tr key={g.id} className="border-b border-luxury-gold/5 hover:bg-luxury-gold/5 transition-colors">
                              <td className="py-6 font-bold">#{g.id}</td>
                              <td className="py-6">
                                <span className={`px-2 py-1 text-[10px] rounded-full font-black border ${
                                  g.poolType === 0
                                    ? "bg-luxury-crimson/10 text-luxury-crimson border-luxury-crimson/20"
                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                }`}>
                                  {poolTypeName(g.poolType)}
                                </span>
                              </td>
                              <td className="py-6 text-luxury-gold/80">{fmtEthSymbol(g.contributionAmount)}</td>
                              <td className="py-6">{g.memberCount} / {g.maxMembers}</td>
                              <td className="py-6 font-bold text-luxury-crimson">{fmtEthSymbol(g.poolAmount)}</td>
                              <td className="py-6">{g.currentRound}</td>
                              <td className="py-6">
                                {g.memberCount === 0 ? (
                                  <span className="px-3 py-1 text-[10px] rounded-full font-black border bg-slate-500/10 text-slate-400 border-slate-500/20">START</span>
                                ) : g.memberCount < g.maxMembers ? (
                                  <span className="px-3 py-1 text-[10px] rounded-full font-black border bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                                    ENROLLING
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 text-[10px] rounded-full font-black border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                                    LIVE
                                  </span>
                                )}
                              </td>
                              <td className="py-6">
                                <div className="flex flex-col gap-1.5 items-start">
                                  {g.isMember && (
                                    <span className="px-2 py-0.5 text-[9px] rounded-full font-black border bg-[#D5BF86]/10 text-[#D5BF86] border-[#D5BF86]/20 uppercase tracking-wider">✓ Enrolled</span>
                                  )}
                                  <Link
                                    href={`/circle/${g.id}`}
                                    className="text-luxury-gold text-xs font-bold hover:underline flex items-center gap-1"
                                  >
                                    View <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
