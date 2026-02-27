import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "prospera_fallback_secret"
);
const ALG = "HS256";
const COOKIE_NAME = "cs_token";
const EXPIRY = "7d";

/**
 * Create a signed JWT for a user.
 */
export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET);
}

/**
 * Verify a JWT string. Returns payload or null.
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Set the auth cookie (server-side, called from API routes).
 */
export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Remove the auth cookie.
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Read and verify the auth cookie. Returns user payload or null.
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/* ── Role guard helpers (for API routes) ────────────────────────────── */

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new AuthError("Unauthorized", 401);
  return session;
}

export async function requireRole(...roles) {
  const session = await requireAuth();
  if (!roles.includes(session.role)) throw new AuthError("Forbidden – insufficient privileges", 403);
  return session;
}

export class AuthError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.status = status;
  }
}
