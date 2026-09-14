import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

const SESSION_COOKIE_NAME = "mypos_session";
const AUTH_SECRET = process.env.AUTH_SECRET || "mypos-super-secure-auth-secret-key-2026-min-32-chars";
const encodedKey = new TextEncoder().encode(AUTH_SECRET);

// Rute yang HANYA boleh diakses oleh OWNER
const OWNER_ONLY_PREFIXES = [
  "/dashboard/laba-rugi",
  "/dashboard/operasional",
  "/dashboard/pengaturan",
  "/dashboard/user",
  "/dashboard/pembelian",
  "/dashboard/stok-opname",
];

async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jose.jwtVerify(token, encodedKey);
    return {
      id: payload.id as string,
      username: payload.username as string,
      nama: payload.nama as string,
      role: payload.role as "OWNER" | "KASIR",
    };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lewati file statis, next chunks, api internal, dan favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(req);

  // 1. Jika membuka /login saat SUDAH login -> redirect ke dashboard / kasir
  if (pathname === "/login") {
    if (session) {
      const target = session.role === "KASIR" ? "/dashboard/transaksi" : "/dashboard";
      return NextResponse.redirect(new URL(target, req.url));
    }
    return NextResponse.next();
  }

  // 2. Jika membuka root "/" -> redirect ke dashboard / login
  if (pathname === "/") {
    if (session) {
      const target = session.role === "KASIR" ? "/dashboard/transaksi" : "/dashboard";
      return NextResponse.redirect(new URL(target, req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3. Proteksi semua rute /dashboard/*
  if (pathname.startsWith("/dashboard")) {
    // Belum login -> redirect ke /login
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role check untuk rute khusus OWNER
    const isOwnerRoute = OWNER_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (isOwnerRoute && session.role !== "OWNER") {
      // Kasir mencoba membuka rute Owner -> arahkan ke halaman Transaksi Kasir
      return NextResponse.redirect(new URL("/dashboard/transaksi", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
