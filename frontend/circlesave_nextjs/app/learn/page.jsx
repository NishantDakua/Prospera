"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWeb3 } from "@/context/Web3Provider";
import { useAuth } from "@/context/AuthProvider";
import ConnectWallet from "@/views/ui/ConnectWallet";
import { shortenAddress } from "@/lib/utils";

import GameProgress from "@/components/simulator/ui/GameProgress";
import { useCoinSound } from "@/components/simulator/ui/useCoinSound";
import PoolLevel from "@/components/simulator/PoolLevel";
import BiddingLevel from "@/components/simulator/BiddingLevel";
import TrustLevel from "@/components/simulator/TrustLevel";
import CompletionLevel from "@/components/simulator/CompletionLevel";

const TOTAL_STEPS = 4;

export default function LearnPage() {
  const { address, isAdmin } = useWeb3();
  const { role: authRole, isModerator: isModRole, isAdmin: isAdminRole } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [unlockedStep, setUnlockedStep] = useState(1);
  const [simState, setSimState] = useState({});
  const [coins, setCoins] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);

  const playCoin = useCoinSound();
  const mainRef = useRef(null);

  const scrollToTop = useCallback(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleNext = useCallback(() => {
    setCurrentStep((s) => {
      const next = Math.min(s + 1, TOTAL_STEPS);
      setUnlockedStep((u) => Math.max(u, next));
      return next;
    });
    scrollToTop();
  }, [scrollToTop]);

  const handleUpdateState = useCallback((partial) => {
    setSimState((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleAction = useCallback((xp = 0) => {
    playCoin();
    setCoins((c) => c + 1);
    if (xp > 0) setEarnedXP((prev) => prev + xp);
  }, [playCoin]);

  const handleRestart = useCallback(() => {
    setCurrentStep(1);
    setUnlockedStep(1);
    setSimState({});
    setCoins(0);
    setEarnedXP(0);
    scrollToTop();
  }, [scrollToTop]);

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
              <h1 className="text-luxury-cream text-xl font-extrabold tracking-tight">Prospera</h1>
              <p className="text-luxury-gold/60 text-[10px] uppercase tracking-widest font-bold">On-Chain</p>
            </div>
          </Link>

          <nav className="flex flex-col gap-2">
            <Link href="/dashboard" className="flex items-center gap-4 px-5 py-3.5 transition-all rounded-xl text-luxury-gold hover:bg-luxury-gold/5">
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
            <Link href="/learn" className="flex items-center gap-4 px-5 py-3.5 transition-all rounded-xl nav-item-active">
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
      <main ref={mainRef} className="flex-1 overflow-y-auto bg-luxury-dark">

        {/* Sticky Header */}
        <header className="flex items-center justify-between px-10 py-8 sticky top-0 bg-luxury-dark/90 backdrop-blur-xl z-10 border-b border-luxury-gold/5">
          <div>
            <h2 className="text-3xl font-bold text-luxury-cream tracking-tight">How It Works</h2>
            <p className="text-sm text-luxury-gold/60 mt-1">Interactive guided simulator — no real funds involved.</p>
          </div>
          <div className="flex items-center gap-4">
            {currentStep > 1 && currentStep < TOTAL_STEPS && (
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 text-luxury-cream/40 text-xs font-bold border border-luxury-gold/10 px-4 py-2.5 rounded-xl hover:text-luxury-cream hover:border-luxury-gold/30 transition-all duration-300 uppercase tracking-widest"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Restart
              </button>
            )}
            <ConnectWallet />
          </div>
        </header>

        <div className="px-10 pb-16 pt-8 flex gap-8 max-w-7xl mx-auto">

          {/* Left side: Level content */}
          <div className="flex-1 luxury-glass p-8 rounded-custom h-fit">
            {currentStep === 1 && (
              <PoolLevel onNext={handleNext} onUpdateState={handleUpdateState} onAction={handleAction} />
            )}
            {currentStep === 2 && (
              <BiddingLevel onNext={handleNext} onUpdateState={handleUpdateState} onAction={handleAction} />
            )}
            {currentStep === 3 && (
              <TrustLevel onNext={handleNext} onUpdateState={handleUpdateState} onAction={handleAction} />
            )}
            {currentStep === 4 && (
              <CompletionLevel
                simState={simState}
                onClose={handleRestart}
                onAction={handleAction}
                isPage
              />
            )}
          </div>

          {/* Right side: Game Progress Bar */}
          <div className="w-[400px] shrink-0 sticky top-32 h-fit mt-[100px]">
            <GameProgress 
              currentStep={currentStep} 
              unlockedStep={unlockedStep}
              onSelectStep={setCurrentStep}
              totalXP={earnedXP} 
              coins={coins} 
            />
            
            {/* Footer note moved under the game progress */}
            <div className="mt-6 flex flex-col gap-3 px-2">
              <p className="text-luxury-cream/20 text-[10px] font-semibold uppercase tracking-widest text-center">
                Prospera · Simulation Mode · No real funds involved
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <p className="text-luxury-cream/30 text-[10px] font-semibold">Mock Data Only</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
