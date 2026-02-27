"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseEther } from "ethers";
import { useWeb3 } from "@/context/Web3Provider";
import useContract from "@/hooks/useContract";
import ConnectWallet from "@/views/ui/ConnectWallet";

export default function CreateGroupPage() {
  const router = useRouter();
  const { address, isAdmin, wrongNetwork } = useWeb3();
  const { createGroup, loading } = useContract();

  const [contribution, setContribution] = useState("");
  const [maxMembers, setMaxMembers] = useState("5");
  const [poolType, setPoolType] = useState("0"); // 0=Auction, 1=LuckyDraw

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contribution || !maxMembers) return;
    if (wrongNetwork) return;

    const contribWei = parseEther(contribution);
    await createGroup(contribWei, Number(maxMembers), Number(poolType), () => {
      router.push("/dashboard");
    });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-dark font-display text-slate-100">
      {/* Decorative backgrounds */}
      <div className="fixed top-0 right-0 -z-10 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full" />
      <div className="fixed bottom-0 left-0 -z-10 w-1/3 h-1/3 bg-accent-gold/5 blur-[100px] rounded-full" />

      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/20 px-10 py-4 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-primary rounded flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
          <h2 className="text-slate-100 text-xl font-extrabold leading-tight tracking-tight uppercase">CircleSave</h2>
        </div>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-8 mr-6">
            <Link className="text-slate-400 hover:text-primary transition-colors text-sm font-semibold uppercase tracking-wider" href="/dashboard">Dashboard</Link>
          </nav>
          <ConnectWallet />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="mb-10 px-4">
            <div className="flex justify-between items-end mb-3">
              <div>
                <span className="text-primary font-bold text-xs uppercase tracking-widest">Create Circle</span>
                <h3 className="text-slate-100 text-lg font-bold">On-Chain Group Setup</h3>
              </div>
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
                <p className="text-slate-400">
                  {isAdmin
                    ? "Deploy a new savings circle to the blockchain."
                    : "Only the contract admin can create groups."}
                </p>
              </div>

              {!address && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 text-center">
                  <p className="text-slate-300 mb-4">Connect your wallet to create a circle.</p>
                  <ConnectWallet />
                </div>
              )}

              {address && !isAdmin && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
                  <span className="material-symbols-outlined text-red-400 text-4xl mb-2">lock</span>
                  <p className="text-red-300 font-bold">Admin Access Required</p>
                  <p className="text-slate-400 text-sm mt-2">Only the contract deployer can create groups.</p>
                </div>
              )}

              {address && isAdmin && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Contribution Amount */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                      Contribution Amount (ETH)
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-accent-gold">
                        <span className="material-symbols-outlined">payments</span>
                      </div>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-4 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                        placeholder="0.1"
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={contribution}
                        onChange={(e) => setContribution(e.target.value)}
                        required
                      />
                      <div className="absolute right-4 text-slate-500 font-bold text-sm">ETH</div>
                    </div>
                  </div>

                  {/* Max Members */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                      Maximum Members
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-slate-500">
                        <span className="material-symbols-outlined">group</span>
                      </div>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-4 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                        placeholder="5"
                        type="number"
                        min="2"
                        max="20"
                        value={maxMembers}
                        onChange={(e) => setMaxMembers(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Pool Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                      Pool Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPoolType("0")}
                        className={`p-5 rounded-xl border transition-all text-left ${
                          poolType === "0"
                            ? "bg-primary/20 border-primary text-white"
                            : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl mb-2 block">gavel</span>
                        <span className="font-bold text-sm block">Auction</span>
                        <span className="text-xs opacity-60">Lowest bid wins the pot</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPoolType("1")}
                        className={`p-5 rounded-xl border transition-all text-left ${
                          poolType === "1"
                            ? "bg-primary/20 border-primary text-white"
                            : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl mb-2 block">casino</span>
                        <span className="font-bold text-sm block">Lucky Draw</span>
                        <span className="text-xs opacity-60">Random winner (ROSCA)</span>
                      </button>
                    </div>
                  </div>

                  {/* Economic Preview */}
                  {contribution && maxMembers && (
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-accent-gold mb-4">Economic Preview</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Gross Pool (per round)</span>
                        <span className="text-white font-bold">
                          {(parseFloat(contribution) * parseInt(maxMembers || 0)).toFixed(4)} ETH
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Platform Fee (10%)</span>
                        <span className="text-red-400 font-bold">
                          -{(parseFloat(contribution) * parseInt(maxMembers || 0) * 0.1).toFixed(4)} ETH
                        </span>
                      </div>
                      <div className="border-t border-white/10 pt-3 flex justify-between text-sm">
                        <span className="text-slate-300 font-bold">Net Payout</span>
                        <span className="text-emerald-400 font-bold">
                          {(parseFloat(contribution) * parseInt(maxMembers || 0) * 0.9).toFixed(4)} ETH
                        </span>
                      </div>
                    </div>
                  )}

                  {wrongNetwork && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                      <span className="material-symbols-outlined text-red-400">warning</span>
                      <p className="text-red-300 text-sm font-bold">Switch to Anvil (Chain ID 31337) to continue.</p>
                    </div>
                  )}

                  <div className="pt-6 flex items-center justify-between">
                    <Link
                      href="/dashboard"
                      className="text-slate-400 hover:text-slate-100 transition-colors font-bold uppercase text-sm tracking-widest flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">arrow_back</span>
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={loading || wrongNetwork}
                      className="bg-primary hover:bg-primary/90 text-white font-bold uppercase text-sm tracking-widest px-10 py-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                          Creating…
                        </>
                      ) : (
                        <>
                          Deploy Circle
                          <span className="material-symbols-outlined text-lg">rocket_launch</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 flex items-center justify-center gap-8 text-slate-500 text-xs uppercase tracking-widest font-bold">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
              On-Chain Transaction
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">encrypted</span>
              Smart Contract Secured
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
