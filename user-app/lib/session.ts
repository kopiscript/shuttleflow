import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.ADMIN_SESSION_SECRET || "fallback-secret-change-me-min-32-chars"
);

const COOKIE_NAME = "admin_session";
const SESSION_DURATION_SHORT = 60 * 60 * 24; // 1 day
const SESSION_DURATION_LONG = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  adminId: number;
  username: string;
  email: string;
}

// Create a signed session token and set it as a cookie
export async function createSession(
  payload: SessionPayload,
  rememberMe: boolean = false
) {
  const duration = rememberMe ? SESSION_DURATION_LONG : SESSION_DURATION_SHORT;

  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${duration}s`)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: duration,
    path: "/",
  });

  return token;
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;
  return verifySession(token);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME };