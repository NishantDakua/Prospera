"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthProvider";
import {
  downsampleBuffer,
  floatTo16BitPCM,
  base64ToAudioBuffer,
  AudioQueue,
  VoiceWebSocket,
} from "@/lib/voiceAudio";

/* ── Constants ───────────────────────────────────────────── */
const WS_URL =
  typeof window !== "undefined"
    ? `ws://${window.location.hostname}:8002/api/ws/voice`
    : "";

const VOICE_PROMPTS = [
  { label: "My circles", prompt: "Tell me about my active circles" },
  { label: "How bidding works", prompt: "Explain how the bidding process works" },
  { label: "Trust score", prompt: "What is my trust score and how to improve it" },
  { label: "Platform stats", prompt: "Give me current platform statistics" },
];

/* ── Status states ───────────────────────────────────────── */
const STATUS = {
  IDLE: "idle",
  CONNECTING: "connecting",
  READY: "ready",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
  ERROR: "error",
};

/* ── Animated waveform rings ─────────────────────────────── */
function PulseRings({ active, color = "luxury-crimson" }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`absolute rounded-full border border-${color}/30`}
          style={{
            width: `${60 + i * 24}px`,
            height: `${60 + i * 24}px`,
            animation: `voice-pulse 2s ${i * 0.4}s ease-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Single transcript bubble ────────────────────────────── */
function TranscriptBubble({ role, text, time }) {
  const isUser = role === "user";
  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-1`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed font-medium
          ${
            isUser
              ? "bg-luxury-crimson text-luxury-cream rounded-br-md"
              : "bg-white/[0.05] border border-white/[0.08] text-luxury-cream/85 rounded-bl-md"
          }`}
      >
        {text}
      </div>
      <span className="text-[10px] text-luxury-cream/25 px-1">
        {isUser ? "You" : "Concierge"} &middot; {time}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN VOICE AGENT COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function VoiceAgent() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] || "there";

  /* ── State ─────────────────────────────────────────────── */
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [transcript, setTranscript] = useState([]);
  const [currentText, setCurrentText] = useState("");
  const [error, setError] = useState("");

  /* ── Refs ──────────────────────────────────────────────── */
  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const audioQueueRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const scrollRef = useRef(null);

  /* ── Auto-scroll ───────────────────────────────────────── */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, currentText]);

  /* ── Cleanup on unmount ────────────────────────────────── */
  useEffect(() => {
    return () => disconnect();
  }, []);

  /* ── Format time ───────────────────────────────────────── */
  const fmtTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  /* ── Connect to voice backend ──────────────────────────── */
  const connect = useCallback(async () => {
    try {
      setStatus(STATUS.CONNECTING);
      setError("");

      // Create AudioContext
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000,
      });
      audioCtxRef.current = audioCtx;
      audioQueueRef.current = new AudioQueue(audioCtx);

      // Connect WebSocket
      const ws = new VoiceWebSocket(WS_URL);

      ws.onMessage = (data) => {
        switch (data.type) {
          case "ready":
            setStatus(STATUS.READY);
            setTranscript((t) => [
              ...t,
              {
                role: "agent",
                text: `Good evening, ${firstName}. I'm your Prospera Voice Concierge. How may I assist you today?`,
                time: fmtTime(),
              },
            ]);
            break;

          case "user":
            setTranscript((t) => [
              ...t,
              { role: "user", text: data.text, time: fmtTime() },
            ]);
            setStatus(STATUS.THINKING);
            break;

          case "agent":
            setTranscript((t) => [
              ...t,
              { role: "agent", text: data.text, time: fmtTime() },
            ]);
            setStatus(STATUS.SPEAKING);
            // Return to listening after a beat
            setTimeout(() => setStatus(STATUS.LISTENING), 2000);
            break;

          case "audio":
            try {
              const audioBuf = base64ToAudioBuffer(data.audio, audioCtx);
              audioQueueRef.current.addToQueue(audioBuf);
              setStatus(STATUS.SPEAKING);
            } catch (e) {
              console.error("Audio decode error:", e);
            }
            break;

          case "error":
            setError(data.message || "Connection error");
            setStatus(STATUS.ERROR);
            break;
        }
      };

      ws.onClose = () => {
        if (status !== STATUS.IDLE) {
          setStatus(STATUS.IDLE);
        }
      };

      ws.onError = () => {
        setError("Failed to connect to voice server");
        setStatus(STATUS.ERROR);
      };

      await ws.connect();
      wsRef.current = ws;
    } catch (e) {
      console.error("Connection failed:", e);
      setError("Could not connect to voice server. Is it running on port 8002?");
      setStatus(STATUS.ERROR);
    }
  }, [firstName, status]);

  /* ── Start listening (microphone) ──────────────────────── */
  const startListening = useCallback(async () => {
    if (!wsRef.current?.isConnected) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      const audioCtx = audioCtxRef.current || new AudioContext({ sampleRate: 16000 });
      if (!audioCtxRef.current) audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (!wsRef.current?.isConnected) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const downsampled = downsampleBuffer(inputData, audioCtx.sampleRate, 16000);
        const base64 = floatTo16BitPCM(downsampled);
        wsRef.current.send({ type: "audio", audio: base64 });
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      processorRef.current = { source, processor };

      setStatus(STATUS.LISTENING);
    } catch (e) {
      console.error("Microphone error:", e);
      setError("Microphone access denied. Please allow microphone permission.");
      setStatus(STATUS.ERROR);
    }
  }, []);

  /* ── Stop listening ────────────────────────────────────── */
  const stopListening = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.source.disconnect();
      processorRef.current.processor.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (status === STATUS.LISTENING) setStatus(STATUS.READY);
  }, [status]);

  /* ── Disconnect everything ─────────────────────────────── */
  const disconnect = useCallback(() => {
    stopListening();
    wsRef.current?.close();
    wsRef.current = null;
    audioQueueRef.current?.reset();
    if (audioCtxRef.current?.state !== "closed") {
      audioCtxRef.current?.close().catch(() => {});
    }
    audioCtxRef.current = null;
    setStatus(STATUS.IDLE);
  }, [stopListening]);

  /* ── Send text message ─────────────────────────────────── */
  const sendText = useCallback(
    (text) => {
      const trimmed = (text || currentText).trim();
      if (!trimmed || !wsRef.current?.isConnected) return;
      wsRef.current.send({ type: "text", text: trimmed });
      setCurrentText("");
    },
    [currentText]
  );

  /* ── Handle open/close ─────────────────────────────────── */
  const handleOpen = useCallback(() => {
    setOpen(true);
    connect();
  }, [connect]);

  const handleClose = useCallback(() => {
    disconnect();
    setOpen(false);
    setTranscript([]);
    setError("");
  }, [disconnect]);

  /* ── Mic toggle ────────────────────────────────────────── */
  const toggleMic = useCallback(() => {
    if (status === STATUS.LISTENING) {
      stopListening();
    } else if (status === STATUS.READY || status === STATUS.SPEAKING) {
      startListening();
    }
  }, [status, startListening, stopListening]);

  /* ── Status label & icon ───────────────────────────────── */
  const statusConfig = {
    [STATUS.IDLE]: { label: "Offline", icon: "mic_off", color: "text-luxury-cream/30" },
    [STATUS.CONNECTING]: { label: "Connecting...", icon: "sync", color: "text-luxury-gold" },
    [STATUS.READY]: { label: "Ready", icon: "mic", color: "text-emerald-400" },
    [STATUS.LISTENING]: { label: "Listening...", icon: "graphic_eq", color: "text-luxury-crimson" },
    [STATUS.THINKING]: { label: "Processing...", icon: "psychology", color: "text-luxury-gold" },
    [STATUS.SPEAKING]: { label: "Speaking...", icon: "volume_up", color: "text-luxury-gold" },
    [STATUS.ERROR]: { label: "Error", icon: "error", color: "text-red-400" },
  };
  const st = statusConfig[status];

  /* ── Floating button (closed) ──────────────────────────── */
  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center
                   bg-gradient-to-br from-luxury-crimson to-luxury-crimson/70
                   shadow-lg shadow-luxury-crimson/25
                   hover:scale-105 active:scale-95 transition-transform duration-200
                   group"
        aria-label="Open voice assistant"
        title="Prospera Voice Concierge"
      >
        <span className="material-symbols-outlined text-luxury-cream text-2xl group-hover:scale-110 transition-transform">
          mic
        </span>
      </button>
    );
  }

  /* ── Full voice panel ──────────────────────────────────── */
  return (
    <div
      className="fixed bottom-6 left-6 z-50 flex flex-col
                 w-[400px] h-[620px] max-h-[85vh]
                 rounded-3xl overflow-hidden
                 bg-[#12121A] border border-luxury-gold/8
                 shadow-2xl shadow-black/50"
      style={{ animation: "voice-slide-up 0.35s ease-out" }}
    >
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#12121A]">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-luxury-crimson to-luxury-crimson/60 flex items-center justify-center">
            <span className="material-symbols-outlined text-luxury-cream text-xl">record_voice_over</span>
            {status === STATUS.LISTENING && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-[#12121A]" style={{ animation: "voice-blink 1.2s infinite" }} />
            )}
          </div>
          <div>
            <p className="text-sm font-extrabold text-luxury-cream leading-none">Voice Concierge</p>
            <p className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 ${st.color}`}>
              {st.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-luxury-cream/40 hover:text-luxury-cream/70 hover:bg-white/[0.05] transition-all"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>

      {/* ─── Central orb area ────────────────────────────── */}
      <div className="flex flex-col items-center justify-center py-6 relative">
        <PulseRings active={status === STATUS.LISTENING || status === STATUS.SPEAKING} />
        <button
          onClick={toggleMic}
          disabled={status === STATUS.CONNECTING || status === STATUS.THINKING}
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center
                     transition-all duration-300 shadow-lg
                     ${
                       status === STATUS.LISTENING
                         ? "bg-luxury-crimson shadow-luxury-crimson/40 scale-110"
                         : status === STATUS.SPEAKING
                         ? "bg-luxury-gold/20 border-2 border-luxury-gold/40 shadow-luxury-gold/20"
                         : status === STATUS.ERROR
                         ? "bg-red-500/20 border-2 border-red-500/30"
                         : "bg-white/[0.06] border-2 border-white/[0.1] hover:border-luxury-gold/30 hover:bg-white/[0.08]"
                     }
                     disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <span className={`material-symbols-outlined text-3xl transition-colors
            ${
              status === STATUS.LISTENING
                ? "text-luxury-cream"
                : status === STATUS.SPEAKING
                ? "text-luxury-gold"
                : status === STATUS.ERROR
                ? "text-red-400"
                : "text-luxury-cream/60"
            }`}
          >
            {st.icon}
          </span>
        </button>
        <p className="mt-3 text-[11px] text-luxury-cream/30 font-medium">
          {status === STATUS.LISTENING
            ? "Tap to stop"
            : status === STATUS.READY
            ? "Tap to speak"
            : status === STATUS.CONNECTING
            ? "Establishing connection..."
            : status === STATUS.ERROR
            ? error || "Something went wrong"
            : status === STATUS.SPEAKING
            ? "Agent is responding..."
            : ""}
        </p>
      </div>

      {/* ─── Transcript ──────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-3"
        style={{ scrollBehavior: "smooth" }}
      >
        {transcript.map((msg, i) => (
          <TranscriptBubble key={i} role={msg.role} text={msg.text} time={msg.time} />
        ))}
        {status === STATUS.THINKING && (
          <div className="flex items-start gap-2">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white/[0.05] border border-white/[0.08] px-4 py-3">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-luxury-gold/50"
                    style={{
                      animation: `typing-bounce 1.2s ${i * 0.15}s ease-in-out infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Text input fallback + quick actions ─────────── */}
      <div className="px-4 pb-3 pt-2 border-t border-white/[0.06]">
        {/* Text input */}
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-2.5">
          <input
            type="text"
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendText();
              }
            }}
            placeholder="Or type your question..."
            className="flex-1 bg-transparent text-sm text-luxury-cream placeholder:text-luxury-cream/25 outline-none"
            disabled={!wsRef.current?.isConnected}
          />
          <button
            onClick={() => sendText()}
            disabled={!currentText.trim() || !wsRef.current?.isConnected}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       bg-luxury-gold/90 hover:bg-luxury-gold transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-luxury-dark text-base">send</span>
          </button>
        </div>

        {/* Quick-action pills */}
        <div className="flex flex-wrap gap-2 mt-3 px-1">
          {VOICE_PROMPTS.map((vp) => (
            <button
              key={vp.label}
              onClick={() => sendText(vp.prompt)}
              disabled={!wsRef.current?.isConnected}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold
                         bg-white/[0.04] border border-white/[0.08]
                         text-luxury-cream/50 hover:text-luxury-cream/80 hover:border-luxury-gold/20
                         transition-all disabled:opacity-40"
            >
              {vp.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
