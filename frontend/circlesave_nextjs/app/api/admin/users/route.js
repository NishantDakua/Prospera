import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * GET /api/admin/users — List all users (admin only)
 * Query params: ?role=customer&kycStatus=submitted&page=1&limit=20
 */
export async function GET(request) {
  try {
    const session = await requireRole("admin");

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role");
    const kycFilter = searchParams.get("kycStatus");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params = [];
    let paramIdx = 0;

    if (roleFilter) {
      params.push(roleFilter);
      paramIdx++;
      where += ` AND u.role = $${paramIdx}`;
    }
    if (kycFilter) {
      params.push(kycFilter);
      paramIdx++;
      where += ` AND k.status = $${paramIdx}`;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM users u LEFT JOIN kyc k ON k.user_id = u.id ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.wallet_address,
              u.role, u.is_verified, u.created_at,
              k.status as kyc_status, k.submitted_at, k.verified_at
       FROM users u
       LEFT JOIN kyc k ON k.user_id = u.id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${paramIdx + 1} OFFSET $${paramIdx + 2}`,
      params
    );

    return NextResponse.json({
      users: result.rows.map((r) => ({
        id: r.id,
        email: r.email,
        fullName: r.full_name,
        phone: r.phone,
        walletAddress: r.wallet_address,
        role: r.role,
        isVerified: r.is_verified,
        kycStatus: r.kyc_status || "pending",
        createdAt: r.created_at,
        submittedAt: r.submitted_at,
        verifiedAt: r.verified_at,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Admin users error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
