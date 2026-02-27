import { NextResponse } from "next/server";
import { requireRole, AuthError, signToken, setAuthCookie } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * POST /api/admin/verify — Verify or reject a customer's KYC (admin + moderator)
 * Body: { userId, action: 'verify' | 'reject', reason? }
 */
export async function POST(request) {
  try {
    const session = await requireRole("admin", "moderator");
    const { userId, action, reason } = await request.json();

    if (!userId || !["verify", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "userId and action (verify/reject) are required." },
        { status: 400 }
      );
    }

    if (action === "reject" && !reason) {
      return NextResponse.json(
        { error: "A reason is required when rejecting KYC." },
        { status: 400 }
      );
    }

    // Check the target user exists and is a customer
    const userResult = await query(
      "SELECT id, role FROM users WHERE id = $1",
      [userId]
    );
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (userResult.rows[0].role !== "customer") {
      return NextResponse.json(
        { error: "Can only verify customers." },
        { status: 400 }
      );
    }

    // Check KYC is in submitted state
    const kycResult = await query(
      "SELECT id, status FROM kyc WHERE user_id = $1",
      [userId]
    );
    if (!kycResult.rows.length || kycResult.rows[0].status !== "submitted") {
      return NextResponse.json(
        { error: "KYC must be in 'submitted' state to review." },
        { status: 400 }
      );
    }

    if (action === "verify") {
      await query(
        `UPDATE kyc SET status = 'verified', reviewed_by = $1,
         verified_at = NOW(), updated_at = NOW()
         WHERE user_id = $2`,
        [session.userId, userId]
      );
      await query(
        "UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = $1",
        [userId]
      );
    } else {
      await query(
        `UPDATE kyc SET status = 'rejected', reviewed_by = $1,
         rejection_reason = $2, updated_at = NOW()
         WHERE user_id = $3`,
        [session.userId, reason, userId]
      );
      await query(
        "UPDATE users SET is_verified = FALSE, updated_at = NOW() WHERE id = $1",
        [userId]
      );
    }

    // Audit
    await query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, details)
       VALUES ($1, $2, 'user', $3, $4)`,
      [
        session.userId,
        action === "verify" ? "verify_customer" : "reject_customer",
        userId,
        JSON.stringify({ reason: reason || null }),
      ]
    );

    return NextResponse.json({ success: true, action, userId });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Verify error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
