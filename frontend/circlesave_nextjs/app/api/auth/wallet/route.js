import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * POST /api/auth/wallet — Link a wallet address to the current account.
 *
 * Rules:
 *  - A wallet address can only be linked to ONE account (UNIQUE constraint).
 *  - One account can have MULTIPLE wallet addresses.
 *
 * Body: { walletAddress, label? }
 */
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { walletAddress, label } = await request.json();
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address." },
        { status: 400 }
      );
    }

    const normalized = walletAddress.toLowerCase();

    // Check: is this wallet already linked to a DIFFERENT account?
    const existing = await query(
      "SELECT user_id FROM user_wallets WHERE wallet_address = $1",
      [normalized]
    );

    if (existing.rows.length > 0) {
      if (existing.rows[0].user_id !== session.userId) {
        // Wallet belongs to someone else — hard reject
        return NextResponse.json(
          { error: "This wallet is already linked to another account.", code: "WALLET_TAKEN" },
          { status: 409 }
        );
      }
      // Already linked to THIS account — idempotent, just return success
      return NextResponse.json({ success: true, alreadyLinked: true });
    }

    // Insert new wallet for this user
    await query(
      `INSERT INTO user_wallets (user_id, wallet_address, label)
       VALUES ($1, $2, $3)`,
      [session.userId, normalized, label || null]
    );

    // Also keep the legacy wallet_address column in sync (first wallet = primary)
    await query(
      `UPDATE users SET wallet_address = COALESCE(wallet_address, $1), updated_at = NOW()
       WHERE id = $2`,
      [normalized, session.userId]
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Wallet link error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * GET /api/auth/wallet — Return all wallets linked to the current account.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await query(
      `SELECT wallet_address, label, linked_at
       FROM user_wallets
       WHERE user_id = $1
       ORDER BY linked_at ASC`,
      [session.userId]
    );

    return NextResponse.json({ wallets: result.rows });
  } catch (e) {
    console.error("Wallet fetch error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/wallet — Unlink a wallet from the current account.
 * Body: { walletAddress }
 */
export async function DELETE(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { walletAddress } = await request.json();
    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required." }, { status: 400 });
    }

    const normalized = walletAddress.toLowerCase();

    // Only let the owner unlink their own wallet
    const result = await query(
      "DELETE FROM user_wallets WHERE wallet_address = $1 AND user_id = $2 RETURNING id",
      [normalized, session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Wallet not found or not yours." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Wallet unlink error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
