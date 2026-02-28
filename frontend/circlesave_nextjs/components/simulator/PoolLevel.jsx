"use client";

import { useState } from "react";
import SimCard from "./ui/Card";
import SimButton from "./ui/Button";
import FloatingXP, { useXPTrigger } from "./ui/FloatingXP";

const POOL_CONFIG = {
  members: 10,
  contribution: 5000,
  duration: 10,
};

/* ── Phases of this guided tutorial ────────────────────────── */
const PHASES = [
  { key: "learn",   label: "Learn",   icon: "menu_book" },
  { key: "explore", label: "Explore", icon: "search" },
  { key: "join",    label: "Join",    icon: "sports_esports" },
];

/* ── Tooltip helper ────────────────────────────────────────── */
function Tooltip({ label, explanation }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center gap-1">
      <span className="text-luxury-cream/50 text-xs font-semibold">{label}</span>
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((p) => !p)}
        className="w-4 h-4 rounded-full border border-luxury-gold/30 text-luxury-gold text-[9px] font-black flex items-center justify-center hover:bg-luxury-gold/10 transition-colors"
      >
        ?
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-luxury-dark border border-luxury-gold/20 rounded-xl p-3 z-50 shadow-xl">
          <p className="text-[11px] text-luxury-cream leading-relaxed">{explanation}</p>
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-luxury-dark border-r border-b border-luxury-gold/20 rotate-45" />
        </div>
      )}
    </span>
  );
}

/* ── Phase indicator bar ───────────────────────────────────── */
function PhaseBar({ current }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {PHASES.map((p, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={p.key} className="flex items-center gap-2 flex-1 last:flex-none">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all duration-500 ${
                done
                  ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                  : active
                  ? "bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30"
                  : "bg-white/[0.02] text-luxury-cream/25 border border-white/5"
              }`}
            >
              <span className="material-symbols-outlined text-[12px]">{done ? "check" : p.icon}</span>
              <span>{p.label}</span>
            </div>
            {i < PHASES.length - 1 && (
              <div
                className="flex-1 h-0.5 rounded-full transition-colors duration-500"
                style={{ backgroundColor: done ? "#10B981" : "#1F2937" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PoolLevel({ onNext, onUpdateState, onAction }) {
  const [phase, setPhase] = useState(0);       // 0=learn, 1=explore, 2=join
  const [joined, setJoined] = useState(false);
  const [revealedCards, setRevealedCards] = useState([]);
  const poolValue = POOL_CONFIG.members * POOL_CONFIG.contribution;
  const { showXP, triggerXP } = useXPTrigger();

  const revealCard = (id) => {
    if (!revealedCards.includes(id)) {
      setRevealedCards((prev) => [...prev, id]);
      onAction?.(10);      // small XP for exploring
    }
  };

  const allRevealed = revealedCards.length >= 3;

  const handleJoin = () => {
    setJoined(true);
    onUpdateState({ poolConfig: POOL_CONFIG, poolValue });
    triggerXP();
    onAction?.(50);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header – arcade style */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest"
            style={{
              background: "#1A2D50",
              border: "2px solid #D5BF86",
              color: "#D5BF86",
              boxShadow: "0 0 10px #D5BF8655, inset 0 0 8px #D5BF8611",
              fontFamily: "monospace",
            }}
          >
            <span>★</span> WORLD 1-1
          </div>
          <span className="text-[#10B981] text-xs font-extrabold">+50 XP</span>
        </div>
        <h2 className="text-2xl font-extrabold text-luxury-cream tracking-tight">Join a Pool</h2>
        <p className="text-luxury-cream/50 text-sm leading-relaxed">
          Begin your chit fund journey. Follow the guided steps below to understand how a pool works.
        </p>
      </div>

      {/* Phase bar */}
      <PhaseBar current={phase} />

      {/* ═══════ PHASE 0 — Learn ═══════════════════════════ */}
      {phase === 0 && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <div className="flex items-start gap-3 p-5 rounded-xl bg-[#D5BF86]/5 border border-[#D5BF86]/15">
            <span className="material-symbols-outlined text-xl mt-0.5 text-[#D5BF86]">menu_book</span>
            <div className="flex flex-col gap-2">
              <p className="text-[#D5BF86] text-xs font-extrabold uppercase tracking-widest">What is a Chit Fund?</p>
              <p className="text-luxury-cream/60 text-sm leading-relaxed">
                A chit fund (or <span className="text-luxury-gold font-bold">circle</span>) is a <span className="text-luxury-gold font-bold">rotating savings group</span>. Members contribute a fixed amount each month. Every month, the pooled money goes to one member through an auction.
              </p>
            </div>
          </div>

          <SimCard>
            <div className="flex flex-col gap-4">
              <p className="text-xs text-luxury-cream/40 font-bold uppercase tracking-widest">How It Works — Step by Step</p>

              <div className="flex flex-col gap-3">
                {[
                  { num: "1", title: "Everyone Contributes", desc: "Each member puts in a fixed amount every month (e.g., ₹5,000). This creates the monthly pot.", color: "#D5BF86" },
                  { num: "2", title: "One Member Gets the Pot", desc: "Every month, one member receives the full pooled amount. They're chosen through an auction (you'll learn about this next!).", color: "#F59E0B" },
                  { num: "3", title: "Everyone Benefits", desc: "If you receive early, it's like a low-cost loan. If you receive later, the discounts from auctions give you extra profit.", color: "#10B981" },
                ].map((step) => (
                  <div
                    key={step.num}
                    className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]"
                  >
                    <div
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-black shrink-0"
                      style={{ backgroundColor: `${step.color}18`, color: step.color, border: `2px solid ${step.color}40` }}
                    >
                      {step.num}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-luxury-cream text-sm font-extrabold">{step.title}</p>
                      <p className="text-luxury-cream/50 text-xs leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SimCard>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#10B981]/5 border border-[#10B981]/15">
            <span className="material-symbols-outlined text-base text-[#10B981]">sports_esports</span>
            <p className="text-luxury-cream/60 text-xs leading-relaxed">
              <span className="text-[#10B981] font-bold">No real money involved!</span> This is a safe simulation. Explore at your own pace — earn XP as you learn each concept.
            </p>
          </div>

          <div className="flex justify-end">
            <SimButton onClick={() => setPhase(1)} variant="primary">
              Got It! Let Me Explore
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </SimButton>
          </div>
        </div>
      )}

      {/* ═══════ PHASE 1 — Explore ═════════════════════════ */}
      {phase === 1 && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/15">
            <span className="material-symbols-outlined text-base text-[#F59E0B]">search</span>
            <p className="text-luxury-cream/60 text-xs leading-relaxed">
              <span className="text-[#F59E0B] font-bold">Tap each card below</span> to reveal the details of this pool. Discover what Members, Contributions, and Duration mean.
            </p>
          </div>

          <SimCard highlight>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] text-luxury-cream/40 uppercase tracking-widest font-bold">Virtual Pool</p>
                <h3 className="text-lg font-extrabold text-luxury-cream mt-0.5">Prospera Circle #1</h3>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="bg-[#10B981]/10 text-[#10B981] text-[10px] font-black border border-[#10B981]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Enrolling
                </span>
                <span className="text-luxury-cream/30 text-[10px]">Simulation only</span>
              </div>
            </div>

            {/* Clickable reveal cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { id: "members",      label: "Members",      value: POOL_CONFIG.members, unit: "Participants", tooltip: "The total number of people in this pool. Each contributes monthly.", color: "#D5BF86" },
                { id: "contribution", label: "Contribution", value: `₹${POOL_CONFIG.contribution.toLocaleString()}`, unit: "Per Month", tooltip: "The fixed amount each member deposits every month into the shared pot.", color: "#F59E0B" },
                { id: "duration",     label: "Duration",     value: POOL_CONFIG.duration, unit: "Months", tooltip: "How many months the pool runs. Each month a different member receives the pot.", color: "#10B981" },
              ].map((card) => {
                const revealed = revealedCards.includes(card.id);
                return (
                  <button
                    key={card.id}
                    onClick={() => revealCard(card.id)}
                    className={`flex flex-col gap-2 rounded-xl p-4 border transition-all duration-500 text-left cursor-pointer ${
                      revealed
                        ? "bg-[#0F0F14] border-luxury-gold/10"
                        : "bg-luxury-gold/5 border-luxury-gold/20 hover:border-luxury-gold/40 hover:scale-[1.02]"
                    }`}
                  >
                    {revealed ? (
                      <>
                        <Tooltip label={card.label} explanation={card.tooltip} />
                        <p className="text-3xl font-extrabold" style={{ color: card.color }}>{card.value}</p>
                        <p className="text-[10px] text-luxury-cream/40 uppercase tracking-wider font-semibold">{card.unit}</p>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 gap-2">
                        <span className="material-symbols-outlined text-xl text-luxury-gold">help</span>
                        <p className="text-[10px] text-luxury-gold font-bold uppercase tracking-widest">Tap to Reveal</p>
                        <p className="text-[10px] text-luxury-cream/30">{card.label}</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Total Pool Value — appears after all revealed */}
            {allRevealed && (
              <div className="rounded-xl bg-luxury-gold/5 border border-luxury-gold/20 p-5 flex items-center justify-between animate-fadeIn">
                <div className="flex flex-col gap-0.5">
                  <Tooltip
                    label="Total Pool Value"
                    explanation="Each month, all contributions are pooled. One member receives this total through an auction."
                  />
                  <p className="text-3xl font-extrabold text-luxury-gold mt-1">
                    ₹{poolValue.toLocaleString()}
                  </p>
                </div>
                <div className="text-right flex flex-col gap-0.5">
                  <p className="text-[10px] text-luxury-cream/40 uppercase tracking-wider font-bold">Monthly Payout</p>
                  <p className="text-sm text-luxury-cream/50 font-semibold">
                    {POOL_CONFIG.members} × ₹{POOL_CONFIG.contribution.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </SimCard>

          {/* Member preview */}
          <SimCard>
            <p className="text-xs text-luxury-cream/40 font-bold uppercase tracking-widest mb-4">Pool Members</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: POOL_CONFIG.members }).map((_, i) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border transition-all duration-300 ${
                    i === 0
                      ? "bg-luxury-gold border-luxury-gold text-luxury-dark"
                      : "bg-[#0F0F14] border-luxury-gold/10 text-luxury-cream/40"
                  }`}
                >
                  {i === 0 ? "You" : `M${i + 1}`}
                </div>
              ))}
            </div>
          </SimCard>

          {/* Progress + next */}
          <div className="flex items-center justify-between">
            <p className="text-luxury-cream/30 text-xs font-semibold">
              <span className="text-luxury-gold">{revealedCards.length}/3</span> concepts discovered
            </p>
            {allRevealed ? (
              <SimButton onClick={() => setPhase(2)} variant="primary">
                I Understand! Let Me Join
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </SimButton>
            ) : (
              <p className="text-luxury-cream/20 text-xs italic">Reveal all cards to continue...</p>
            )}
          </div>
        </div>
      )}

      {/* ═══════ PHASE 2 — Join ════════════════════════════ */}
      {phase === 2 && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <SimCard highlight>
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <span className="material-symbols-outlined text-4xl text-luxury-gold">celebration</span>
              <h3 className="text-xl font-extrabold text-luxury-cream">Ready to Join?</h3>
              <p className="text-luxury-cream/50 text-sm leading-relaxed max-w-md">
                You've learned how a chit fund pool works. Now commit your first contribution of
                <span className="text-luxury-gold font-bold"> ₹{POOL_CONFIG.contribution.toLocaleString()}/month</span> and join
                Prospera Circle #1 with {POOL_CONFIG.members - 1} other members.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-luxury-cream/40">
                <span className="flex items-center gap-1.5 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-sm text-luxury-gold/60">group</span> {POOL_CONFIG.members} members
                </span>
                <span className="flex items-center gap-1.5 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-sm text-luxury-gold/60">payments</span> ₹{POOL_CONFIG.contribution.toLocaleString()}/mo
                </span>
                <span className="flex items-center gap-1.5 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-sm text-luxury-gold/60">calendar_month</span> {POOL_CONFIG.duration} months
                </span>
                <span className="flex items-center gap-1.5 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-sm text-luxury-gold/60">emoji_events</span> ₹{poolValue.toLocaleString()} pot
                </span>
              </div>
            </div>
          </SimCard>

          <div className="relative flex items-center justify-between pt-2">
            <FloatingXP xp={50} show={showXP} />
            {!joined ? (
              <SimButton onClick={handleJoin} variant="primary">
                <span className="material-symbols-outlined text-base">sports_esports</span>
                Join the Pool — Earn 50 XP
              </SimButton>
            ) : (
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold"
                  style={{ background: "#10B98120", border: "2px solid #10B98155", color: "#10B981" }}
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Pool Joined — +50 XP
                </div>
                <SimButton onClick={onNext} variant="primary">
                  Next Level
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </SimButton>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fade-in animation style */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}
