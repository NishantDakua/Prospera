/**
 * Prospera — Shared constants
 * Centralizes brand meta, navigation, and content data
 * used across components.
 */

export const BRAND = {
    name: "Prospera",
    tagline: "Premium Tier",
    description:
        "The definitive platform for premium collaborative savings. Excellence in fintech, delivered with absolute discretion.",
};

export const NAV_LINKS = [
    { label: "The Experience", href: "/dashboard" },
    { label: "Ecosystem", href: "/circle/bidding" },
    { label: "Security", href: "/profile" },
    { label: "Concierge", href: "/dashboard" },
];

export const SIDEBAR_LINKS = [
    { icon: "dashboard", label: "Overview", href: "/dashboard" },
    { icon: "groups", label: "My Circles", href: "/circle/bidding" },
    { icon: "history", label: "Activity Log", href: "#" },
    { icon: "gavel", label: "Live Bidding", href: "/circle/bidding" },
    { icon: "military_tech", label: "Rewards", href: "#" },
    { icon: "settings", label: "Preferences", href: "/profile" },
];

export const FOOTER_COLUMNS = [
    {
        title: "Experience",
        links: ["The Methodology", "Circle Tiers", "Institutional", "Security Protocols"],
    },
    {
        title: "Curated",
        links: ["Private Equity", "Heritage", "Insights", "Global Network"],
    },
    {
        title: "Advisory",
        links: ["Privacy Accord", "Terms of Use", "Compliance", "Client Service"],
    },
];

export const FEATURES = [
    {
        icon: "account_balance_wallet",
        title: "Smart Ledger",
        desc: "Immutable transactional transparency powered by military-grade encryption for absolute clarity.",
    },
    {
        icon: "auto_awesome",
        title: "Automated Bidding",
        desc: "Proprietary algorithms manage fair rotation and payout schedules with zero manual intervention.",
    },
    {
        icon: "verified_user",
        title: "Elite Payouts",
        desc: "Instant fund distribution through our global high-speed financial network with 99.9% uptime.",
    },
    {
        icon: "monitoring",
        title: "Real-Time Insights",
        desc: "Bespoke analytics and wealth projection tools at your fingertips, optimized for high-net-worth goals.",
    },
];
