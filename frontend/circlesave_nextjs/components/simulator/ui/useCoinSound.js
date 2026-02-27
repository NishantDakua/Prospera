"use client";

/**
 * Generates the classic 2-note Mario coin sound using Web Audio API.
 * No external files needed — fully programmatic 8-bit synthesis.
 */
export function useCoinSound() {
  const playCoin = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Classic coin: E5 (659 Hz) → B5 (988 Hz)
      osc.type = "square";
      osc.frequency.setValueAtTime(659, ctx.currentTime);
      osc.frequency.setValueAtTime(988, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (_) {
      /* silently fail if audio unavailable */
    }
  };

  return playCoin;
}
