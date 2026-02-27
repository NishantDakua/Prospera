import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * GET /api/admin/audit — Get audit log (admin only)
 * Query: ?page=1&limit=50
 */
export async function GET(request) {
  try {
    await requireRole("admin");

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const offset = (page - 1) * limit;

    const countResult = await query("SELECT COUNT(*) FROM audit_log");
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT a.*, u.full_name as actor_name, u.email as actor_email
       FROM audit_log a
       JOIN users u ON u.id = a.actor_id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return NextResponse.json({
      logs: result.rows.map((r) => ({
        id: r.id,
        actorId: r.actor_id,
        actorName: r.actor_name,
        actorEmail: r.actor_email,
        action: r.action,
        targetType: r.target_type,
        targetId: r.target_id,
        details: r.details,
        createdAt: r.created_at,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Audit log error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
