"use client";

import { useState } from "react";
import SimCard from "./ui/Card";
import SimButton from "./ui/Button";
import FloatingXP, { useXPTrigger } from "./ui/FloatingXP";

const ROUNDS = [
  { round: 1, label: "Month 1" },
  { round: 2, label: "Month 2" },
  { round: 3, label: "Month 3" },
];

function TrustMeter({ score }) {
  const clamp = Math.max(0, Math.min(100, score));
  const color =
    clamp >= 70 ? "#10B981" : clamp >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-luxury-cream/40 uppercase tracking-widest font-bold">Trust Score</p>
        <p
          className="text-3xl font-extrabold transition-all duration-500"
          style={{ color }}
        >
          {clamp}
          <span className="text-sm font-semibold text-luxury-cream/40">/100</span>
        </p>
      </div>

      <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${clamp}%`, backgroundColor: color }}
        />
      </div>

      <div className="flex justify-between text-[9px] text-luxury-cream/30 font-bold uppercase tracking-widest mt-0.5">
        <span>Low Risk</span>
        <span>Moderate</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

export default function TrustLevel({ onNext, onUpdateState, onAction }) {
  const [trustScore, setTrustScore] = useState(60);
  const [currentRound, setCurrentRound] = useState(0);
  const [history, setHistory] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [done, setDone] = useState(false);
  const { showXP, triggerXP } = useXPTrigger();

  const handleChoice = (onTime) => {
    const delta = onTime ? 5 : -10;
    const newScore = Math.max(0, Math.min(100, trustScore + delta));
    const round = ROUNDS[currentRound];

    setLastAction(onTime ? "ontime" : "late");
    setTrustScore(newScore);
    setHistory((prev) => [
      ...prev,
      {
        label: round.label,
        status: onTime ? "On Time" : "Delayed",
        delta,
        score: newScore,
      },
    ]);

    if (currentRound + 1 >= ROUNDS.length) {
      setDone(true);
      onUpdateState({ finalTrustScore: newScore, paymentHistory: [...history, { label: round.label, status: onTime ? "On Time" : "Delayed", delta, score: newScore }] });
      triggerXP();
      onAction?.(100);
    } else {
      setCurrentRound((p) => p + 1);
      onAction?.(0);
      setTimeout(() => setLastAction(null), 1200);
    }
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
          Once you win a pot, you are essentially taking a loan from the group. Your Trust Score reflects your reliability in paying back the remaining installments.
        </p>
      </div>

      {/* Educational callout */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#10B981]/5 border border-[#10B981]/15">
        <span className="text-xl mt-0.5">💡</span>
        <div className="flex flex-col gap-1">
          <p className="text-[#10B981] text-xs font-extrabold uppercase tracking-widest">Why Trust Matters</p>
          <p className="text-luxury-cream/60 text-xs leading-relaxed">
            When you win the pot early, the remaining months you’re essentially <span className="text-[#10B981] font-bold">repaying a loan</span> to the group. If you delay or skip payments, your trust score drops and you may be excluded from future circles. On Prospera, this is tracked on-chain — your reputation is permanent and visible to all.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trust Meter Card */}
        <SimCard highlight>
          <TrustMeter score={trustScore} />

          <div className="mt-6 space-y-2">
            {history.map((h, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all duration-300 ${
                  h.delta > 0
                    ? "bg-[#10B981]/5 border-[#10B981]/20"
                    : "bg-[#EF4444]/5 border-[#EF4444]/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={h.delta > 0 ? "text-[#10B981]" : "text-[#EF4444]"}>
                    {h.delta > 0 ? "✓" : "✗"}
                  </span>
                  <span className="text-luxury-cream/50 text-xs font-semibold">{h.label}</span>
                  <span className={`text-xs font-bold ${h.delta > 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                    {h.status}
                  </span>
                </div>
                <span
                  className={`text-xs font-extrabold ${h.delta > 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
                >
                  {h.delta > 0 ? `+${h.delta}` : h.delta}
                </span>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-luxury-cream/20 text-xs text-center py-4">No payments recorded yet.</p>
            )}
          </div>
        </SimCard>

        {/* Decision Card */}
        <div className="flex flex-col gap-4">
          {/* Feedback banner */}
          {lastAction && (
            <div
              className={`px-4 py-3 rounded-xl border text-sm font-bold text-center animate-pulse ${
                lastAction === "ontime"
                  ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
                  : "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]"
              }`}
            >
              {lastAction === "ontime" ? "Great! Trust Score increased." : "Warning! Trust Score dropped."}
            </div>
          )}

          {!done ? (
            <SimCard>
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs text-luxury-cream/40 font-bold uppercase tracking-widest">
                  {ROUNDS[currentRound].label} Payment
                </p>
                <span className="bg-luxury-gold/10 text-luxury-gold text-[10px] font-black px-2 py-0.5 rounded-full">
                  ₹5,000 Due
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleChoice(true)}
                  className="flex items-center justify-between w-full bg-[#10B981]/10 hover:bg-[#10B981]/20 border-2 border-[#10B981]/30 hover:border-[#10B981] text-[#10B981] px-5 py-4 rounded-xl transition-all duration-300 cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-extrabold text-sm">Pay On Time</span>
                    <span className="text-[10px] opacity-70">+5 Trust Score</span>
                  </div>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>

                <button
                  onClick={() => handleChoice(false)}
                  className="flex items-center justify-between w-full bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border-2 border-[#EF4444]/30 hover:border-[#EF4444] text-[#EF4444] px-5 py-4 rounded-xl transition-all duration-300 cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-extrabold text-sm">Delay Payment</span>
                    <span className="text-[10px] opacity-70">-10 Trust Score</span>
                  </div>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </SimCard>
          ) : (
            <SimCard>
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="w-12 h-12 rounded-full bg-[#10B981]/20 flex items-center justify-center mb-2">
                  <span className="text-[#10B981] text-2xl">✓</span>
                </div>
                <h3 className="text-lg font-extrabold text-luxury-cream">Simulation Complete!</h3>
                <p className="text-luxury-cream/50 text-xs leading-relaxed">
                  You've completed the payment cycle. Your final trust score determines your reputation in the network.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <FloatingXP xp={100} show={showXP} />
                <SimButton onClick={onNext} variant="primary">
                  View Results →
                </SimButton>
              </div>
            </SimCard>
          )}
        </div>
      </div>
    </div>
  );
}
