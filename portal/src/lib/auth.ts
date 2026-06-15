// Stateless signed-cookie auth. Uses the Web Crypto API so the same helpers run
// in both the Edge middleware and Node server actions.

export const SESSION_COOKIE = "zig-beacon-session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.CREDENTIALS_SECRET ||
    process.env.DATABASE_URL ||
    "zig-beacon-dev-fallback"
  );
}

const encoder = new TextEncoder();

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export async function createSessionToken(user: string): Promise<string> {
  const payload = btoa(JSON.stringify({ u: user, exp: Date.now() + SESSION_TTL_MS }));
  const sigBuf = await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(payload));
  return `${payload}.${toBase64(new Uint8Array(sigBuf))}`;
}

export async function verifySessionToken(token?: string | null): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;

  let sigBytes: Uint8Array;
  try {
    sigBytes = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));
  } catch {
    return false;
  }

  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(),
    sigBytes as unknown as BufferSource,
    encoder.encode(payload)
  );
  if (!valid) return false;

  try {
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

/** Shared portal credentials. Defaults work for local dev; set real ones in env. */
export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.PORTAL_USERNAME || "admin";
  const p = process.env.PORTAL_PASSWORD || "beacon";
  return username === u && password === p;
}
