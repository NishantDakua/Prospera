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

const QUICK_ACTIONS = [
  { label: "My circles",     prompt: "Tell me about my active circles" },
  { label: "How bidding works", prompt: "Explain how the bidding process works" },
  { label: "Trust score",    prompt: "What is my trust score and how to improve it" },
  { label: "Optimize tax",   prompt: "How can I optimize my taxes with chit fund investments?" },
  { label: "Risk profile",   prompt: "Analyze my risk profile based on my chit fund activity." },
  { label: "How it works",   prompt: "Explain how Prospera chit funds work in simple terms." },
];

/* ── Modes ───────────────────────────────────────────────── */
const MODE = { TEXT: "text", VOICE: "voice" };

/* ── Voice status ────────────────────────────────────────── */
const VOICE = {
  IDLE: "idle",
  CONNECTING: "connecting",
  READY: "ready",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
  ERROR: "error",
};

/* ── Helpers ─────────────────────────────────────────────── */
function fmtTime(d) {
  return (d instanceof Date ? d : new Date()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Typing dots ─────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-luxury-cream/40"
          style={{ animation: `typing-bounce 1.2s ${i * 0.15}s ease-in-out infinite` }}
        />
      ))}
    </div>
  );
}

/* ── Pulse rings for voice orb ───────────────────────────── */
function PulseRings({ active, micLevel = 0 }) {
  if (!active) return null;
  // When mic is active, rings scale with voice volume
  const boost = 1 + micLevel * 0.6;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute rounded-full border border-luxury-crimson/30"
          style={{
            width: `${(56 + i * 20) * boost}px`,
            height: `${(56 + i * 20) * boost}px`,
            opacity: 0.3 + micLevel * 0.5,
            transition: "width 0.1s, height 0.1s, opacity 0.1s",
            animation: `voice-pulse 2s ${i * 0.4}s ease-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Chat bubble (shared for both modes) ─────────────────── */
function Bubble({ role, text, time }) {
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
        {isUser ? "You" : "Prospera AI"} &middot; {typeof time === "string" ? time : fmtTime(time)}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   UNIFIED AI ASSISTANT
   ═══════════════════════════════════════════════════════════ */
export default function AiAssistant() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] || "there";

  /* ── Shared state ──────────────────────────────────────── */
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [mode, setMode] = useState(MODE.TEXT);
  const [messages, setMessages] = useState([]);

  /* ── Text-mode state ───────────────────────────────────── */
  const [textInput, setTextInput] = useState("");
  const [textLoading, setTextLoading] = useState(false);

  /* ── Voice-mode state ──────────────────────────────────── */
  const [voiceStatus, setVoiceStatus] = useState(VOICE.IDLE);
  const [voiceError, setVoiceError] = useState("");
  const [micLevel, setMicLevel] = useState(0); // 0-1 audio input level

  /* ── Refs ──────────────────────────────────────────────── */
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const audioQueueRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const hasGreeted = useRef(false);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const intentionalDisconnectRef = useRef(false); // true only when user explicitly disconnects
  const voiceConnectRef = useRef(null);           // always points to latest voiceConnect fn
  const startListeningRef = useRef(null);         // always points to latest startListening fn
  const isListeningRef = useRef(false);           // true while mic is actively streaming

  /* ── Scroll on new messages ────────────────────────────── */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, textLoading]);

  /* ── Focus input on text mode ──────────────────────────── */
  useEffect(() => {
    if (open && !minimized && mode === MODE.TEXT) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, minimized, mode]);

  /* ── Greeting on first open ────────────────────────────── */
  useEffect(() => {
    if (open && !hasGreeted.current) {
      hasGreeted.current = true;
      setMessages([
        {
          role: "bot",
          text: `Good evening, ${firstName}. I'm your Prospera AI assistant. You can type or switch to voice - how may I help you today?`,
          time: new Date(),
        },
      ]);
    }
  }, [open, firstName]);

  /* ── Cleanup on unmount ────────────────────────────────── */
  useEffect(() => {
    return () => voiceDisconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ═══════════════════════════════════════════════════════
     TEXT MODE: send to /api/chat (Flask RAG backend)
     ═══════════════════════════════════════════════════════ */
  const sendTextMessage = useCallback(
    async (text) => {
      const trimmed = (text || textInput).trim();
      if (!trimmed || textLoading) return;

      setMessages((m) => [...m, { role: "user", text: trimmed, time: new Date() }]);
      setTextInput("");
      setTextLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmed }),
        });
        const data = await res.json();
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text: data.answer || "Sorry, I couldn't process that.",
            time: new Date(),
          },
        ]);
      } catch {
        setMessages((m) => [
          ...m,
          { role: "bot", text: "Connection error. Please try again.", time: new Date() },
        ]);
      } finally {
        setTextLoading(false);
      }
    },
    [textInput, textLoading]
  );

  /* ═══════════════════════════════════════════════════════
     VOICE MODE: WebSocket to FastAPI voice agent
     ═══════════════════════════════════════════════════════ */

  const voiceConnect = useCallback(async () => {
    intentionalDisconnectRef.current = false;
    try {
      setVoiceStatus(VOICE.CONNECTING);
      setVoiceError("");

      // Clean up any previous audio context / mic (e.g. on auto-reconnect)
      if (processorRef.current) {
        processorRef.current.source?.disconnect();
        processorRef.current.processor?.disconnect();
        processorRef.current.micCtx?.close().catch(() => {});
        processorRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (audioCtxRef.current?.state !== "closed") {
        audioCtxRef.current?.close().catch(() => {});
      }

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000,
      });
      audioCtxRef.current = audioCtx;
      audioQueueRef.current = new AudioQueue(audioCtx);

      const ws = new VoiceWebSocket(WS_URL);

      ws.onMessage = (data) => {
        switch (data.type) {
          case "ready":
            setVoiceStatus(VOICE.READY);
            setMessages((m) => [
              ...m,
              {
                role: "bot",
                text: `Voice mode active. Tap the mic and start speaking, ${firstName}.`,
                time: new Date(),
              },
            ]);
            break;

          case "user":
            setMessages((m) => [
              ...m,
              { role: "user", text: data.text, time: new Date() },
            ]);
            // Pause mic — Gemini is now processing our speech
            isListeningRef.current = false;
            setVoiceStatus(VOICE.THINKING);
            break;

          case "agent":
            setMessages((m) => [
              ...m,
              { role: "bot", text: data.text, time: new Date() },
            ]);
            setVoiceStatus(VOICE.SPEAKING);
            break;

          case "audio":
            try {
              const audioBuf = base64ToAudioBuffer(data.audio, audioCtx);
              audioQueueRef.current.addToQueue(audioBuf);
              // Pause mic while Gemini is speaking audio
              isListeningRef.current = false;
              setVoiceStatus(VOICE.SPEAKING);
            } catch (e) {
              console.error("Audio decode error:", e);
            }
            break;

          case "turn_complete":
            // Gemini finished — resume mic so user can speak again
            isListeningRef.current = true;
            setVoiceStatus(VOICE.LISTENING);
            break;

          case "error":
            setVoiceError(data.message || "Voice connection error");
            setVoiceStatus(VOICE.ERROR);
            break;
        }
      };

      ws.onClose = () => {
        // Backend keeps WS alive; this fires only on real disconnect
        setVoiceStatus((prev) => prev === VOICE.ERROR ? VOICE.ERROR : VOICE.IDLE);
      };
      ws.onError = () => {
        setVoiceError("Failed to connect to voice server");
        setVoiceStatus(VOICE.ERROR);
      };

      await ws.connect();
      wsRef.current = ws;
    } catch (e) {
      console.error("Voice connection failed:", e);
      setVoiceError("Could not connect to voice server. Is it running on port 8002?");
      setVoiceStatus(VOICE.ERROR);
    }
  }, [firstName]);

  // Keep the ref pointing to the latest version so ws.onClose can call it
  useEffect(() => { voiceConnectRef.current = voiceConnect; }, [voiceConnect]);

  const startListening = useCallback(async () => {
    if (!wsRef.current?.isConnected) return;
    if (processorRef.current) {
      // Mic pipeline already running — just mark listening
      isListeningRef.current = true;
      setVoiceStatus(VOICE.LISTENING);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      mediaStreamRef.current = stream;

      // Use a SEPARATE AudioContext for mic capture (system default rate)
      // The playback context (audioCtxRef) stays at 24kHz for Gemini audio output
      const micCtx = new (window.AudioContext || window.webkitAudioContext)();
      // Chrome suspends AudioContext by default — must resume before processing
      if (micCtx.state === "suspended") await micCtx.resume();
      const source = micCtx.createMediaStreamSource(stream);

      // AnalyserNode for live mic level visualization
      const analyser = micCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length / 255;
        setMicLevel(avg);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);

      const processor = micCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        // Only send audio when it's our turn to speak (not while Gemini is responding)
        if (!wsRef.current?.isConnected || !isListeningRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const downsampled = downsampleBuffer(inputData, micCtx.sampleRate, 16000);
        wsRef.current.send({ type: "audio", audio: floatTo16BitPCM(downsampled) });
      };

      source.connect(processor);
      // Connect to a silent gain node (NOT speakers) so onaudioprocess fires
      // without playing mic audio through speakers (which would cause echo)
      const silentGain = micCtx.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(micCtx.destination);

      processorRef.current = { source, processor, micCtx };
      isListeningRef.current = true;
      setVoiceStatus(VOICE.LISTENING);
    } catch {
      setVoiceError("Microphone access denied.");
      setVoiceStatus(VOICE.ERROR);
    }
  }, []);

  // Keep the ref pointing to the latest version so turn_complete can call it
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  const stopListening = useCallback(() => {
    // Stop audio level animation
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    analyserRef.current = null;
    setMicLevel(0);
    isListeningRef.current = false;

    if (processorRef.current) {
      processorRef.current.source.disconnect();
      processorRef.current.processor.disconnect();
      // Close the separate mic AudioContext
      if (processorRef.current.micCtx?.state !== "closed") {
        processorRef.current.micCtx?.close().catch(() => {});
      }
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (voiceStatus === VOICE.LISTENING) setVoiceStatus(VOICE.READY);
  }, [voiceStatus]);

  const voiceDisconnect = useCallback(() => {
    intentionalDisconnectRef.current = true;
    stopListening();
    wsRef.current?.close();
    wsRef.current = null;
    audioQueueRef.current?.reset();
    if (audioCtxRef.current?.state !== "closed") {
      audioCtxRef.current?.close().catch(() => {});
    }
    audioCtxRef.current = null;
    setVoiceStatus(VOICE.IDLE);
  }, [stopListening]);

  const voiceSendText = useCallback(
    (text) => {
      const trimmed = (text || textInput).trim();
      if (!trimmed || !wsRef.current?.isConnected) return;
      wsRef.current.send({ type: "text", text: trimmed });
      setTextInput("");
    },
    [textInput]
  );

  const toggleMic = useCallback(() => {
    if (voiceStatus === VOICE.LISTENING) stopListening();
    else if (voiceStatus === VOICE.READY || voiceStatus === VOICE.SPEAKING) startListening();
    else if (voiceStatus === VOICE.IDLE || voiceStatus === VOICE.ERROR) voiceConnect();
  }, [voiceStatus, startListening, stopListening, voiceConnect]);

  /* ═══════════════════════════════════════════════════════
     MODE SWITCHING
     ═══════════════════════════════════════════════════════ */
  const switchMode = useCallback(
    (newMode) => {
      if (newMode === mode) return;
      // Leaving voice mode — disconnect
      if (mode === MODE.VOICE) voiceDisconnect();
      // Entering voice mode — connect
      if (newMode === MODE.VOICE) voiceConnect();
      setMode(newMode);
    },
    [mode, voiceDisconnect, voiceConnect]
  );

  /* ═══════════════════════════════════════════════════════
     OPEN / CLOSE / MINIMIZE
     ═══════════════════════════════════════════════════════ */
  const handleClose = useCallback(() => {
    voiceDisconnect();
    setOpen(false);
    setMinimized(false);
    setMessages([]);
    hasGreeted.current = false;
    setMode(MODE.TEXT);
    setVoiceError("");
  }, [voiceDisconnect]);

  /* ── Voice status config ───────────────────────────────── */
  const voiceSt = {
    [VOICE.IDLE]:       { icon: "mic_off",      color: "text-luxury-cream/30" },
    [VOICE.CONNECTING]: { icon: "sync",          color: "text-luxury-gold" },
    [VOICE.READY]:      { icon: "mic",           color: "text-emerald-400" },
    [VOICE.LISTENING]:  { icon: "graphic_eq",    color: "text-luxury-crimson" },
    [VOICE.THINKING]:   { icon: "psychology",    color: "text-luxury-gold" },
    [VOICE.SPEAKING]:   { icon: "volume_up",     color: "text-luxury-gold" },
    [VOICE.ERROR]:      { icon: "error",         color: "text-red-400" },
  }[voiceStatus];

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */

  /* ── Floating button ───────────────────────────────────── */
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center
                   bg-luxury-crimson shadow-lg shadow-luxury-crimson/25
                   hover:scale-105 active:scale-95 transition-transform duration-200 group"
        aria-label="Open AI assistant"
      >
        <span className="material-symbols-outlined text-luxury-cream text-2xl group-hover:scale-110 transition-transform">
          auto_awesome
        </span>
      </button>
    );
  }

  /* ── Minimized pill ────────────────────────────────────── */
  if (minimized) {
    return (
      <div
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer
                    bg-[#1A1A22] border border-luxury-gold/10 shadow-2xl"
        onClick={() => setMinimized(false)}
      >
        <div className="w-8 h-8 rounded-full bg-luxury-crimson flex items-center justify-center">
          <span className="material-symbols-outlined text-luxury-cream text-base">auto_awesome</span>
        </div>
        <span className="text-sm font-bold text-luxury-cream">Prospera AI</span>
        {mode === MODE.VOICE && voiceStatus === VOICE.LISTENING && (
          <span className="w-2 h-2 rounded-full bg-red-500" style={{ animation: "voice-blink 1.2s infinite" }} />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="ml-1 text-luxury-cream/30 hover:text-luxury-cream/60 transition-colors"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    );
  }

  /* ── Full panel ────────────────────────────────────────── */
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col
                 w-[420px] h-[640px] max-h-[85vh]
                 rounded-3xl overflow-hidden
                 bg-[#12121A] border border-luxury-gold/8
                 shadow-2xl shadow-black/50"
      style={{ animation: "chat-slide-up 0.3s ease-out" }}
    >
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-luxury-crimson to-luxury-crimson/60 flex items-center justify-center">
            <span className="material-symbols-outlined text-luxury-cream text-xl">
              {mode === MODE.VOICE ? "record_voice_over" : "smart_toy"}
            </span>
            {mode === MODE.VOICE && voiceStatus === VOICE.LISTENING && (
              <span
                className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-[#12121A]"
                style={{ animation: "voice-blink 1.2s infinite" }}
              />
            )}
          </div>
          <div>
            <p className="text-sm font-extrabold text-luxury-cream leading-none">Prospera AI</p>
            <p className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 ${
              mode === MODE.VOICE ? voiceSt.color : "text-luxury-gold"
            }`}>
              {mode === MODE.VOICE
                ? (voiceStatus === VOICE.LISTENING ? "Listening..." : voiceStatus === VOICE.SPEAKING ? "Speaking..." : voiceStatus === VOICE.THINKING ? "Processing..." : voiceStatus === VOICE.CONNECTING ? "Connecting..." : voiceStatus === VOICE.ERROR ? "Error" : "Voice Ready")
                : "Premium Assistant"}
            </p>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-luxury-cream/40 hover:text-luxury-cream/70 hover:bg-white/[0.05] transition-all"
          >
            <span className="material-symbols-outlined text-lg">remove</span>
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-luxury-cream/40 hover:text-luxury-cream/70 hover:bg-white/[0.05] transition-all"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>

      {/* ─── Mode toggle ─────────────────────────────────── */}
      <div className="flex items-center gap-1 px-5 py-2.5 border-b border-white/[0.04]">
        <button
          onClick={() => switchMode(MODE.TEXT)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all
            ${mode === MODE.TEXT
              ? "bg-luxury-crimson/15 text-luxury-cream border border-luxury-crimson/30"
              : "text-luxury-cream/40 hover:text-luxury-cream/60 border border-transparent"
            }`}
        >
          <span className="material-symbols-outlined text-[16px]">chat</span>
          Text
        </button>
        <button
          onClick={() => switchMode(MODE.VOICE)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all
            ${mode === MODE.VOICE
              ? "bg-luxury-crimson/15 text-luxury-cream border border-luxury-crimson/30"
              : "text-luxury-cream/40 hover:text-luxury-cream/60 border border-transparent"
            }`}
        >
          <span className="material-symbols-outlined text-[16px]">mic</span>
          Voice
          {mode === MODE.VOICE && voiceStatus === VOICE.LISTENING && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-1" style={{ animation: "voice-blink 1.2s infinite" }} />
          )}
        </button>
      </div>

      {/* ─── Voice orb (only in voice mode) ──────────────── */}
      {mode === MODE.VOICE && (
        <div className="flex flex-col items-center justify-center py-5 relative shrink-0">
          <PulseRings active={voiceStatus === VOICE.LISTENING || voiceStatus === VOICE.SPEAKING} micLevel={micLevel} />
          <button
            onClick={toggleMic}
            disabled={voiceStatus === VOICE.CONNECTING || voiceStatus === VOICE.THINKING}
            className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center
                       shadow-lg
                       ${
                         voiceStatus === VOICE.LISTENING
                           ? "bg-luxury-crimson"
                           : voiceStatus === VOICE.SPEAKING
                           ? "bg-luxury-gold/20 border-2 border-luxury-gold/40 shadow-luxury-gold/20"
                           : voiceStatus === VOICE.ERROR
                           ? "bg-red-500/20 border-2 border-red-500/30"
                           : "bg-white/[0.06] border-2 border-white/[0.1] hover:border-luxury-gold/30 hover:bg-white/[0.08]"
                       }
                       disabled:opacity-40 disabled:cursor-not-allowed`}
            style={
              voiceStatus === VOICE.LISTENING
                ? {
                    transform: `scale(${1 + micLevel * 0.35})`,
                    boxShadow: `0 0 ${12 + micLevel * 30}px ${4 + micLevel * 12}px rgba(167,29,49,${0.3 + micLevel * 0.4})`,
                    transition: "transform 0.08s ease-out, box-shadow 0.08s ease-out",
                  }
                : voiceStatus === VOICE.SPEAKING
                ? { transition: "all 0.3s" }
                : { transition: "all 0.3s" }
            }
          >
            <span
              className={`material-symbols-outlined text-2xl transition-colors ${
                voiceStatus === VOICE.LISTENING ? "text-luxury-cream"
                : voiceStatus === VOICE.SPEAKING ? "text-luxury-gold"
                : voiceStatus === VOICE.ERROR ? "text-red-400"
                : "text-luxury-cream/60"
              }`}
            >
              {voiceSt.icon}
            </span>
          </button>
          <p className="mt-2 text-[11px] text-luxury-cream/30 font-medium">
            {voiceStatus === VOICE.LISTENING ? "Tap to stop"
              : voiceStatus === VOICE.READY ? "Tap to speak"
              : voiceStatus === VOICE.CONNECTING ? "Establishing connection..."
              : voiceStatus === VOICE.ERROR ? "Tap to retry"
              : voiceStatus === VOICE.SPEAKING ? "Agent is responding..."
              : voiceStatus === VOICE.IDLE ? "Tap to connect"
              : ""}
          </p>
        </div>
      )}

      {/* ─── Messages area ───────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.map((msg, i) => (
          <Bubble key={i} role={msg.role} text={msg.text} time={msg.time} />
        ))}
        {(textLoading || voiceStatus === VOICE.THINKING) && (
          <div className="flex items-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white/[0.05] border border-white/[0.08]">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* ─── Input bar ───────────────────────────────────── */}
      <div className="px-4 pb-3 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-2.5">
          <input
            ref={inputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (mode === MODE.TEXT) sendTextMessage();
                else voiceSendText();
              }
            }}
            placeholder={mode === MODE.TEXT ? "Ask about your finances..." : "Or type your question..."}
            className="flex-1 bg-transparent text-sm text-luxury-cream placeholder:text-luxury-cream/25 outline-none"
            disabled={mode === MODE.VOICE && !wsRef.current?.isConnected}
          />

          {/* Mic toggle button (only in text mode as a shortcut) */}
          {mode === MODE.TEXT && (
            <button
              onClick={() => switchMode(MODE.VOICE)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-luxury-cream/30 hover:text-luxury-cream/60 transition-colors"
              title="Switch to voice"
            >
              <span className="material-symbols-outlined text-base">mic</span>
            </button>
          )}

          <button
            onClick={() => (mode === MODE.TEXT ? sendTextMessage() : voiceSendText())}
            disabled={!textInput.trim() || (mode === MODE.VOICE && !wsRef.current?.isConnected) || textLoading}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       bg-luxury-gold/90 hover:bg-luxury-gold transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-luxury-dark text-base">send</span>
          </button>
        </div>

        {/* Quick-action pills */}
        <div className="flex flex-wrap gap-2 mt-2.5 px-1">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.label}
              onClick={() => (mode === MODE.TEXT ? sendTextMessage(qa.prompt) : voiceSendText(qa.prompt))}
              disabled={textLoading || (mode === MODE.VOICE && !wsRef.current?.isConnected)}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold
                         bg-white/[0.04] border border-white/[0.08]
                         text-luxury-cream/50 hover:text-luxury-cream/80 hover:border-luxury-gold/20
                         transition-all disabled:opacity-40"
            >
              {qa.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
