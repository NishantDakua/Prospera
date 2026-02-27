import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * PATCH /api/flags/[id] — Resolve / dismiss a flag (admin only)
 * Body: { action: 'acknowledged' | 'resolved' | 'dismissed' }
 */
export async function PATCH(request, { params }) {
  try {
    const session = await requireRole("admin");
    const { id } = await params;
    const { action } = await request.json();

    if (!["acknowledged", "resolved", "dismissed"].includes(action)) {
      return NextResponse.json(
        { error: "action must be acknowledged, resolved, or dismissed." },
        { status: 400 }
      );
    }

    const existing = await query("SELECT id, status FROM flags WHERE id = $1", [id]);
    if (!existing.rows.length) {
      return NextResponse.json({ error: "Flag not found." }, { status: 404 });
    }

    await query(
      `UPDATE flags SET status = $1, resolved_by = $2,
       resolved_at = CASE WHEN $1 IN ('resolved','dismissed') THEN NOW() ELSE resolved_at END
       WHERE id = $3`,
      [action, session.userId, id]
    );

    // Audit
    await query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, details)
       VALUES ($1, $2, 'flag', $3, $4)`,
      [session.userId, `flag_${action}`, id, JSON.stringify({ flagId: parseInt(id) })]
    );

    return NextResponse.json({ success: true, flagId: parseInt(id), status: action });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Flag resolve error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
