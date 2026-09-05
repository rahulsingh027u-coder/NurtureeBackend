import { SignJWT, jwtVerify } from "jose";

const secretString = process.env.NEXTAUTH_SECRET || "";
const secret = new TextEncoder().encode(secretString);

const portalSecret = new TextEncoder().encode(
  process.env.SIGNAL_JWT_SECRET ?? ""
);

export async function createToken(payload: Record<string, unknown>) {
  if (!secretString) throw new Error("NEXTAUTH_SECRET is not set");
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyToken(token: string) {
  if (!secretString) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function verifyPortalToken(token: string) {
  if (!portalSecret.length) return null;
  try {
    const { payload } = await jwtVerify(token, portalSecret, {
      algorithms: ["HS256"],
      issuer: "nurturee",
    });
    return payload as { id: string; role: string };
  } catch {
    return null;
  }
}
