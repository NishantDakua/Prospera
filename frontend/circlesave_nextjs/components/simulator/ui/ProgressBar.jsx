"use client";

/**
 * ProgressBar — shows step progress across the 4-level simulator.
 */
export default function ProgressBar({ currentStep, totalSteps }) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  const stepLabels = ["Join Pool", "Bidding", "Discipline", "Summary"];

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {stepLabels.map((label, idx) => {
          const stepNum = idx + 1;
          const isComplete = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          return (
            <div key={idx} className="flex flex-col items-center gap-1.5" style={{ minWidth: 60 }}>
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300
                  ${isComplete
                    ? "bg-[#10B981] border-[#10B981] text-white"
                    : isActive
                    ? "bg-luxury-gold border-luxury-gold text-luxury-dark"
                    : "bg-transparent border-luxury-gold/10 text-luxury-cream/40"}
                `}
              >
                {isComplete ? "✓" : stepNum}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                  isActive ? "text-luxury-gold" : isComplete ? "text-[#10B981]" : "text-luxury-cream/30"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bar */}
      <div className="relative h-1.5 bg-luxury-gold/10 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-luxury-gold transition-all duration-500 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-[10px] text-luxury-cream/40 text-right font-semibold tracking-wider">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  );
}
