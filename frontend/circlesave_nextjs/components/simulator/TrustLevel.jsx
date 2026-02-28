"use client";

import { useState } from "react";
import SimCard from "./ui/Card";
import SimButton from "./ui/Button";
import FloatingXP, { useXPTrigger } from "./ui/FloatingXP";

/* ── Scenarios with narrative context ─────────────────────── */
const SCENARIOS = [
  {
    round: 1,
    label: "Month 1",
    title: "First Payment Due",
    story: "You won the pot last month via auction and received ₹45,000. Now it's time to continue contributing your ₹5,000 monthly installment. Your salary just came in and you have enough funds.",
    onTimeLabel: "Pay On Time",
    onTimeDesc: "Pay the ₹5,000 immediately. Build group trust.",
    delayLabel: "Delay Payment",
    delayDesc: "Hold the money a few extra days. The group gets nervous.",
    onTimeFeedback: "Excellent! The group sees you as reliable. Your reputation grows stronger.",
    delayFeedback: "The group is notified of your delay. Other members might hesitate to trust you in future pools.",
    onTimeDelta: 8,
    delayDelta: -12,
  },
  {
    round: 2,
    label: "Month 2",
    title: "An Unexpected Expense",
    story: "Your bike broke down and repairs cost ₹3,000. You still have enough to pay the ₹5,000 installment, but it means cutting other expenses this month. What do you do?",
    onTimeLabel: "Pay On Time Anyway",
    onTimeDesc: "Prioritize your commitment. Cut back on other things.",
    delayLabel: "Ask for Extension",
    delayDesc: "Delay payment by a week. The group has to adjust.",
    onTimeFeedback: "Impressive discipline! Members are talking about how reliable you are. You're becoming a trusted member.",
    delayFeedback: "The organizer flags your account. Your trust score takes a hit. Two delays and you could be removed.",
    onTimeDelta: 10,
    delayDelta: -15,
  },
  {
    round: 3,
    label: "Month 3",
    title: "A Friend Asks for Help",
    story: "A close friend needs ₹2,000 urgently and asks you for a loan. If you lend it, you won't have enough to cover this month's ₹5,000 installment on time. It's a tough choice.",
    onTimeLabel: "Pay the Pool First",
    onTimeDesc: "Your group commitment comes first. Help your friend later.",
    delayLabel: "Help Friend, Delay Pool",
    delayDesc: "Lend to your friend and delay the pool payment.",
    onTimeFeedback: "You honored your commitment! Your trust score is excellent. You'll get priority access to premium pools.",
    delayFeedback: "Your friend is grateful, but the pool members are not. Your trust score drops significantly.",
    onTimeDelta: 12,
    delayDelta: -18,
  },
];

/* ── Phase labels ─────────────────────────────────────────── */
const PHASE_LABELS = [
  { key: "learn",    label: "Learn",    icon: "menu_book" },
  { key: "simulate", label: "Simulate", icon: "sports_esports" },
  { key: "review",   label: "Review",   icon: "analytics" },
];

/* ── Phase bar ────────────────────────────────────────────── */
function PhaseBar({ current }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {PHASE_LABELS.map((p, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={p.key} className="flex items-center gap-2 flex-1 last:flex-none">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all duration-500 ${
                done
                  ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                  : active
                  ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30"
                  : "bg-white/[0.02] text-luxury-cream/25 border border-white/5"
              }`}
            >
              <span className="material-symbols-outlined text-[12px]">{done ? "check" : p.icon}</span>
              <span>{p.label}</span>
            </div>
            {i < PHASE_LABELS.length - 1 && (
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

/* ── Trust Meter visual ───────────────────────────────────── */
function TrustMeter({ score }) {
  const clamp = Math.max(0, Math.min(100, score));
  const color = clamp >= 70 ? "#10B981" : clamp >= 40 ? "#F59E0B" : "#EF4444";
  const label = clamp >= 70 ? "Excellent" : clamp >= 40 ? "Moderate" : "At Risk";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-luxury-cream/40 uppercase tracking-widest font-bold">Trust Score</p>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}40` }}
          >
            {label}
          </span>
          <p className="text-3xl font-extrabold transition-all duration-500" style={{ color }}>
            {clamp}
            <span className="text-sm font-semibold text-luxury-cream/40">/100</span>
          </p>
        </div>
      </div>

      <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${clamp}%`,
            backgroundColor: color,
            boxShadow: `0 0 12px ${color}66`,
          }}
        />
        {/* Threshold markers */}
        <div className="absolute top-0 h-full w-px bg-white/10" style={{ left: "40%" }} />
        <div className="absolute top-0 h-full w-px bg-white/10" style={{ left: "70%" }} />
      </div>

      <div className="flex justify-between text-[9px] text-luxury-cream/30 font-bold uppercase tracking-widest mt-0.5">
        <span>At Risk</span>
        <span>Moderate</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

export default function TrustLevel({ onNext, onUpdateState, onAction }) {
  const [phase, setPhase] = useState(0);          // 0=learn, 1=simulate, 2=review
  const [trustScore, setTrustScore] = useState(50);
  const [currentRound, setCurrentRound] = useState(0);
  const [history, setHistory] = useState([]);
  const [showFeedback, setShowFeedback] = useState(null);
  const [simDone, setSimDone] = useState(false);
  const { showXP, triggerXP } = useXPTrigger();

  const handleChoice = (onTime) => {
    const scenario = SCENARIOS[currentRound];
    const delta = onTime ? scenario.onTimeDelta : scenario.delayDelta;
    const newScore = Math.max(0, Math.min(100, trustScore + delta));
    const feedback = onTime ? scenario.onTimeFeedback : scenario.delayFeedback;

    setTrustScore(newScore);
    setShowFeedback({ onTime, text: feedback, delta });
    setHistory((prev) => [
      ...prev,
      {
        label: scenario.label,
        title: scenario.title,
        status: onTime ? "On Time" : "Delayed",
        delta,
        score: newScore,
      },
    ]);

    onAction?.(onTime ? 15 : 0);
  };

  const advanceRound = () => {
    setShowFeedback(null);
    if (currentRound + 1 >= SCENARIOS.length) {
      setSimDone(true);
      const finalHistory = history;
      const finalScore = trustScore;
      onUpdateState({ finalTrustScore: finalScore, paymentHistory: finalHistory });
      triggerXP();
      onAction?.(100);
      setPhase(2);
    } else {
      setCurrentRound((p) => p + 1);
    }
  };

  const scenario = SCENARIOS[currentRound];

  return (
    <div className="flex flex-col gap-8">
      {/* Header – arcade style */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest"
            style={{
              background: "#1A2D50",
              border: "2px solid #10B981",
              color: "#10B981",
              boxShadow: "0 0 10px #10B98155, inset 0 0 8px #10B98111",
              fontFamily: "monospace",
            }}
          >
            <span>★</span> WORLD 1-3
          </div>
          <span className="text-[#10B981] text-xs font-extrabold">+100 XP</span>
        </div>
        <h2 className="text-2xl font-extrabold text-luxury-cream tracking-tight">Level 3: Lending & Trust</h2>
        <p className="text-luxury-cream/50 text-sm leading-relaxed">
          After winning a pot, you must continue your monthly payments. Your choices shape your reputation.
        </p>
      </div>

      {/* Phase bar */}
      <PhaseBar current={phase} />

      {/* ═══════ PHASE 0 — Learn ═══════════════════════════ */}
      {phase === 0 && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <div className="flex items-start gap-3 p-5 rounded-xl bg-[#10B981]/5 border border-[#10B981]/15">
            <span className="material-symbols-outlined text-xl mt-0.5 text-[#10B981]">menu_book</span>
            <div className="flex flex-col gap-2">
              <p className="text-[#10B981] text-xs font-extrabold uppercase tracking-widest">Why Trust Matters</p>
              <p className="text-luxury-cream/60 text-sm leading-relaxed">
                When you win the pot early, the remaining months you're essentially <span className="text-[#10B981] font-bold">repaying a loan</span> to the group.
                Your payment reliability directly affects your <span className="text-[#10B981] font-bold">Trust Score</span> — both in the group and on-chain.
              </p>
            </div>
          </div>

          <SimCard>
            <div className="flex flex-col gap-4">
              <p className="text-xs text-luxury-cream/40 font-bold uppercase tracking-widest">What Your Trust Score Determines</p>

              <div className="flex flex-col gap-3">
                {[
                  { icon: "lock_open", title: "Access to Premium Pools", desc: "High trust unlocks pools with larger payouts and better members.", color: "#10B981" },
                  { icon: "diamond", title: "Lower Collateral", desc: "Trusted members need less collateral to join new circles.", color: "#D5BF86" },
                  { icon: "group", title: "Community Standing", desc: "Your on-chain reputation is visible to all. Members prefer reliable people.", color: "#F59E0B" },
                  { icon: "warning", title: "Risk of Removal", desc: "Repeated delays can get you removed from circles and blacklisted.", color: "#EF4444" },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]"
                  >
                    <div
                      className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0"
                      style={{ backgroundColor: `${item.color}18`, border: `2px solid ${item.color}40` }}
                    >
                      <span className="material-symbols-outlined text-base" style={{ color: item.color }}>{item.icon}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-luxury-cream text-sm font-extrabold">{item.title}</p>
                      <p className="text-luxury-cream/50 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SimCard>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#D5BF86]/5 border border-[#D5BF86]/15">
            <span className="material-symbols-outlined text-base text-luxury-gold">sports_esports</span>
            <p className="text-luxury-cream/60 text-xs leading-relaxed">
              <span className="text-luxury-gold font-bold">Up next:</span> You'll face 3 real-life payment scenarios. Each choice affects your trust score. There's no wrong answer — the goal is to learn how trust scoring works!
            </p>
          </div>

          <div className="flex justify-end">
            <SimButton onClick={() => setPhase(1)} variant="primary">
              Start the Simulation
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </SimButton>
          </div>
        </div>
      )}

      {/* ═══════ PHASE 1 — Simulate ════════════════════════ */}
      {phase === 1 && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Trust meter always visible */}
          <SimCard highlight>
            <TrustMeter score={trustScore} />
          </SimCard>

          {/* Round indicator */}
          <div className="flex items-center gap-3">
            {SCENARIOS.map((s, i) => {
              const done = i < currentRound || (i === currentRound && showFeedback);
              const active = i === currentRound && !showFeedback;
              return (
                <div key={i} className="flex items-center gap-3 flex-1 last:flex-none">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all duration-500 ${
                      done
                        ? history[i]?.delta > 0
                          ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                          : "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                        : active
                        ? "bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30"
                        : "bg-white/[0.02] text-luxury-cream/25 border border-white/5"
                    }`}
                  >
                    {done ? (history[i]?.delta > 0 ? "✓" : "✗") : s.round}
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < SCENARIOS.length - 1 && (
                    <div
                      className="flex-1 h-0.5 rounded-full"
                      style={{ backgroundColor: done ? (history[i]?.delta > 0 ? "#10B981" : "#EF4444") : "#1F2937" }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Scenario card */}
          {!showFeedback ? (
            <SimCard>
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-luxury-cream/40 font-bold uppercase tracking-widest">
                    {scenario.label}
                  </span>
                  <span className="bg-luxury-gold/10 text-luxury-gold text-[10px] font-black px-2 py-0.5 rounded-full">
                    ₹5,000 Due
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-luxury-cream mb-2">{scenario.title}</h3>
                  <p className="text-luxury-cream/60 text-sm leading-relaxed">{scenario.story}</p>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  <button
                    onClick={() => handleChoice(true)}
                    className="flex items-center justify-between w-full bg-[#10B981]/8 hover:bg-[#10B981]/15 border-2 border-[#10B981]/25 hover:border-[#10B981]/60 text-[#10B981] px-5 py-4 rounded-xl transition-all duration-300 cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-extrabold text-sm">{scenario.onTimeLabel}</span>
                      <span className="text-[10px] opacity-70 text-left">{scenario.onTimeDesc}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold">+{scenario.onTimeDelta}</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleChoice(false)}
                    className="flex items-center justify-between w-full bg-[#EF4444]/8 hover:bg-[#EF4444]/15 border-2 border-[#EF4444]/25 hover:border-[#EF4444]/60 text-[#EF4444] px-5 py-4 rounded-xl transition-all duration-300 cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-extrabold text-sm">{scenario.delayLabel}</span>
                      <span className="text-[10px] opacity-70 text-left">{scenario.delayDesc}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold">{scenario.delayDelta}</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </div>
                  </button>
                </div>
              </div>
            </SimCard>
          ) : (
            /* Feedback card */
            <SimCard>
              <div className="flex flex-col gap-4 py-2">
                <div
                  className={`flex items-start gap-3 p-4 rounded-xl border ${
                    showFeedback.onTime
                      ? "bg-[#10B981]/8 border-[#10B981]/25"
                      : "bg-[#EF4444]/8 border-[#EF4444]/25"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl" style={{ color: showFeedback.onTime ? '#10B981' : '#EF4444' }}>{showFeedback.onTime ? "check_circle" : "warning"}</span>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-extrabold"
                        style={{ color: showFeedback.onTime ? "#10B981" : "#EF4444" }}
                      >
                        {showFeedback.onTime ? "Great Choice!" : "Risky Move"}
                      </span>
                      <span
                        className="text-xs font-black px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: showFeedback.onTime ? "#10B98118" : "#EF444418",
                          color: showFeedback.onTime ? "#10B981" : "#EF4444",
                        }}
                      >
                        {showFeedback.delta > 0 ? `+${showFeedback.delta}` : showFeedback.delta} Trust
                      </span>
                    </div>
                    <p className="text-luxury-cream/60 text-sm leading-relaxed">{showFeedback.text}</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <SimButton onClick={advanceRound} variant="primary">
                    {currentRound + 1 >= SCENARIOS.length ? "See Final Results" : "Next Scenario"}
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </SimButton>
                </div>
              </div>
            </SimCard>
          )}

          {/* History log */}
          {history.length > 0 && (
            <SimCard>
              <p className="text-xs text-luxury-cream/40 font-bold uppercase tracking-widest mb-3">Payment History</p>
              <div className="flex flex-col gap-2">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm ${
                      h.delta > 0
                        ? "bg-[#10B981]/5 border-[#10B981]/20"
                        : "bg-[#EF4444]/5 border-[#EF4444]/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={h.delta > 0 ? "text-[#10B981]" : "text-[#EF4444]"}>
                        {h.delta > 0 ? "✓" : "✗"}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-luxury-cream text-xs font-bold">{h.title}</span>
                        <span className="text-luxury-cream/40 text-[10px]">{h.label} · {h.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-extrabold ${h.delta > 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
                      >
                        {h.delta > 0 ? `+${h.delta}` : h.delta}
                      </span>
                      <span className="text-luxury-cream/30 text-[10px]">→ {h.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SimCard>
          )}
        </div>
      )}

      {/* ═══════ PHASE 2 — Review ══════════════════════════ */}
      {phase === 2 && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <SimCard highlight>
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <span className="material-symbols-outlined text-4xl mb-2" style={{ color: trustScore >= 70 ? '#10B981' : trustScore >= 40 ? '#F59E0B' : '#EF4444' }}>
                {trustScore >= 70 ? "star" : trustScore >= 40 ? "thumb_up" : "warning"}
              </span>
              <h3 className="text-xl font-extrabold text-luxury-cream">Simulation Complete!</h3>
              <TrustMeter score={trustScore} />
            </div>
          </SimCard>

          {/* History review */}
          <SimCard>
            <p className="text-xs text-luxury-cream/40 font-bold uppercase tracking-widest mb-4">Your Decisions</p>
            <div className="flex flex-col gap-3">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    h.delta > 0
                      ? "bg-[#10B981]/5 border-[#10B981]/20"
                      : "bg-[#EF4444]/5 border-[#EF4444]/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-base" style={{ color: h.delta > 0 ? '#10B981' : '#EF4444' }}>{h.delta > 0 ? "check_circle" : "warning"}</span>
                    <div className="flex flex-col">
                      <span className="text-luxury-cream text-sm font-bold">{h.title}</span>
                      <span className="text-luxury-cream/40 text-[10px]">{h.label} · {h.status}</span>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-extrabold ${h.delta > 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
                  >
                    {h.delta > 0 ? `+${h.delta}` : h.delta}
                  </span>
                </div>
              ))}
            </div>
          </SimCard>

          {/* Key insight */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#10B981]/5 border border-[#10B981]/15">
            <span className="material-symbols-outlined text-base text-[#10B981]">lightbulb</span>
            <div className="flex flex-col gap-1">
              <p className="text-[#10B981] text-xs font-extrabold uppercase tracking-widest">Key Insight</p>
              <p className="text-luxury-cream/60 text-xs leading-relaxed">
                On Prospera, your trust score is <span className="text-[#10B981] font-bold">recorded on-chain</span>.
                It follows you across all circles. Consistent on-time payments build a reputation that unlocks bigger pools,
                lower collateral, and the trust of fellow members. Think of it as your <span className="text-[#10B981] font-bold">financial credit score</span> — but transparent and community-driven.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <FloatingXP xp={100} show={showXP} />
            <SimButton onClick={onNext} variant="primary">
              View Final Results
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </SimButton>
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
