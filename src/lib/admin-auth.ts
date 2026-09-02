import { cookies } from "next/headers";
import {
  adminCookieName,
  isValidSessionToken,
} from "@/lib/admin-session";

export async function isAdmin() {
  const jar = await cookies();
  return isValidSessionToken(jar.get(adminCookieName())?.value);
}
