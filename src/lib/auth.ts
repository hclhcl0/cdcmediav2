// src/lib/auth.ts — JWT session management via jose
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type SessionPayload = {
  userId: string;
  username: string;
  role: "ADMIN" | "UPLOADER" | "VIEWER";
  displayName?: string;
};

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.warn("⚠️ [SECURITY WARNING] JWT_SECRET is not configured in production! Please define JWT_SECRET in your .env file.");
}

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "cdc-danang-uploadss-jwt-secret-fallback-dev-only"
);

const COOKIE_NAME = "cdc_session";
const MAX_AGE = 60 * 60 * 24; // 24h

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decrypt(token);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await encrypt(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
