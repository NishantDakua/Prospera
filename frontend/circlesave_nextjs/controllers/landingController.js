/**
 * CONTROLLER: Landing
 * Orchestrates data for the landing page (/).
 * In production, replace with async API/DB calls.
 */

import { FEATURES } from "@/lib/constants";

/** Landing page hero stats (social proof) */
const HERO_USERS = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA8k62tZw4cmdFRnZdAaS7LoyElMkO5Q3wgwzzBd2G-fW8IqtRgW6w1rEuep0tKjj9V5uo5HwmQzwyRguHRZ41cntIPRQEhHxerHnRhkQCTrftIl5fclv3nOkyYE3JwRmm6WdWzWm0p3Iw8D1PzPoKZZrfjG8-FVR-Fui18N3HwNob42cNO5dO5z7vq9MspMm_I4q-qOHLrsYv0qkgJF99xRl11vvFCCNYY4hW6CDTUvAFgydDzhrPcDoXGwZNOajb1aNU6RCqQJjVc",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDn2GTh5zydbQJ0x1Qu33cCFHhQHcLXsB-gdEa_QCRUF5y3vzixneN460wqSY9reDqhfNPfpK-cPdSJZ-d_ccjdc7yxsvyleqE7S1knjGiIB_-fC5keOaY-7h2s9bAeZsS4VRaUnjP8xKYJg6_tqb6QbcTR5PGazp3zLljiMpc_AnrSUXzRnEVh4hdVWpiD5epi_gVXi07_AV55qC7alqo5syac2xCOxZPOcvKqiiGVhi66nLX4ZN5Kmo1kEIt1_S1Lyn4F_pe9ffai",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAPUWCYsKAvP4ZEAiAnYEJBvdScmcg-3oxsbJiIJ92r5z25Es5MYypoLMH9VwHbxwTXYoYU2Kbs7hUF2slEw6-2XOfg2oB5XcnWxPB1WREReTh-nsulnuwrfTYvGUzy1KxV3N4sraGUQUtefXTb_T3nAad7v_C-muVRJVKrUcTl7ZSfktiiDKcQbla2KgVJJZAohl0Dn7Z12ByuGpOmaTkCH6NNYERGiRlu2AIigiwIPKUXSC5l_7llACMSQEuPdBwEXc7MHNwCekwF",
];

const PORTFOLIO_ITEMS = [
    {
        icon: "diamond",
        iconBg: "bg-brand-gold/10 text-brand-gold border-brand-gold/10",
        name: "Legacy Fund Alpha",
        tag: "Tier 1 • Bi-Weekly",
        amount: "$12,500",
        status: "Secured",
        statusColor: "text-emerald-500",
        progress: "75%",
        bar: "premium-gradient",
    },
    {
        icon: "high_quality",
        iconBg: "bg-brand-crimson/10 text-brand-crimson border-brand-crimson/10",
        name: "Estate Acquisition",
        tag: "Tier 2 • Monthly",
        amount: "$50,000",
        status: "In 12 Days",
        statusColor: "text-slate-500",
        progress: "40%",
        bar: "bg-brand-gold",
    },
];

/**
 * Returns all data required to render the landing page.
 *
 * @returns {{ features, heroUsers, portfolioItems, totalAssets }}
 */
export function getLandingData() {
    return {
        features: FEATURES,
        heroUsers: HERO_USERS,
        portfolioItems: PORTFOLIO_ITEMS,
        totalAssets: "$120M+",
        cumulativeSavings: "$842,500.00",
    };
}
