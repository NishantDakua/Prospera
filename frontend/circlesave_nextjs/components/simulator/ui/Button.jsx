"use client";

/**
 * Reusable Button for the Simulator — follows Prospera fintech palette.
 */
export default function SimButton({ children, onClick, variant = "primary", disabled = false, className = "" }) {
  const base =
    "inline-flex items-center justify-center gap-2 font-bold text-sm rounded-xl px-6 py-3.5 transition-all duration-300 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed select-none";

  const variants = {
    primary:
      "premium-gradient text-white hover:brightness-110 shadow-lg shadow-luxury-crimson/20 active:scale-[0.98]",
    secondary:
      "border border-luxury-gold/20 text-luxury-gold hover:bg-luxury-gold/10 active:scale-[0.98]",
    success:
      "bg-[#10B981] text-white hover:brightness-110 shadow-lg shadow-[#10B981]/20 active:scale-[0.98]",
    danger:
      "bg-[#EF4444] text-white hover:brightness-110 shadow-lg shadow-[#EF4444]/20 active:scale-[0.98]",
    ghost:
      "text-luxury-cream/50 hover:text-luxury-cream hover:bg-white/5 active:scale-[0.98]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
