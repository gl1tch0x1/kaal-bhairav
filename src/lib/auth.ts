import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not defined!");
  }
  return new TextEncoder().encode(secret);
}

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  const secret = getSecret();
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("osint_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSession(payload: JWTPayload): Promise<string> {
  const token = await signToken(payload);
  return token;
}
