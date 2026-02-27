/**
 * CONTROLLER: Dashboard
 * Orchestrates data fetching for the /dashboard route.
 * In production, replace model imports with async API/DB calls.
 *
 * The controller is intentionally framework-agnostic — it returns
 * plain JS objects that the View (dashboard/page.jsx) can render.
 */

import { DEMO_USER } from "@/models/userModel";
import { MOCK_CIRCLES, UPCOMING_AUCTION } from "@/models/circleModel";
import { MOCK_TRANSACTIONS } from "@/models/transactionModel";

/**
 * Returns all data required to render the dashboard page.
 * Swap mock data for real async fetches when a backend is ready.
 *
 * @returns {{ user, stats, circles, transactions, auction }}
 */
export function getDashboardData() {
    const stats = [
        {
            label: "Total Managed Capital",
            value: "$12,450.00",
            sub: "+12.4% yield",
            subIcon: "trending_up",
            subColor: "text-emerald-500",
            subBg: "bg-emerald-500/10",
            bgIcon: "payments",
        },
        {
            label: "Active Partnerships",
            value: "4",
            sub: "2 pools maturing this month",
            subIcon: "event",
            subColor: "text-luxury-gold/60",
            bgIcon: "groups",
        },
    ];

    return {
        user: DEMO_USER,
        stats,
        circles: MOCK_CIRCLES,
        transactions: MOCK_TRANSACTIONS,
        auction: UPCOMING_AUCTION,
        liquidity: {
            label: "Current Liquidity Pool",
            amount: "$5,200.00",
            circleName: "Circle: Weekend Getaway",
            participants: "12 High-Net-Worth Participants",
        },
        portfolio: {
            maturity: 85,
        },
    };
}
