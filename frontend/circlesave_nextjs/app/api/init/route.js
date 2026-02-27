import { NextResponse } from "next/server";
import { initDB } from "@/lib/db";

/**
 * POST /api/init — Initialize database tables.
 * Call this once after setting up your Neon DB connection string.
 */
export async function POST() {
  try {
    await initDB();
    return NextResponse.json({ success: true, message: "Tables initialized" });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
