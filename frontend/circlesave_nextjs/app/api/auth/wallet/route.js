import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { JsonRpcProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from "@/lib/contract";

/**
 * Check if a wallet is a member of any active on-chain group.
 * Returns array of group IDs the wallet participates in.
 */
async function getWalletGroups(walletAddress) {
  try {
    const provider = new JsonRpcProvider(RPC_URL);
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const count = Number(await contract.groupCount());
    const inGroups = [];
    for (let i = 1; i <= count; i++) {
      const members = await contract.getGroupMembers(i);
      const lower = walletAddress.toLowerCase();
      if (members.some((m) => m.toLowerCase() === lower)) {
        const info = await contract.getGroupInfo(i);
        if (info[5]) inGroups.push(i); // info[5] = isActive
      }
    }
    return inGroups;
  } catch {
    return [];
  }
}

/**
 * POST /api/auth/wallet — Link a wallet address to the current account.
 *
 * Rules:
 *  - A wallet address can only be linked to ONE account (UNIQUE constraint).
 *  - One account can have MULTIPLE wallet addresses.
 *  - First wallet linked becomes the PRIMARY wallet.
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
        return NextResponse.json(
          { error: "This wallet is already linked to another account.", code: "WALLET_TAKEN" },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: true, alreadyLinked: true });
    }

    // Check if user already has wallets — first one becomes primary
    const existingWallets = await query(
      "SELECT id FROM user_wallets WHERE user_id = $1",
      [session.userId]
    );
    const isPrimary = existingWallets.rows.length === 0;

    await query(
      `INSERT INTO user_wallets (user_id, wallet_address, label, is_primary)
       VALUES ($1, $2, $3, $4)`,
      [session.userId, normalized, label || null, isPrimary]
    );

    // Keep legacy column in sync
    await query(
      `UPDATE users SET wallet_address = COALESCE(wallet_address, $1), updated_at = NOW()
       WHERE id = $2`,
      [normalized, session.userId]
    );

    return NextResponse.json({ success: true, isPrimary });
  } catch (e) {
    console.error("Wallet link error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * GET /api/auth/wallet — Return all wallets linked to the current account,
 * with is_primary flag and in_pool group IDs.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await query(
      `SELECT wallet_address, label, is_primary, linked_at
       FROM user_wallets
       WHERE user_id = $1
       ORDER BY is_primary DESC, linked_at ASC`,
      [session.userId]
    );

    // Check on-chain pool membership for each wallet
    const wallets = await Promise.all(
      result.rows.map(async (w) => {
        const inGroups = await getWalletGroups(w.wallet_address);
        return { ...w, in_groups: inGroups };
      })
    );

    return NextResponse.json({ wallets });
  } catch (e) {
    console.error("Wallet fetch error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/wallet — Unlink a wallet from the current account.
 *
 * Rules:
 *  - Primary wallet CANNOT be deleted.
 *  - Wallet in an active pool CANNOT be deleted.
 *
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

    // Check ownership + primary status
    const wallet = await query(
      "SELECT id, is_primary FROM user_wallets WHERE wallet_address = $1 AND user_id = $2",
      [normalized, session.userId]
    );

    if (wallet.rows.length === 0) {
      return NextResponse.json(
        { error: "Wallet not found or not yours." },
        { status: 404 }
      );
    }

    if (wallet.rows[0].is_primary) {
      return NextResponse.json(
        { error: "Primary wallet cannot be removed.", code: "IS_PRIMARY" },
        { status: 403 }
      );
    }

    // Check on-chain: is wallet in any active pool?
    const inGroups = await getWalletGroups(normalized);
    if (inGroups.length > 0) {
      return NextResponse.json(
        {
          error: `This wallet is active in Circle${inGroups.length > 1 ? "s" : ""} #${inGroups.join(", #")}. Remove it from the pool first.`,
          code: "IN_POOL",
          groups: inGroups,
        },
        { status: 403 }
      );
    }

    await query(
      "DELETE FROM user_wallets WHERE wallet_address = $1 AND user_id = $2",
      [normalized, session.userId]
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Wallet unlink error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
