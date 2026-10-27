const COOKIE = "ct_admin";
const PAYLOAD = "admin-session-v1";
const PAYLOAD_V2 = "admin-session-v2:";

function hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function signingSecret() {
  return (
    process.env.ADMIN_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "ThinkAgain2026"
  );
}

async function hmac(message: string) {
  const secret = signingSecret();
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

export async function createLegacySessionToken() {
  return hmac(PAYLOAD);
}

export async function createUserSessionToken(userId: string) {
  const signature = await hmac(`${PAYLOAD_V2}${userId}`);
  return `${userId}.${signature}`;
}

export type ParsedAdminToken =
  | { kind: "legacy" }
  | { kind: "user"; userId: string };

export async function parseAdminSessionToken(
  token: string | undefined,
): Promise<ParsedAdminToken | null> {
  if (!token) return null;

  const dot = token.indexOf(".");
  if (dot > 0) {
    const userId = token.slice(0, dot);
    const signature = token.slice(dot + 1);
    const expected = await hmac(`${PAYLOAD_V2}${userId}`);
    if ((await sha256(signature)) === (await sha256(expected))) {
      return { kind: "user", userId };
    }
    return null;
  }

  const expected = await createLegacySessionToken();
  if ((await sha256(token)) === (await sha256(expected))) {
    return { kind: "legacy" };
  }
  return null;
}

/** @deprecated Use parseAdminSessionToken */
export async function createSessionToken() {
  return createLegacySessionToken();
}

/** @deprecated Use parseAdminSessionToken */
export async function isValidSessionToken(token: string | undefined) {
  return (await parseAdminSessionToken(token)) !== null;
}

function normalizePassword(value: string) {
  return value.replace(/\s/g, "");
}

/** All valid admin passwords from ADMIN_PASSWORD and ADMIN_PASSWORDS (comma/newline/semicolon). */
export function configuredAdminPasswords(): string[] {
  const collected: string[] = [];

  const single = process.env.ADMIN_PASSWORD?.trim();
  if (single) collected.push(normalizePassword(single));

  const list = process.env.ADMIN_PASSWORDS?.trim();
  if (list) {
    for (const part of list.split(/[,;\n]+/)) {
      const trimmed = part.trim();
      if (trimmed) collected.push(normalizePassword(trimmed));
    }
  }

  if (collected.length === 0) {
    collected.push("ThinkAgain2026");
  }

  return [...new Set(collected)];
}

export async function passwordsMatch(input: string) {
  const attempt = normalizePassword(input);
  if (!attempt) return false;

  const attemptHash = await sha256(attempt);
  for (const password of configuredAdminPasswords()) {
    if ((await sha256(password)) === attemptHash) return true;
  }
  return false;
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
