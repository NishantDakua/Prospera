import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * GET /api/admin/kyc/[userId] — Get full unmasked KYC for review (admin + moderator)
 */
export async function GET(_request, { params }) {
  try {
    const session = await requireRole("admin", "moderator");
    const { userId } = await params;

    const result = await query(
      `SELECT k.*, u.email, u.full_name, u.phone, u.wallet_address, u.role, u.is_verified
       FROM kyc k
       JOIN users u ON u.id = k.user_id
       WHERE k.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "KYC not found." }, { status: 404 });
    }

    const r = result.rows[0];
    return NextResponse.json({
      kyc: {
        userId: r.user_id,
        email: r.email,
        fullName: r.full_name,
        phone: r.phone,
        walletAddress: r.wallet_address,
        role: r.role,
        isVerified: r.is_verified,
        status: r.status,
        dateOfBirth: r.date_of_birth,
        gender: r.gender,
        addressLine: r.address_line,
        city: r.city,
        state: r.state,
        pincode: r.pincode,
        aadhaarNumber: r.aadhaar_number,
        panNumber: r.pan_number,
        bankName: r.bank_name,
        bankAccount: r.bank_account,
        ifscCode: r.ifsc_code,
        nomineeName: r.nominee_name,
        nomineeRelation: r.nominee_relation,
        submittedAt: r.submitted_at,
        verifiedAt: r.verified_at,
        rejectionReason: r.rejection_reason,
        reviewedBy: r.reviewed_by,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Admin KYC detail error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
