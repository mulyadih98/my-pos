import crypto from "node:crypto";
import * as jose from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "mypos_session";

const AUTH_SECRET = process.env.AUTH_SECRET || "mypos-super-secure-auth-secret-key-2026-min-32-chars";
const encodedKey = new TextEncoder().encode(AUTH_SECRET);

export interface UserSession {
  id: string;
  username: string;
  nama: string;
  role: "OWNER" | "KASIR";
  telepon?: string | null;
}

/**
 * Hash password menggunakan native scrypt dengan salt acak 16 byte
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifikasi password terhadap hash tersimpan
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;

    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);

    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Membuat JWT session token dengan masa berlaku 7 hari
 */
export async function createSessionToken(user: UserSession): Promise<string> {
  return await new jose.SignJWT({
    id: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role,
    telepon: user.telepon || null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

/**
 * Memverifikasi token session
 */
export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jose.jwtVerify(token, encodedKey);
    return {
      id: payload.id as string,
      username: payload.username as string,
      nama: payload.nama as string,
      role: payload.role as "OWNER" | "KASIR",
      telepon: (payload.telepon as string) || null,
    };
  } catch {
    return null;
  }
}

/**
 * Mendapatkan user yang sedang login saat ini dari HTTP-Only Cookie
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  return await verifySessionToken(sessionToken);
}

/**
 * Validasi otorisasi di level server action
 */
export async function requireRole(allowedRoles: ("OWNER" | "KASIR")[]): Promise<UserSession> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Anda tidak memiliki hak akses untuk melakukan tindakan ini.");
  }

  return user;
}
