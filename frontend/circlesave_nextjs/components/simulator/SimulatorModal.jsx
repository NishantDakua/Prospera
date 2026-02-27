"use client";

import { useState, useEffect } from "react";
import ProgressBar from "./ui/ProgressBar";
import PoolLevel from "./PoolLevel";
import BiddingLevel from "./BiddingLevel";
import TrustLevel from "./TrustLevel";
import CompletionLevel from "./CompletionLevel";

const TOTAL_STEPS = 4;

/**
 * SimulatorModal — Full-screen guided simulator modal.
 * Opens when user clicks "Learn How It Works" on the dashboard.
 */
export default function SimulatorModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [simState, setSimState] = useState({});

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Reset state on close so re-opening starts fresh
      setCurrentStep(1);
      setSimState({});
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleNext = () => {
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleUpdateState = (partial) => {
    setSimState((prev) => ({ ...prev, ...partial }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div
        className="relative z-10 flex flex-col w-full max-w-4xl mx-4 rounded-3xl bg-luxury-dark border border-luxury-gold/10 shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-luxury-gold/10 bg-luxury-dark flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-luxury-gold text-base">school</span>
            </div>
            <div>
              <h1 className="text-luxury-cream font-extrabold text-lg tracking-tight">
                Prospera Simulator
              </h1>
              <p className="text-luxury-gold/60 text-xs font-semibold">
                Interactive guided experience · {TOTAL_STEPS} levels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-luxury-gold/5 hover:bg-luxury-gold/10 flex items-center justify-center transition-colors text-luxury-cream/40 hover:text-luxury-cream border border-luxury-gold/10"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-8 py-5 border-b border-luxury-gold/10 bg-luxury-dark flex-shrink-0">
          <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 bg-luxury-dark" style={{ scrollbarWidth: "thin", scrollbarColor: "#D5BF8630 transparent" }}>
          {currentStep === 1 && (
            <PoolLevel onNext={handleNext} onUpdateState={handleUpdateState} />
          )}
          {currentStep === 2 && (
            <BiddingLevel onNext={handleNext} onUpdateState={handleUpdateState} />
          )}
          {currentStep === 3 && (
            <TrustLevel onNext={handleNext} onUpdateState={handleUpdateState} />
          )}
          {currentStep === 4 && (
            <CompletionLevel simState={simState} onClose={onClose} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-luxury-gold/10 bg-luxury-dark flex-shrink-0">
          <p className="text-luxury-cream/30 text-[10px] font-semibold uppercase tracking-widest">
            Prospera · Simulation Mode · No real funds involved
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <p className="text-luxury-cream/40 text-[10px] font-semibold">Mock Data Only</p>
          </div>
        </div>
      </div>
    </div>
  );
}
