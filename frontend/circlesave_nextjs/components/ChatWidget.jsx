"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthProvider";

/* ── Quick-action pills ──────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: "Optimize tax", prompt: "How can I optimize my taxes with chit fund investments?" },
  { label: "Export report", prompt: "How do I export my savings report from Prospera?" },
  { label: "Risk profile", prompt: "Analyze my risk profile based on my chit fund activity." },
  { label: "How it works", prompt: "Explain how Prospera chit funds work in simple terms." },
];

/* ── Time formatter ──────────────────────────────────────── */
function fmtTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ── Typing indicator dots ───────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-luxury-cream/40"
          style={{
            animation: `typing-bounce 1.2s ${i * 0.15}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Single chat bubble ──────────────────────────────────── */
function ChatBubble({ role, text, time }) {
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
        {isUser ? "You" : "Prospera AI"} &middot; {fmtTime(time)}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN CHAT WIDGET
   ═══════════════════════════════════════════════════════════ */
export default function ChatWidget() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] || "there";

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  /* Scroll to bottom on new message */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  /* Focus input when chat opens */
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, minimized]);

  /* Add greeting on first open */
  const hasGreeted = useRef(false);
  useEffect(() => {
    if (open && !hasGreeted.current) {
      hasGreeted.current = true;
      setMessages([
        {
          role: "bot",
          text: `Good evening, ${firstName}. I'm your premium financial assistant. How can I help you today?`,
          time: new Date(),
        },
      ]);
    }
  }, [open, firstName]);

  /* Send message to Flask backend via Next.js proxy */
  const send = useCallback(
    async (text) => {
      const trimmed = (text || input).trim();
      if (!trimmed || loading) return;

      const userMsg = { role: "user", text: trimmed, time: new Date() };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmed }),
        });
        const data = await res.json();
        setMessages((m) => [
          ...m,
          { role: "bot", text: data.answer || "Sorry, I couldn't process that.", time: new Date() },
        ]);
      } catch {
        setMessages((m) => [
          ...m,
          { role: "bot", text: "Connection error. Please try again.", time: new Date() },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading]
  );

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  /* ── Floating button (chat closed) ─────────────────────── */
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center
                   bg-luxury-crimson shadow-lg shadow-luxury-crimson/25
                   hover:scale-105 active:scale-95 transition-transform duration-200"
        aria-label="Open chat"
      >
        <span className="material-symbols-outlined text-luxury-cream text-2xl">chat</span>
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
          <span className="material-symbols-outlined text-luxury-cream text-base">smart_toy</span>
        </div>
        <span className="text-sm font-bold text-luxury-cream">Prospera AI</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
            setMinimized(false);
          }}
          className="ml-1 text-luxury-cream/30 hover:text-luxury-cream/60 transition-colors"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    );
  }

  /* ── Full chat panel ───────────────────────────────────── */
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col
                 w-[400px] h-[600px] max-h-[85vh]
                 rounded-3xl overflow-hidden
                 bg-[#12121A] border border-luxury-gold/8
                 shadow-2xl shadow-black/40"
      style={{ animation: "chat-slide-up 0.3s ease-out" }}
    >
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-luxury-crimson flex items-center justify-center">
            <span className="material-symbols-outlined text-luxury-cream text-xl">smart_toy</span>
          </div>
          <div>
            <p className="text-sm font-extrabold text-luxury-cream leading-none">Prospera AI</p>
            <p className="text-[10px] font-bold text-luxury-gold tracking-widest uppercase mt-0.5">
              Premium Assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-luxury-cream/40 hover:text-luxury-cream/70 hover:bg-white/[0.05] transition-all"
          >
            <span className="material-symbols-outlined text-lg">remove</span>
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setMinimized(false);
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-luxury-cream/40 hover:text-luxury-cream/70 hover:bg-white/[0.05] transition-all"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>

      {/* ─── Messages ────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} text={msg.text} time={msg.time} />
        ))}
        {loading && (
          <div className="flex items-start gap-2">
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your finances..."
            className="flex-1 bg-transparent text-sm text-luxury-cream placeholder:text-luxury-cream/25 outline-none"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       bg-luxury-gold/90 hover:bg-luxury-gold transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-luxury-dark text-base">send</span>
          </button>
        </div>

        {/* ─── Quick actions ─────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mt-3 px-1">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.label}
              onClick={() => send(qa.prompt)}
              disabled={loading}
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
