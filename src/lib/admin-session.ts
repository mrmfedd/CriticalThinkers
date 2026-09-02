const COOKIE = "ct_admin";
const PAYLOAD = "admin-session-v1";

function hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(message: string) {
  const secret = process.env.ADMIN_SECRET || "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return hex(signature);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return hex(digest);
}

export function adminCookieName() {
  return COOKIE;
}

export async function createSessionToken() {
  return hmac(PAYLOAD);
}

export async function isValidSessionToken(token: string | undefined) {
  if (!token || !process.env.ADMIN_SECRET) return false;
  const expected = await createSessionToken();
  return (await sha256(token)) === (await sha256(expected));
}

export async function passwordsMatch(input: string) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || !input) return false;
  return (await sha256(input)) === (await sha256(expected));
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  };
}
