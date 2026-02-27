/**
 * MODEL: Circle
 * Defines the shape of a savings circle and provides mock data.
 * In production, replace MOCK_CIRCLES with an API/DB call.
 */

/**
 * @typedef {{
 *   name: string,
 *   inst: string,
 *   val: string,
 *   next: string,
 *   status: "ACTIVE" | "LOCKED" | "PENDING",
 *   statusColor: string
 * }} Circle
 */

/** @type {Circle[]} */
export const MOCK_CIRCLES = [
    {
        name: "Holiday Fun Elite 2024",
        inst: "$500/mo",
        val: "$6,000",
        next: "Dec 12, 2023",
        status: "ACTIVE",
        statusColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    {
        name: "Investment Pool Alpha",
        inst: "$1,000/mo",
        val: "$12,000",
        next: "Nov 28, 2023",
        status: "LOCKED",
        statusColor: "bg-luxury-gold/10 text-luxury-gold border-luxury-gold/20",
    },
    {
        name: "Luxe Vehicle Fund",
        inst: "$2,500/mo",
        val: "$30,000",
        next: "Jan 05, 2024",
        status: "ACTIVE",
        statusColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    {
        name: "Emergency Cushion",
        inst: "$100/mo",
        val: "$1,200",
        next: "Dec 20, 2023",
        status: "ACTIVE",
        statusColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
];

/** Upcoming auction data */
export const UPCOMING_AUCTION = {
    name: "Summer Estate Pool #04",
    description:
        "Secure the payout slot by placing a competitive bid before the timer expires.",
    countdown: [
        { val: "04", label: "Hours" },
        { val: "12", label: "Mins" },
        { val: "45", label: "Secs" },
    ],
};
