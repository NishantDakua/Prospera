/**
 * MODEL: Transaction
 * Defines the shape of a transaction and provides mock data.
 * In production, replace MOCK_TRANSACTIONS with an API/DB call.
 */

/**
 * @typedef {{
 *   icon: string,
 *   bg: string,
 *   title: string,
 *   sub: string,
 *   time: string,
 *   amount?: string,
 *   amtColor?: string
 * }} Transaction
 */

/** @type {Transaction[]} */
export const MOCK_TRANSACTIONS = [
    {
        icon: "account_balance",
        bg: "bg-luxury-crimson/10 text-luxury-crimson border-luxury-crimson/20",
        title: "Capital Injection",
        sub: 'Asset: "Tech Hub Growth"',
        time: "14:02 PM Today",
        amount: "+$250.00",
        amtColor: "text-emerald-500",
    },
    {
        icon: "workspace_premium",
        bg: "bg-luxury-gold/10 text-luxury-gold border-luxury-gold/20",
        title: "Auction Victory",
        sub: 'Payout: "Holiday Fund Elite"',
        time: "Yesterday",
        amount: "+$4,200.00",
        amtColor: "text-luxury-crimson",
    },
    {
        icon: "person_add",
        bg: "bg-white/5 text-luxury-gold/40 border-white/5",
        title: "Partner Induction",
        sub: 'Circle: "Estate Circle V"',
        time: "Oct 24, 2023",
        amount: "",
    },
];
