import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * GET /api/kyc — Get KYC data for current user
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await query(
      `SELECT * FROM kyc WHERE user_id = $1`,
      [session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ kyc: null });
    }

    const row = result.rows[0];
    return NextResponse.json({
      kyc: {
        status: row.status,
        dateOfBirth: row.date_of_birth,
        gender: row.gender,
        addressLine: row.address_line,
        city: row.city,
        state: row.state,
        pincode: row.pincode,
        aadhaarNumber: row.aadhaar_number || null,
        panNumber: row.pan_number || null,
        bankName: row.bank_name,
        bankAccount: row.bank_account || null,
        ifscCode: row.ifsc_code,
        nomineeName: row.nominee_name,
        nomineeRelation: row.nominee_relation,
        submittedAt: row.submitted_at,
        verifiedAt: row.verified_at,
        rejectionReason: row.rejection_reason || null,
      },
    });
  } catch (e) {
    console.error("KYC GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/kyc — Submit KYC verification
 * Body: { dateOfBirth, gender, addressLine, city, state, pincode,
 *         aadhaarNumber, panNumber, bankName, bankAccount, ifscCode,
 *         nomineeName, nomineeRelation }
 */
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const required = [
      "dateOfBirth", "gender", "addressLine", "city", "state",
      "pincode", "aadhaarNumber", "panNumber",
    ];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required.` },
          { status: 400 }
        );
      }
    }

    // Validate Aadhaar (12 digits)
    const aadhaar = body.aadhaarNumber.replace(/\s/g, "");
    if (!/^\d{12}$/.test(aadhaar)) {
      return NextResponse.json(
        { error: "Aadhaar number must be exactly 12 digits." },
        { status: 400 }
      );
    }

    // Validate PAN (ABCDE1234F format)
    const pan = body.panNumber.toUpperCase();
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) {
      return NextResponse.json(
        { error: "PAN number must be in format ABCDE1234F." },
        { status: 400 }
      );
    }

    // Validate pincode (6 digits)
    if (!/^\d{6}$/.test(body.pincode)) {
      return NextResponse.json(
        { error: "Pincode must be exactly 6 digits." },
        { status: 400 }
      );
    }

    // Validate IFSC if provided
    if (body.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(body.ifscCode.toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid IFSC code format." },
        { status: 400 }
      );
    }

    // Upsert KYC
    await query(
      `UPDATE kyc SET
        date_of_birth = $1, gender = $2, address_line = $3, city = $4,
        state = $5, pincode = $6, aadhaar_number = $7, pan_number = $8,
        bank_name = $9, bank_account = $10, ifsc_code = $11,
        nominee_name = $12, nominee_relation = $13,
        status = 'submitted', submitted_at = NOW(), updated_at = NOW()
       WHERE user_id = $14`,
      [
        body.dateOfBirth,
        body.gender,
        body.addressLine,
        body.city,
        body.state,
        body.pincode,
        aadhaar,
        pan,
        body.bankName || null,
        body.bankAccount || null,
        body.ifscCode ? body.ifscCode.toUpperCase() : null,
        body.nomineeName || null,
        body.nomineeRelation || null,
        session.userId,
      ]
    );

    return NextResponse.json({ success: true, status: "submitted" });
  } catch (e) {
    console.error("KYC POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
