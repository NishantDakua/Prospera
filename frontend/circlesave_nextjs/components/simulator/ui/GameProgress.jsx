"use client";

import { useEffect, useState } from "react";

/* ─── Stage definitions ─────────────────────────────────────── */
const STAGES = [
  { id: 1, name: "1-1", label: "Lucky Draw", xp: 50,  pos: 7  },
  { id: 2, name: "1-2", label: "Auction",    xp: 75,  pos: 33 },
  { id: 3, name: "1-3", label: "Lending",    xp: 100, pos: 60 },
  { id: 4, name: "1-4", label: "Victory!",   xp: 0,   pos: 85 },
];

/* ─── Pixel-art Mario SVG ────────────────────────────────────── */
function PixelMario({ frame, isJumping }) {
  // 8×10 pixel grid
  const R = "#D32F2F"; // red
  const B = "#5D2906"; // brown / shoes / mustache / hair
  const S = "#FFCBA4"; // skin
  const O = "#1565C0"; // blue overalls
  const K = "#111111"; // black eyes

  return (
    <svg
      width="48"
      height="60"
      viewBox="0 0 8 10"
      style={{ imageRendering: "pixelated" }}
    >
      {/* Row 0 – hat top */}
      <rect x="1" y="0" width="6" height="1" fill={R} />
      {/* Row 1 – hat brim */}
      <rect x="0" y="1" width="8" height="1" fill={R} />
      {/* Row 2 – hair | face | hair */}
      <rect x="0" y="2" width="2" height="1" fill={B} />
      <rect x="2" y="2" width="4" height="1" fill={S} />
      <rect x="6" y="2" width="2" height="1" fill={B} />
      {/* Row 3 – face with eyes */}
      <rect x="0" y="3" width="8" height="1" fill={S} />
      <rect x="2" y="3" width="1" height="1" fill={K} />
      <rect x="5" y="3" width="1" height="1" fill={K} />
      {/* Row 4 – face */}
      <rect x="0" y="4" width="8" height="1" fill={S} />
      {/* Row 5 – mustache */}
      <rect x="0" y="5" width="2" height="1" fill={S} />
      <rect x="2" y="5" width="4" height="1" fill={B} />
      <rect x="6" y="5" width="2" height="1" fill={S} />
      {/* Row 6 – shirt */}
      <rect x="0" y="6" width="8" height="1" fill={R} />
      {/* Row 7 – overalls */}
      <rect x="0" y="7" width="3" height="1" fill={O} />
      <rect x="3" y="7" width="2" height="1" fill={R} />
      <rect x="5" y="7" width="3" height="1" fill={O} />
      {/* Row 8 – legs (frame alternates) */}
      {isJumping ? (
        <>
          <rect x="0" y="8" width="2" height="1" fill={O} />
          <rect x="6" y="8" width="2" height="1" fill={O} />
        </>
      ) : frame === 0 ? (
        <>
          <rect x="0" y="8" width="3" height="1" fill={O} />
          <rect x="5" y="8" width="3" height="1" fill={O} />
        </>
      ) : (
        <>
          <rect x="0" y="8" width="2" height="1" fill={O} />
          <rect x="6" y="8" width="2" height="1" fill={O} />
        </>
      )}
      {/* Row 9 – shoes */}
      {isJumping ? (
        <>
          <rect x="0" y="9" width="2" height="1" fill={B} />
          <rect x="6" y="9" width="2" height="1" fill={B} />
        </>
      ) : frame === 0 ? (
        <>
          <rect x="0" y="9" width="3" height="1" fill={B} />
          <rect x="5" y="9" width="3" height="1" fill={B} />
        </>
      ) : (
        <>
          <rect x="0" y="9" width="2" height="1" fill={B} />
          <rect x="6" y="9" width="2" height="1" fill={B} />
        </>
      )}
    </svg>
  );
}

/* ─── Question block ──────────────────────────────────────────── */
function QBlock({ blink, hit }) {
  return (
    <div
      className="w-8 h-8 flex items-center justify-center rounded-sm border-2 text-sm font-black select-none relative"
      style={{
        backgroundColor: hit ? "#8B4513" : blink ? "#F59E0B" : "#B45309",
        borderColor: hit ? "#5D2906" : "#92400E",
        color: hit ? "#5D2906" : "#FFF8E1",
        boxShadow: blink && !hit ? "0 0 12px #F59E0Baa" : "none",
        transition: "all 0.3s",
        transform: hit ? "translateY(-4px)" : "none",
      }}
    >
      {hit ? "" : "?"}
      {hit && (
        <div 
          className="absolute text-xl" 
          style={{ 
            animation: "float-xp 0.8s ease-out forwards",
            color: "#F59E0B",
            textShadow: "0 0 10px #F59E0B"
          }}
        >
          🪙
        </div>
      )}
    </div>
  );
}

/* ─── Ground brick ────────────────────────────────────────────── */
function GroundStrip() {
  const COUNT = 26;
  return (
    <div className="flex w-full">
      {Array.from({ length: COUNT }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-5 border border-[#6B3A2A]/60"
          style={{ backgroundColor: i % 2 === 0 ? "#8B4513" : "#92400E" }}
        />
      ))}
    </div>
  );
}

/* ─── Main GameProgress ───────────────────────────────────────── */
export default function GameProgress({ currentStep, unlockedStep = 1, onSelectStep, totalXP = 0, coins = 0 }) {
  const [walkFrame, setWalkFrame] = useState(0);
  const [prevStep, setPrevStep] = useState(currentStep);
  const [levelFlash, setLevelFlash] = useState(false);
  const [qBlink, setQBlink] = useState(-1);

  /* Walk animation: flip frame every 180 ms */
  useEffect(() => {
    const t = setInterval(() => setWalkFrame((f) => (f + 1) % 2), 180);
    return () => clearInterval(t);
  }, []);

  /* Trigger level flash when step increases */
  useEffect(() => {
    if (currentStep !== prevStep) {
      setPrevStep(currentStep);
      setLevelFlash(true);
      const t = setTimeout(() => setLevelFlash(false), 1600);
      return () => clearTimeout(t);
    }
  }, [currentStep, prevStep]);

  /* Randomly blink one ? block */
  useEffect(() => {
    const t = setInterval(() => {
      setQBlink(Math.floor(Math.random() * 4));
      setTimeout(() => setQBlink(-1), 600);
    }, 2400);
    return () => clearInterval(t);
  }, []);

  const stage = STAGES[currentStep - 1] ?? STAGES[3];
  const marioPos = stage.pos;

  return (
    <>
      {/* Keyframe styles */}
      <style>{`
        @keyframes mario-bounce {
          0%,100% { transform:translateY(0); }
          50% { transform:translateY(-7px); }
        }
        @keyframes mario-levelup {
          0% { transform:translateY(0) scale(1); }
          20% { transform:translateY(-42px) scale(1.1); }
          40% { transform:translateY(-42px) scale(1.1); }
          100% { transform:translateY(0) scale(1); }
        }
        @keyframes level-flash {
          0% { opacity:0; transform:scale(0.6) rotate(-4deg); }
          20% { opacity:1; transform:scale(1.15) rotate(2deg); }
          70% { opacity:1; transform:scale(1) rotate(0deg); }
          100% { opacity:0; transform:scale(0.9); }
        }
        @keyframes star-twinkle {
          0%,100% { opacity:0.15; transform:scale(0.8); }
          50% { opacity:0.9; transform:scale(1.1); }
        }
        @keyframes coin-spin {
          0% { transform:rotateY(0); }
          100% { transform:rotateY(360deg); }
        }
        @keyframes float-xp {
          0% { opacity:1; transform:translateY(0) scale(0.5); }
          50% { opacity:1; transform:translateY(-30px) scale(1.2); }
          100% { opacity:0; transform:translateY(-44px) scale(1); }
        }
      `}</style>

      <div
        className="rounded-2xl overflow-hidden border border-luxury-gold/15 select-none"
        style={{ background: "linear-gradient(180deg, #0A1628 0%, #0D1F3C 40%, #0F1A2E 100%)" }}
      >
        {/* ── HUD bar ──────────────────────────────────────── */}
        <div
          className="flex flex-col gap-2 px-5 py-3.5 text-xs font-extrabold uppercase tracking-widest"
          style={{ background: "#070F1E", borderBottom: "2px solid #1A2D50" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#F59E0B]">★</span>
              <span className="text-[#F59E0B]">ARCADE</span>
            </div>
            <span className="text-luxury-gold/60">
              WORLD {"  "}
              <span className="text-luxury-gold">{stage.name}</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span style={{ color: "#F59E0B", animation: "coin-spin 2s linear infinite", display: "inline-block" }}>●</span>
              <span style={{ color: "#F59E0B" }}>× {coins}</span>
            </div>
            <span className="text-luxury-gold/60">
              XP <span className="text-luxury-gold">{totalXP}</span>
            </span>
          </div>
        </div>

        {/* ── Sky + platform area ──────────────────────────── */}
        <div className="relative" style={{ height: 140 }}>

          {/* Background stars */}
          {[
            { x: "8%",  y: "12%", d: 0.3 },
            { x: "18%", y: "28%", d: 0.9 },
            { x: "28%", y: "8%",  d: 1.4 },
            { x: "45%", y: "20%", d: 0.6 },
            { x: "55%", y: "10%", d: 1.8 },
            { x: "70%", y: "24%", d: 1.1 },
            { x: "82%", y: "8%",  d: 0.4 },
            { x: "92%", y: "18%", d: 1.6 },
          ].map((s, i) => (
            <div
              key={i}
              className="absolute text-[8px] text-white"
              style={{
                left: s.x,
                top: s.y,
                animation: `star-twinkle 2.5s ${s.d}s ease-in-out infinite`,
              }}
            >
              ✦
            </div>
          ))}

          {/* Question blocks row */}
          <div className="absolute flex items-end gap-0" style={{ top: 14, left: 0, right: 0, paddingInline: "6%" }}>
            <div className="flex w-full justify-between">
              {Array.from({ length: 4 }).map((_, i) => {
                const isHit = currentStep > i + 1 || (levelFlash && currentStep === i + 1);
                return <QBlock key={i} blink={qBlink === i} hit={isHit} />;
              })}
            </div>
          </div>

          {/* Stage waypoints */}
          <div
            className="absolute flex items-end"
            style={{ bottom: 20, left: 0, right: 0, paddingInline: "4%" }}
          >
            <div className="relative w-full flex justify-between px-2">
              {STAGES.map((s, idx) => {
                const done = idx + 1 < currentStep;
                const active = idx + 1 === currentStep;
                const isCastle = idx === 3;
                return (
                  <div key={s.id} className="flex flex-col items-center gap-1">
                    {/* Castle or flag */}
                    <div
                      className="flex flex-col items-center gap-0.5 transition-all duration-500"
                      style={{ opacity: done || active ? 1 : 0.4 }}
                    >
                      {isCastle ? (
                        <div className="text-2xl">{done || active ? "🏰" : "🏚️"}</div>
                      ) : (
                        <div
                          className="text-xl transition-transform duration-500"
                          style={{ transform: done ? "none" : "none" }}
                        >
                          {done ? "🚩" : "🏁"}
                        </div>
                      )}
                      <span
                        className="text-[8px] font-extrabold uppercase tracking-wider"
                        style={{ color: done ? "#10B981" : active ? "#D5BF86" : "#4B5563" }}
                      >
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mario character — slides horizontally */}
          <div
            className="absolute"
            style={{
              left: `${marioPos}%`,
              bottom: 46,
              transform: "translateX(-50%)",
              transition: "left 0.85s cubic-bezier(0.34,1.56,0.64,1)",
              animation: levelFlash
                ? "mario-levelup 0.8s ease-in-out"
                : "mario-bounce 0.36s ease-in-out infinite",
              zIndex: 10,
            }}
          >
            <PixelMario frame={walkFrame} isJumping={levelFlash} />
            {/* Shadow */}
            <div
              className="mx-auto mt-0.5 rounded-full"
              style={{
                width: 28,
                height: 5,
                background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)",
              }}
            />
          </div>

          {/* Ground strip */}
          <div className="absolute bottom-0 left-0 right-0">
            <GroundStrip />
          </div>
        </div>

        {/* ── Step progress dots ───────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-3 gap-3"
          style={{ background: "#050D1A", borderTop: "2px solid #1A2D50" }}
        >
          <div className="flex items-center gap-2 flex-1">
            {STAGES.map((s, idx) => {
              const done = idx + 1 < currentStep;
              const active = idx + 1 === currentStep;
              const isUnlocked = s.id <= unlockedStep;
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-none">
                  <div
                    onClick={() => isUnlocked && onSelectStep?.(s.id)}
                    className={`flex items-center justify-center rounded-full text-[9px] font-extrabold transition-all duration-500 flex-shrink-0 ${isUnlocked ? "cursor-pointer hover:scale-110" : "opacity-50 cursor-not-allowed"}`}
                    style={{
                      width: 22,
                      height: 22,
                      backgroundColor: done ? "#10B981" : active ? "#D5BF86" : "#1F2937",
                      color: done || active ? "#0F0F14" : "#6B7280",
                      boxShadow: active ? "0 0 10px #D5BF86aa" : "none",
                      border: `2px solid ${done ? "#10B981" : active ? "#D5BF86" : "#374151"}`,
                    }}
                  >
                    {done ? "✓" : s.id}
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div
                      className="flex-1 h-0.5 rounded-full transition-all duration-700"
                      style={{ backgroundColor: done ? "#10B981" : "#1F2937" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <span
            className="text-[10px] font-extrabold uppercase tracking-widest ml-4 flex-shrink-0"
            style={{ color: "#D5BF86" }}
          >
            {STAGES[currentStep - 1]?.label ?? "Complete!"}
          </span>
        </div>
      </div>

      {/* ── LEVEL COMPLETE overlay ────────────────────────── */}
      {levelFlash && (
        <div className="fixed inset-0 pointer-events-none z-[999] flex items-center justify-center">
          <div
            style={{
              animation: "level-flash 1.6s ease-out forwards",
              background: "linear-gradient(135deg, #D5BF86, #F59E0B)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: 52,
              fontWeight: 900,
              letterSpacing: "0.05em",
              textShadow: "none",
              filter: "drop-shadow(0 0 30px #F59E0Bcc)",
            }}
          >
            LEVEL UP!
          </div>
        </div>
      )}
    </>
  );
}
