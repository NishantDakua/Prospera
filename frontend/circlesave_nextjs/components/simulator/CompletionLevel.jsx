"use client";

import { useEffect, useState } from "react";
import SimButton from "./ui/Button";
import Link from "next/link";

/* â”€â”€ Badge calculator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function getBadge(trustScore, userWon) {
  if (trustScore >= 70)
    return {
      label: "Smart Contributor",
      iconName: "emoji_events",
      description:
        "Perfect payment discipline & high trust. Built for long-term wealth.",
      color: "#D5BF86",
    };
  if (userWon)
    return {
      label: "Risk Taker",
      iconName: "bolt",
      description:
        "Bid aggressively and won early. Bold moves â€” stay disciplined!",
      color: "#F59E0B",
    };
  return {
    label: "Consistent Member",
    iconName: "shield",
    description:
      "Steady, reliable, trustworthy. The backbone of every great circle.",
    color: "#10B981",
  };
}

/* â”€â”€ Confetti â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Confetti() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.6,
    duration: 1.8 + Math.random() * 1.4,
    color: ["#D5BF86", "#F59E0B", "#10B981", "#A71D31", "#60A5FA", "#FBBF24"][
      i % 6
    ],
    size: 6 + Math.round(Math.random() * 8),
    shape: i % 3,
  }));

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-16px) rotate(0deg) scale(1);    opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(430px) rotate(820deg) scale(0.4); opacity: 0; }
        }
        @keyframes game-clear-in {
          0%   { opacity: 0; letter-spacing: 0.3em; transform: scale(0.55); }
          60%  { opacity: 1; letter-spacing: 0.12em; transform: scale(1.1); }
          100% { opacity: 1; letter-spacing: 0.08em; transform: scale(1); }
        }
        @keyframes score-row-in {
          from { transform: translateX(-10px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes star-pop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.35) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg);   opacity: 1; }
        }
        @keyframes trust-fill {
          from { width: 0; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: -14,
              width: p.size,
              height: p.size,
              backgroundColor: p.shape !== 2 ? p.color : "transparent",
              borderRadius:
                p.shape === 0 ? "50%" : p.shape === 1 ? "2px" : 0,
              color: p.color,
              fontSize: p.shape === 2 ? p.size + 4 : undefined,
              animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in-out forwards`,
            }}
          >
            {p.shape === 2 ? "âœ¦" : null}
          </div>
        ))}
      </div>
    </>
  );
}

/* â”€â”€ Star rating (1-3) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StarRating({ score }) {
  const stars = score >= 75 ? 3 : score >= 50 ? 2 : 1;
  return (
    <div className="flex items-center gap-3">
      {[1, 2, 3].map((s) => (
        <span
          key={s}
          className="text-4xl"
          style={{
            animation: s <= stars ? `star-pop 0.55s ${s * 0.2}s both` : "none",
            opacity: s <= stars ? 1 : 0.15,
            filter: s <= stars ? "drop-shadow(0 0 10px #F59E0B)" : "none",
          }}
        >
          â˜…
        </span>
      ))}
    </div>
  );
}

/* â”€â”€ Journey Step Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function JourneyStep({ step, title, icon, color, lesson, stat, statLabel, delay = 0 }) {
  return (
    <div
      className="flex gap-4 p-4 rounded-xl border transition-all"
      style={{
        background: `${color}08`,
        borderColor: `${color}25`,
        animation: `fade-up 0.5s ${delay}s both`,
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}20`, color }}
      >
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ background: `${color}20`, color }}
            >
              {step}
            </span>
            <span className="text-sm font-extrabold text-luxury-cream">
              {title}
            </span>
          </div>
          {stat && (
            <span
              className="text-sm font-extrabold"
              style={{ color }}
            >
              {stat}
            </span>
          )}
        </div>
        <p className="text-luxury-cream/50 text-xs leading-relaxed">{lesson}</p>
        {statLabel && (
          <p className="text-[10px] text-luxury-cream/30 font-semibold uppercase tracking-wider">
            {statLabel}
          </p>
        )}
      </div>
    </div>
  );
}

/* â”€â”€ Main completion screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function CompletionLevel({ simState, onClose, onAction }) {
  const {
    poolConfig,
    poolValue,
    bid,
    biddingWinner,
    biddingPayout,
    userWon,
    finalTrustScore,
    paymentHistory,
    winningDiscount,
  } = simState;

  const trust = finalTrustScore ?? 60;
  const badge = getBadge(trust, userWon);
  const trustColor =
    trust >= 70 ? "#10B981" : trust >= 40 ? "#F59E0B" : "#EF4444";
  const totalXP = 250;

  const [showJourney, setShowJourney] = useState(false);

  /* Triple-coin burst on mount */
  useEffect(() => {
    onAction?.(0);
    const t1 = setTimeout(() => onAction?.(0), 240);
    const t2 = setTimeout(() => onAction?.(0), 500);
    const t3 = setTimeout(() => setShowJourney(true), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex flex-col gap-8 overflow-hidden">
      <Confetti />

      {/* â”€â”€ GAME CLEAR banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="relative z-10 flex flex-col items-center gap-5 py-6">
        <div
          className="text-4xl font-extrabold uppercase text-center tracking-widest"
          style={{
            animation:
              "game-clear-in 0.9s cubic-bezier(0.22,1,0.36,1) both",
            background:
              "linear-gradient(90deg, #D5BF86 0%, #F59E0B 50%, #D5BF86 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          â˜… GAME CLEAR! â˜…
        </div>

        <StarRating score={trust} />

        <div
          className="flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-extrabold uppercase tracking-widest"
          style={{
            background: `${badge.color}12`,
            border: `2px solid ${badge.color}50`,
            color: badge.color,
            boxShadow: `0 0 20px ${badge.color}33`,
          }}
        >
          <span className="material-symbols-outlined text-base">
            {badge.iconName}
          </span>
          {badge.label}
        </div>

        <p className="text-luxury-cream/50 text-sm max-w-sm text-center leading-relaxed">
          {badge.description}
        </p>
      </div>

      {/* â”€â”€ YOUR JOURNEY â€“ educational recap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showJourney && (
        <div
          className="relative z-10 rounded-2xl p-6"
          style={{
            background: "#070F1E",
            border: "2px solid #D5BF8620",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-[#D5BF86]">menu_book</span>
              <p
                className="text-xs font-extrabold uppercase tracking-widest"
                style={{ color: "#D5BF86", fontFamily: "monospace" }}
              >
                YOUR LEARNING JOURNEY
              </p>
            </div>
            <div
              className="text-2xl font-extrabold"
              style={{
                fontFamily: "monospace",
                color: "#F59E0B",
                textShadow: "0 0 18px #F59E0Baa",
              }}
            >
              {totalXP} XP
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <JourneyStep
              step="Level 1"
              title="Joined a Chit Fund Pool"
              icon="casino"
              color="#D5BF86"
              lesson={`You joined a pool of ${poolConfig?.members ?? 10} members, each contributing â‚¹${(poolConfig?.contribution ?? 5000).toLocaleString()}/month. The total pool value is â‚¹${(poolValue ?? 50000).toLocaleString()}. In a real circle, this money gets distributed to one member each month.`}
              stat={`â‚¹${(poolValue ?? 50000).toLocaleString()}`}
              statLabel="Pool value understood"
              delay={0.1}
            />
            <JourneyStep
              step="Level 2"
              title="Participated in an Auction"
              icon="emoji_events"
              color="#F59E0B"
              lesson={`The auction determines who gets the pool money first. You ${userWon ? `won by bidding â‚¹${Number(bid ?? 0).toLocaleString()}` : `bid â‚¹${Number(bid ?? 0).toLocaleString()} but didn't win`}. ${biddingWinner ? `${biddingWinner} won with a bid of â‚¹${(winningDiscount ?? 0).toLocaleString()}.` : ""} The winner's bid is distributed as profit to others.`}
              stat={userWon ? "WON" : `â‚¹${Number(bid ?? 0).toLocaleString()}`}
              statLabel={userWon ? "You got the money first" : "Your bid amount"}
              delay={0.2}
            />
            <JourneyStep
              step="Level 3"
              title="Managed Loan Repayment"
              icon="shield"
              color="#10B981"
              lesson={`${userWon ? "Because you won, you must keep paying monthly installments until the circle ends." : "You continued paying monthly installments to keep the pool running."} Timely payments build trust. Your trust score ended at ${trust}/100. ${trust >= 70 ? "Excellent discipline!" : trust >= 40 ? "Good effort - keep improving!" : "Work on consistency."}`}
              stat={`${trust}/100`}
              statLabel="Final trust score"
              delay={0.3}
            />
          </div>
        </div>
      )}

      {/* â"€â"€ Action buttons â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-3">
        <SimButton onClick={onClose} variant="secondary">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Exit Simulator
        </SimButton>
        <Link href="/dashboard" className="flex-1">
          <SimButton variant="primary" className="w-full">
            <span className="material-symbols-outlined text-lg">rocket_launch</span>
            Join a Real Circle
          </SimButton>
        </Link>
      </div>
    </div>
  );
}

