"use client";

/**
 * Reusable Card for the Simulator.
 */
export default function SimCard({ children, className = "", highlight = false }) {
  return (
    <div
      className={`
        rounded-2xl p-6 transition-all duration-300
        ${highlight
          ? "luxury-glass border-luxury-gold/20 shadow-lg shadow-luxury-gold/5"
          : "luxury-glass"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
