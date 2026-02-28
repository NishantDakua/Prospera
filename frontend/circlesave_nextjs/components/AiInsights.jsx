"use client";

import { useState, useCallback } from "react";

/**
 * AiInsights — a collapsible panel that fetches and renders AI-powered
 * analysis for a Prospera savings circle.
 *
 * Props:
 *   circleParams  — { contributionAmount (number, ETH), maxMembers, poolType (0|1),
 *                     totalDuration (sec), biddingWindow (sec),
 *                     currentRound?, poolAmount?, memberCount? }
 *   compact       — (bool) smaller variant for the create-page preview
 */
export default function AiInsights({ circleParams, compact = false }) {
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const fetchInsights = useCallback(async () => {
    if (insights) {
      setOpen((o) => !o);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(circleParams),
      });
      const data = await res.json();
      if (data.insights) {
        setInsights(data.insights);
        setOpen(true);
      } else {
        setError("No insights returned.");
      }
    } catch (e) {
      console.error("[AiInsights] fetch error:", e);
      setError("Failed to load insights. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [circleParams, insights]);

  const refresh = useCallback(async () => {
    setInsights("");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(circleParams),
      });
      const data = await res.json();
      if (data.insights) {
        setInsights(data.insights);
        setOpen(true);
      }
    } catch (e) {
      setError("Failed to refresh insights.");
    } finally {
      setLoading(false);
    }
  }, [circleParams]);

  /* ─── Minimal Markdown → JSX renderer ─── */
  const renderMarkdown = (md) => {
    const lines = md.split("\n");
    const elements = [];
    let listItems = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="space-y-2 mb-4">
            {listItems.map((li, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-[#D5BF86] mt-0.5 shrink-0">•</span>
                <span dangerouslySetInnerHTML={{ __html: inlineFormat(li) }} />
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const inlineFormat = (text) =>
      text
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em class="text-slate-200">$1</em>')
        .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[#D5BF86] text-xs">$1</code>');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Heading 2
      if (line.startsWith("## ")) {
        flushList();
        elements.push(
          <h3
            key={`h-${i}`}
            className="text-base font-black text-white mt-5 mb-2 flex items-center gap-2 border-b border-white/10 pb-2"
          >
            <span dangerouslySetInnerHTML={{ __html: inlineFormat(line.replace(/^##\s*/, "")) }} />
          </h3>
        );
        continue;
      }

      // Heading 3
      if (line.startsWith("### ")) {
        flushList();
        elements.push(
          <h4 key={`h3-${i}`} className="text-sm font-bold text-[#D5BF86] mt-4 mb-1">
            <span dangerouslySetInnerHTML={{ __html: inlineFormat(line.replace(/^###\s*/, "")) }} />
          </h4>
        );
        continue;
      }

      // Bold Q&A lines (FAQ)
      if (line.startsWith("**Q:")) {
        flushList();
        elements.push(
          <div key={`qa-${i}`} className="mt-3 mb-1">
            <p className="text-sm font-bold text-white" dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
          </div>
        );
        continue;
      }

      // List items
      if (/^[-*]\s/.test(line)) {
        listItems.push(line.replace(/^[-*]\s/, ""));
        continue;
      }

      // Empty line
      if (line.trim() === "") {
        flushList();
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={`p-${i}`} className="text-sm text-slate-300 mb-2 leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
        </p>
      );
    }
    flushList();
    return elements;
  };

  /* ─── Render ─── */
  return (
    <div
      className={`rounded-3xl overflow-hidden transition-all ${
        compact
          ? "bg-white/[0.03] border border-white/10"
          : "glass-card-bidding border border-violet-500/20 shadow-lg shadow-violet-500/5"
      }`}
    >
      {/* Toggle header */}
      <button
        onClick={fetchInsights}
        disabled={loading}
        className={`w-full flex items-center justify-between gap-3 px-6 transition-all ${
          compact ? "py-4" : "py-5"
        } ${open ? "border-b border-white/10" : ""} hover:bg-white/[0.02]`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`size-9 rounded-xl flex items-center justify-center ${
              open
                ? "bg-violet-500/20 text-violet-400"
                : "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-300"
            }`}
          >
            <span className="material-symbols-outlined text-xl">
              {loading ? "progress_activity" : "auto_awesome"}
            </span>
          </div>
          <div className="text-left">
            <h3 className={`font-black text-white ${compact ? "text-sm" : "text-base"}`}>
              AI Insights
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Powered by Gemini
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="animate-spin material-symbols-outlined text-violet-400 text-lg">
              progress_activity
            </span>
          )}
          {insights && !loading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                refresh();
              }}
              className="text-slate-500 hover:text-violet-400 transition-colors"
              title="Regenerate insights"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
            </button>
          )}
          <span
            className={`material-symbols-outlined text-slate-500 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            expand_more
          </span>
        </div>
      </button>

      {/* Loading shimmer */}
      {loading && !insights && (
        <div className="px-6 py-6 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="animate-pulse material-symbols-outlined text-violet-400 text-lg">auto_awesome</span>
            <span className="text-violet-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              Analysing circle parameters…
            </span>
          </div>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-3 bg-white/5 rounded-full animate-pulse"
              style={{ width: `${85 - i * 12}%`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-6 py-4">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </p>
        </div>
      )}

      {/* Insights content */}
      {open && insights && !loading && (
        <div className="px-6 py-5 max-h-[600px] overflow-y-auto custom-scrollbar">
          {renderMarkdown(insights)}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
            <span className="material-symbols-outlined text-xs text-slate-600">info</span>
            <p className="text-[10px] text-slate-600 italic">
              AI-generated analysis. Not financial advice. Always do your own research.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
