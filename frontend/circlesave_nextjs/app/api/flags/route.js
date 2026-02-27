import { NextResponse } from "next/server";
import { requireRole, requireAuth, AuthError } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * GET /api/flags — List flags
 *   Admin & moderator can see all flags
 *   Query: ?status=open&poolId=1&page=1&limit=20
 *
 * POST /api/flags — Raise a flag (moderator only)
 *   Body: { poolId, reason, severity? }
 */
export async function GET(request) {
  try {
    const session = await requireRole("admin", "moderator");

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const poolFilter = searchParams.get("poolId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params = [];
    let idx = 0;

    if (statusFilter) {
      params.push(statusFilter);
      idx++;
      where += ` AND f.status = $${idx}`;
    }
    if (poolFilter) {
      params.push(parseInt(poolFilter));
      idx++;
      where += ` AND f.pool_id = $${idx}`;
    }

    const countRes = await query(
      `SELECT COUNT(*) FROM flags f ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT f.*,
              rb.full_name as raised_by_name,
              rv.full_name as resolved_by_name
       FROM flags f
       JOIN users rb ON rb.id = f.raised_by
       LEFT JOIN users rv ON rv.id = f.resolved_by
       ${where}
       ORDER BY f.created_at DESC
       LIMIT $${idx + 1} OFFSET $${idx + 2}`,
      params
    );

    return NextResponse.json({
      flags: result.rows.map((r) => ({
        id: r.id,
        poolId: r.pool_id,
        reason: r.reason,
        severity: r.severity,
        status: r.status,
        raisedBy: r.raised_by,
        raisedByName: r.raised_by_name,
        resolvedBy: r.resolved_by,
        resolvedByName: r.resolved_by_name,
        resolvedAt: r.resolved_at,
        createdAt: r.created_at,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Flags GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await requireRole("moderator");
    const { poolId, reason, severity } = await request.json();

    if (!poolId || !reason) {
      return NextResponse.json(
        { error: "poolId and reason are required." },
        { status: 400 }
      );
    }

    const validSeverity = ["info", "warning", "critical"].includes(severity)
      ? severity
      : "warning";

    const result = await query(
      `INSERT INTO flags (raised_by, pool_id, reason, severity)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [session.userId, poolId, reason, validSeverity]
    );

    // Audit
    await query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, details)
       VALUES ($1, 'raise_flag', 'pool', $2, $3)`,
      [session.userId, poolId, JSON.stringify({ flagId: result.rows[0].id, reason, severity: validSeverity })]
    );

    return NextResponse.json({ success: true, flagId: result.rows[0].id });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Flags POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
