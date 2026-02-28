"use client";

import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "@/context/Web3Provider";
import useContract from "@/hooks/useContract";
import { computeTrustScore, gatherScoreData, getGrade } from "@/lib/trustScore";

/**
 * TrustScoreBadge — Compact inline badge showing letter grade + score
 * Usage: <TrustScoreBadge score={750} />
 */
export function TrustScoreBadge({ score, size = "md" }) {
  if (score == null) return null;
  const grade = getGrade(score);
  
  const sizes = {
    sm: { badge: "size-6 text-[10px]", text: "text-[10px]" },
    md: { badge: "size-8 text-sm", text: "text-xs" },
    lg: { badge: "size-10 text-lg", text: "text-sm" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className="inline-flex items-center gap-1.5" title={`Trust Score: ${score}/1000 — ${grade.label}`}>
      <div className={`${s.badge} ${grade.bg} ${grade.border} border rounded-lg flex items-center justify-center font-black ${grade.color}`}>
        {grade.letter}
      </div>
      <span className={`${s.text} ${grade.color} font-bold`}>{score}</span>
    </div>
  );
}

/**
 * TrustScoreRing — Circular ring visualization of the score
 * For profile page hero display
 */
export function TrustScoreRing({ score, size = 120 }) {
  if (score == null) return null;
  const grade = getGrade(score);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 1000) * circumference;
  const strokeWidth = 6;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className={`${grade.color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-black ${grade.color}`}>{grade.letter}</span>
        <span className="text-luxury-gold/60 text-[10px] font-bold">{score}/1000</span>
      </div>
    </div>
  );
}

/**
 * TrustScoreCard — Full detailed card with breakdown, for profile page
 */
export function TrustScoreCard({ scoreData, loading }) {
  if (loading) {
    return (
      <div className="luxury-glass p-8 rounded-custom animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="size-12 rounded-xl bg-white/5" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-32 bg-white/5 rounded" />
            <div className="h-3 w-48 bg-white/5 rounded" />
          </div>
        </div>
        <div className="h-28 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (!scoreData) return null;

  const { score, grade, breakdown } = scoreData;

  return (
    <div className="luxury-glass p-8 rounded-custom relative overflow-hidden">
      {/* Glow effect */}
      <div className={`absolute top-0 left-0 w-48 h-48 blur-[100px] -ml-24 -mt-24 opacity-20 ${
        grade.letter === "S" ? "bg-yellow-500" :
        grade.letter === "A" ? "bg-emerald-500" :
        grade.letter === "B" ? "bg-blue-500" :
        "bg-slate-500"
      }`} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-luxury-gold/10 flex items-center justify-center border border-luxury-gold/20">
              <span className="material-symbols-outlined text-2xl text-luxury-gold">verified</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-luxury-cream tracking-tight">Trust Score</h3>
              <p className="text-luxury-gold/40 text-xs mt-0.5">On-chain reputation based on payment history</p>
            </div>
          </div>
          <TrustScoreRing score={score} size={100} />
        </div>

        {/* Grade Banner */}
        <div className={`${grade.bg} ${grade.border} border rounded-2xl p-5 mb-6 flex items-center gap-4`}>
          <div className={`size-14 rounded-xl ${grade.bg} border ${grade.border} flex items-center justify-center`}>
            <span className={`text-3xl font-black ${grade.color}`}>{grade.letter}</span>
          </div>
          <div>
            <p className={`${grade.color} font-black text-lg`}>{grade.label}</p>
            <p className="text-luxury-gold/40 text-xs mt-0.5">
              {score >= 900 ? "Top-tier reliability. Exceptional track record." :
               score >= 800 ? "Highly trustworthy. Consistent on-time payments." :
               score >= 650 ? "Good standing. Mostly reliable contributor." :
               score >= 500 ? "Average reliability. Some room for improvement." :
               score >= 350 ? "Below average. Missed payments or outstanding issues." :
               "Needs improvement. Multiple missed payments or liquidations."}
            </p>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="space-y-4">
          <h4 className="text-luxury-gold/60 text-[10px] font-black uppercase tracking-[0.3em]">Score Breakdown</h4>
          {breakdown.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-luxury-gold/40">{item.icon}</span>
                  <span className="text-sm text-luxury-cream font-medium">{item.label}</span>
                </div>
                <span className={`text-sm font-black ${
                  item.score < 0 ? "text-red-400" : "text-luxury-gold"
                }`}>
                  {item.score < 0 ? item.score : `${item.score}/${item.max}`}
                </span>
              </div>
              {item.max > 0 && (
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      item.score / item.max >= 0.8 ? "bg-emerald-500" :
                      item.score / item.max >= 0.5 ? "bg-blue-500" :
                      item.score / item.max >= 0.3 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.max(0, (item.score / item.max) * 100)}%` }}
                  />
                </div>
              )}
              <p className="text-luxury-gold/30 text-[10px] mt-1">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * useTrustScore — Hook to compute trust score for any address
 * @param {string} targetAddr — address to score (defaults to connected wallet)
 * @returns {{ score, grade, breakdown, loading, refresh }}
 */
export function useTrustScore(targetAddr) {
  const { contract, address } = useWeb3();
  const { getGroupInfo, getMemberData } = useContract();
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  const computeAddr = targetAddr || address;

  const refresh = useCallback(async () => {
    if (!contract || !computeAddr) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await gatherScoreData(contract, computeAddr, getGroupInfo, getMemberData);
      const result = computeTrustScore(data);
      setScoreData(result);
    } catch (e) {
      console.error("Trust score computation error:", e);
      setScoreData(null);
    } finally {
      setLoading(false);
    }
  }, [contract, computeAddr, getGroupInfo, getMemberData]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { scoreData, loading, refresh };
}
