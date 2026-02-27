import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "prospera_fallback_secret"
);
const COOKIE_NAME = "cs_token";

/* ── Route configuration ────────────────────────────────────────────── */

const PUBLIC_ROUTES = [
  "/", "/login", "/signup",
  "/api/auth/login", "/api/auth/signup", "/api/auth/logout", "/api/init",
];

// Routes restricted to admin only (includes pool creation)
const ADMIN_ROUTES = ["/admin", "/api/admin", "/create"];

// Routes restricted to admin + moderator
const STAFF_ROUTES = ["/moderator", "/api/flags"];

// Routes that require the customer to be verified (KYC approved by admin/mod)
const VERIFIED_CUSTOMER_ROUTES = ["/dashboard", "/circle", "/profile"];

function matchesAny(pathname, routes) {
  return routes.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function isPublic(pathname) {
  return matchesAny(pathname, PUBLIC_ROUTES);
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/video") ||
    pathname.includes(".")
  );
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow static assets and public routes
  if (isStaticAsset(pathname) || isPublic(pathname)) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token & extract role
  let payload;
  try {
    const result = await jwtVerify(token, SECRET);
    payload = result.payload;
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  const role = payload.role || "customer";
  const isVerified = !!payload.isVerified;

  /* ── Role-based route guards ──────────────────────────────────────── */

  // Admin-only routes
  if (matchesAny(pathname, ADMIN_ROUTES)) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Staff routes (admin + moderator)
  if (matchesAny(pathname, STAFF_ROUTES)) {
    if (role !== "admin" && role !== "moderator") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Verified-only customer routes
  // Admin & moderator always have access; customers must be verified
  if (matchesAny(pathname, VERIFIED_CUSTOMER_ROUTES)) {
    if (role === "customer" && !isVerified) {
      // If they haven't submitted KYC, send to /verify
      // If they have but aren't verified yet, send to /pending
      return NextResponse.redirect(new URL("/pending", request.url));
    }
    return NextResponse.next();
  }

  // /verify and /pending are accessible to all authenticated users
  // /api/* routes not caught above are open to all authenticated users
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
