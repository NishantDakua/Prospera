import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

/**
 * POST /api/avatar — Upload or update profile photo via Cloudinary.
 *
 * Accepts multipart/form-data with a single "file" field.
 * Stores the Cloudinary secure_url in users.avatar_url.
 */
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Validate type
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, and GIF are allowed." },
        { status: 400 }
      );
    }

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max 5 MB." },
        { status: 400 }
      );
    }

    // Convert to buffer → base64 data URI for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary with increased timeout
    const result = await cloudinary.uploader.upload(base64, {
      folder: "prospera/avatars",
      public_id: `user_${session.userId}`,
      overwrite: true,
      timeout: 30000,
      transformation: [
        { width: 256, height: 256, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    const avatarUrl = result.secure_url;

    // Save to DB
    await query(
      `UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2`,
      [avatarUrl, session.userId]
    );

    return NextResponse.json({ success: true, avatarUrl });
  } catch (e) {
    console.error("Avatar upload error:", e);
    const msg = e?.error?.message || e?.message || "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/avatar — Remove profile photo.
 */
export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove from Cloudinary
    try {
      await cloudinary.uploader.destroy(`prospera/avatars/user_${session.userId}`);
    } catch { /* ignore if not found */ }

    // Clear DB
    await query(
      `UPDATE users SET avatar_url = NULL, updated_at = NOW() WHERE id = $1`,
      [session.userId]
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Avatar delete error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
