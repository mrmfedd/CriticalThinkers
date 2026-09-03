import { cookies } from "next/headers";

export const CART_COOKIE = "ct_cart";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function cartCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function getCartSessionId() {
  const jar = await cookies();
  const existing = jar.get(CART_COOKIE)?.value;
  if (existing && uuidPattern.test(existing)) return existing;
  return crypto.randomUUID();
}

export async function setCartSessionCookie(
  response: { cookies: { set: (name: string, value: string, options: ReturnType<typeof cartCookieOptions>) => void } },
  sessionId: string,
) {
  response.cookies.set(CART_COOKIE, sessionId, cartCookieOptions());
}
