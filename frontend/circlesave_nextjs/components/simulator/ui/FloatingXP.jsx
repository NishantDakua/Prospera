"use client";

import { useEffect, useState } from "react";

/**
 * Drop-in floating XP popup. Works best as a child inside a
 * `relative`-positioned container.
 *
 * Usage:
 *   const { showXP, triggerXP } = useXPTrigger();
 *   <FloatingXP xp={50} show={showXP} />
 *   <button onClick={() => { triggerXP(); onAction(); }}>Join</button>
 */

export function useXPTrigger() {
  const [showXP, setShowXP] = useState(false);
  const triggerXP = () => {
    setShowXP(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setShowXP(true));
    });
    setTimeout(() => setShowXP(false), 1400);
  };
  return { showXP, triggerXP };
}

export default function FloatingXP({ xp, show, color = "#D5BF86" }) {
  if (!show) return null;
  return (
    <>
      <style>{`
        @keyframes float-xp {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-48px) scale(1.3); }
        }
        @keyframes coin-spin {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }
      `}</style>
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center z-50"
        aria-hidden
      >
        <div
          className="flex items-center gap-1.5 font-extrabold text-3xl"
          style={{
            animation: "float-xp 1.4s cubic-bezier(0.22,1,0.36,1) forwards",
            color,
            filter: `drop-shadow(0 0 16px ${color}cc)`,
          }}
        >
          <span style={{ display: "inline-block", animation: "coin-spin 0.7s linear" }}>🪙</span>
          <span>+{xp} XP</span>
        </div>
      </div>
    </>
  );
}
