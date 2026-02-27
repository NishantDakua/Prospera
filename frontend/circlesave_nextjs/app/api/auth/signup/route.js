import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";

/**
 * POST /api/auth/signup
 * Body: { email, password, fullName, phone }
 */
export async function POST(request) {
  try {
    const { email, password, fullName, phone } = await request.json();

    // Validation
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

    // Check existing
    const existing = await query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password & insert
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, is_verified)
       VALUES ($1, $2, $3, $4, 'customer', FALSE)
       RETURNING id, email, full_name, role, is_verified`,
      [email.toLowerCase(), hash, fullName, phone || null]
    );

    const user = result.rows[0];

    // Create empty KYC row
    await query("INSERT INTO kyc (user_id) VALUES ($1)", [user.id]);

    // Sign token & set cookie (include role)
    const token = await signToken({
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      isVerified: user.is_verified,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, isVerified: false },
    });
  } catch (e) {
    console.error("Signup error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
