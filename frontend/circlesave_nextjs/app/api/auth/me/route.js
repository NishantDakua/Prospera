import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * GET /api/auth/me — Get current user + KYC status
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.wallet_address,
              u.role, u.is_verified, u.avatar_url, k.status as kyc_status
       FROM users u
       LEFT JOIN kyc k ON k.user_id = u.id
       WHERE u.id = $1`,
      [session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      user: {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        phone: row.phone,
        walletAddress: row.wallet_address,
        avatarUrl: row.avatar_url || null,
        kycStatus: row.kyc_status || "pending",
        role: row.role || "customer",
        isVerified: row.is_verified ?? false,
      },
    });
  } catch (e) {
    console.error("Auth/me error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
