import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireRole, AuthError } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * POST /api/admin/moderator — Create a moderator (admin only)
 * Body: { email, password, fullName, phone }
 */
export async function POST(request) {
  try {
    const session = await requireRole("admin");
    const { email, password, fullName, phone } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, is_verified)
       VALUES ($1, $2, $3, $4, 'moderator', TRUE)
       RETURNING id, email, full_name, role`,
      [email.toLowerCase(), hash, fullName, phone || null]
    );

    const mod = result.rows[0];

    // No KYC needed for moderators but create row for consistency
    await query("INSERT INTO kyc (user_id, status) VALUES ($1, 'verified')", [mod.id]);

    // Audit
    await query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, details)
       VALUES ($1, 'create_moderator', 'user', $2, $3)`,
      [session.userId, mod.id, JSON.stringify({ email: mod.email, fullName: mod.full_name })]
    );

    return NextResponse.json({
      success: true,
      moderator: { id: mod.id, email: mod.email, fullName: mod.full_name, role: "moderator" },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Create moderator error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
