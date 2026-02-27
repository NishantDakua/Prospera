"use client";

import { useEffect, useState } from "react";
import SimButton from "./ui/Button";
import Link from "next/link";

/* ── Badge calculator ──────────────────────────────────────── */
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
        "Bid aggressively and won early. Bold moves — stay disciplined!",
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

/* ── Confetti ──────────────────────────────────────────────── */
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
            {p.shape === 2 ? "✦" : null}
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Star rating (1-3) ─────────────────────────────────────── */
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
          ★
        </span>
      ))}
    </div>
  );
}

/* ── Journey Step Card ─────────────────────────────────────── */
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
        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
        style={{ background: `${color}20`, color }}
      >
        {icon}
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

/* ── Main completion screen ────────────────────────────────── */
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

      {/* ── GAME CLEAR banner ────────────────────────────── */}
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
          ★ GAME CLEAR! ★
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

      {/* ── YOUR JOURNEY – educational recap ─────────────── */}
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
              <span className="text-lg">📖</span>
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
              icon="🎰"
              color="#D5BF86"
              lesson={`You joined a pool of ${poolConfig?.members ?? 10} members, each contributing ₹${(poolConfig?.contribution ?? 5000).toLocaleString()}/month. The total pool value is ₹${(poolValue ?? 50000).toLocaleString()}. In a real circle, this money gets distributed to one member each month.`}
              stat={`₹${(poolValue ?? 50000).toLocaleString()}`}
              statLabel="Pool value understood"
              delay={0.1}
            />

            <JourneyStep
              step="Level 2"
              title="Participated in an Auction"
              icon="🏆"
              color="#F59E0B"
              lesson={
                biddingWinner
                  ? `${biddingWinner} won the auction by bidding a discount of ₹${(bid ?? 0).toLocaleString()}. That means the winner receives ₹${(biddingPayout ?? 0).toLocaleString()} instead of the full ₹50,000. The ₹${(bid ?? 0).toLocaleString()} discount gets distributed as profit to remaining members.`
                  : "You experienced how the auction works. Members who need money urgently bid a higher discount, and the highest bidder wins. The discount amount is shared as profit among the remaining members."
              }
              stat={
                biddingWinner
                  ? `₹${(biddingPayout ?? 0).toLocaleString()}`
                  : "—"
              }
              statLabel={biddingWinner ? `Payout to ${biddingWinner}` : "Auction payout"}
              delay={0.25}
            />

            <JourneyStep
              step="Level 3"
              title="Managed Loan Repayment"
              icon="🛡️"
              color="#10B981"
              lesson={`After winning the pot, you need to keep paying your monthly installments. ${
                trust >= 70
                  ? "You maintained excellent discipline — your trust score is high, making you a valuable member for future circles."
                  : trust >= 50
                  ? "You had a mixed record. Some delayed payments hurt your trust. In a real circle, this would reduce your access to future pools."
                  : "Multiple delayed payments damaged your trust score. In a real on-chain circle, this would be permanently recorded and could lock you out of future pools."
              }`}
              stat={`${trust}/100`}
              statLabel="Final trust score"
              delay={0.4}
            />
          </div>
        </div>
      )}

      {/* ── Score board ──────────────────────────────────── */}
      {showJourney && (
        <div
          className="relative z-10 rounded-2xl p-6"
          style={{
            background: "#070F1E",
            border: "2px solid #D5BF8618",
            animation: "fade-up 0.5s 0.6s both",
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">📊</span>
            <p
              className="text-xs font-extrabold uppercase tracking-widest"
              style={{ color: "#D5BF86", fontFamily: "monospace" }}
            >
              SCORE BOARD
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Stat Cards */}
            <StatCard
              icon="👥"
              label="Members"
              value={`${poolConfig?.members ?? 10}`}
              delay={0.65}
            />
            <StatCard
              icon="💰"
              label="Pool Value"
              value={`₹${(poolValue ?? 50000).toLocaleString()}`}
              accent
              delay={0.7}
            />
            <StatCard
              icon="🏆"
              label="Round Winner"
              value={biddingWinner ?? "—"}
              delay={0.75}
            />
            <StatCard
              icon="💸"
              label="Payout"
              value={
                biddingPayout
                  ? `₹${biddingPayout.toLocaleString()}`
                  : "—"
              }
              accent
              delay={0.8}
            />
            <StatCard
              icon="💵"
              label="Your Bid"
              value={bid ? `₹${Number(bid).toLocaleString()}` : "—"}
              delay={0.85}
            />
            <StatCard
              icon="📅"
              label="Duration"
              value={`${poolConfig?.duration ?? 10} months`}
              delay={0.9}
            />
            <StatCard
              icon="🛡️"
              label="Trust Score"
              value={`${trust}/100`}
              accent
              delay={0.95}
            />
            <StatCard
              icon="⭐"
              label="Total XP"
              value={`${totalXP} XP`}
              accent
              delay={1.0}
            />
          </div>

          {/* Trust bar */}
          <div className="mt-5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-luxury-cream/40 uppercase tracking-wider">
                Trust Rating
              </span>
              <span style={{ color: trustColor }}>{trust}%</span>
            </div>
            <div
              className="h-3 rounded-full overflow-hidden"
              style={{ background: "#1A2D50" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${trust}%`,
                  backgroundColor: trustColor,
                  boxShadow: `0 0 10px ${trustColor}99`,
                  animation:
                    "trust-fill 1.2s 1s cubic-bezier(0.34,1.56,0.64,1) both",
                }}
              />
            </div>
          </div>

          {/* Payment history pills */}
          {(paymentHistory ?? []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {(paymentHistory ?? []).map((h, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                  style={{
                    backgroundColor:
                      h.delta > 0 ? "#10B98115" : "#EF444415",
                    border: `1px solid ${
                      h.delta > 0 ? "#10B98144" : "#EF444444"
                    }`,
                    color: h.delta > 0 ? "#10B981" : "#EF4444",
                  }}
                >
                  {h.label} · {h.status}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Key Takeaways ────────────────────────────────── */}
      {showJourney && (
        <div
          className="relative z-10 rounded-2xl p-6"
          style={{
            background: "linear-gradient(135deg, #0A162808, #D5BF8606)",
            border: "2px solid #D5BF8612",
            animation: "fade-up 0.5s 1.1s both",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎓</span>
            <p
              className="text-xs font-extrabold uppercase tracking-widest"
              style={{ color: "#D5BF86", fontFamily: "monospace" }}
            >
              KEY TAKEAWAYS
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <TakeawayCard
              number="01"
              title="Collective Saving"
              text="Chit funds pool small contributions into large payouts. You save and borrow from the same group — no bank, no interest rate markups."
              color="#D5BF86"
            />
            <TakeawayCard
              number="02"
              title="Fair Distribution"
              text="Auctions ensure the member who needs money most gets it first by bidding the highest discount. Others earn that discount as profit."
              color="#F59E0B"
            />
            <TakeawayCard
              number="03"
              title="Trust is Currency"
              text="Your payment reliability builds your on-chain reputation. Higher trust = access to better pools, lower collateral requirements."
              color="#10B981"
            />
          </div>
        </div>
      )}

      {/* ── CTA row ──────────────────────────────────────── */}
      {showJourney && (
        <div
          className="relative z-10 rounded-2xl p-7 flex flex-col items-center gap-4 text-center"
          style={{
            background: "#0A1628",
            border: "2px solid #D5BF8618",
            animation: "fade-up 0.5s 1.3s both",
          }}
        >
          <p className="text-lg font-extrabold text-luxury-cream">
            Ready to Join a Real Pool on Prospera?
          </p>
          <p className="text-luxury-cream/40 text-sm max-w-sm leading-relaxed">
            Apply your knowledge and start building financial resilience with a
            real trusted community — all secured on-chain.
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap justify-center">
            <Link href="/dashboard">
              <SimButton variant="primary" onClick={onClose}>
                <span className="material-symbols-outlined text-sm">
                  rocket_launch
                </span>
                Join Real Pool
              </SimButton>
            </Link>
            <SimButton variant="ghost" onClick={onClose}>
              <span className="material-symbols-outlined text-sm">
                refresh
              </span>
              Play Again
            </SimButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────── */
function StatCard({ icon, label, value, accent, delay = 0 }) {
  return (
    <div
      className="flex flex-col gap-1.5 p-3 rounded-xl border border-luxury-gold/8 bg-white/[0.02]"
      style={{ animation: `fade-up 0.4s ${delay}s both` }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-[9px] text-luxury-cream/30 uppercase tracking-widest font-bold">
          {label}
        </span>
      </div>
      <span
        className={`text-sm font-extrabold ${
          accent ? "text-luxury-gold" : "text-luxury-cream"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Takeaway Card ─────────────────────────────────────────── */
function TakeawayCard({ number, title, text, color }) {
  return (
    <div
      className="flex flex-col gap-2 p-4 rounded-xl border"
      style={{
        background: `${color}06`,
        borderColor: `${color}18`,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-black"
          style={{ color, fontFamily: "monospace" }}
        >
          {number}
        </span>
        <span className="text-xs font-extrabold text-luxury-cream">
          {title}
        </span>
      </div>
      <p className="text-luxury-cream/40 text-[11px] leading-relaxed">{text}</p>
    </div>
  );
}
