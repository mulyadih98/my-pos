"use server";

import { db } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  verifyPassword,
  getCurrentUser,
} from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export async function loginUser(payload: {
  username: string;
  password: string;
}) {
  const { username, password } = payload;

  if (!username || !password) {
    throw new Error("Username dan password wajib diisi.");
  }

  const cleanUsername = username.trim().toLowerCase();

  const user = await db.user.findUnique({
    where: { username: cleanUsername },
  });

  if (!user) {
    throw new Error("Username atau password salah.");
  }

  if (!user.isActive) {
    throw new Error("Akun ini telah dinonaktifkan oleh pemilik toko.");
  }

  const isValidPassword = verifyPassword(password, user.password);
  if (!isValidPassword) {
    throw new Error("Username atau password salah.");
  }

  const sessionToken = await createSessionToken({
    id: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role as "OWNER" | "KASIR",
    telepon: user.telepon,
  });

  const headerList = await headers();
  const proto = headerList.get("x-forwarded-proto");
  const referer = headerList.get("referer") || "";
  // Hanya aktifkan flag Secure jika request benar-benar berasal dari HTTPS (Cloudflare Tunnel, Vercel, Reverse Proxy SSL).
  // Pada koneksi HTTP lokal (http://localhost, 127.0.0.1, maupun IP LAN 192.168.x.x), secure harus false agar cookie tidak ditolak oleh browser.
  const isHttps = proto === "https" || referer.startsWith("https://");

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 hari
  });

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
    },
  };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

export async function getAuthUser() {
  return await getCurrentUser();
}
