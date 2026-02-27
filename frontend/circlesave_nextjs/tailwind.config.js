/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./views/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Landing page tokens
        "brand-bg": "#0F0F14",
        "brand-gold": "#D5BF86",
        "brand-ivory": "#F1F0CC",
        "brand-crimson": "#A71D31",
        "brand-deep": "#3F0D12",
        // Dashboard tokens
        "luxury-gold": "#D5BF86",
        "luxury-crimson": "#A71D31",
        "luxury-cream": "#F1F0CC",
        "luxury-dark": "#0F0F14",
        "luxury-tint": "#3F0D12",
        // Wizard / Bidding / Profile tokens
        primary: "#A71D31",
        "accent-gold": "#D5BF86",
        "text-ivory": "#F1F0CC",
        "background-light": "#f8f6f6",
        "background-dark": "#0F0F14",
        "card-glass": "#3F0D12",
        accent: "#d5bf86",
        wealth: "#f1f0cc",
        "navy-dark": "#0A0F14",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        serif: ["Playfair Display", "serif"],
        display: ["Manrope", "sans-serif"],
      },
      borderRadius: {
        custom: "20px",
      },
    },
  },
  plugins: [],
};
