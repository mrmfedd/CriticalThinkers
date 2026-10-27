import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  adminCookieName,
  parseAdminSessionToken,
} from "@/lib/admin-session";
import { getAdminUserById, type AdminRole, type AdminUser } from "@/lib/admin-users";

export type AdminCapability = "cms" | "orders" | "integrations" | "users";

export type AdminContext = {
  role: AdminRole | "legacy";
  user: AdminUser | null;
  label: string;
};

function capabilitiesForRole(role: AdminContext["role"]): AdminCapability[] {
  if (role === "legacy" || role === "owner") {
    return ["cms", "orders", "integrations", "users"];
  }
  return ["cms", "orders"];
}

export async function getAdminContext(): Promise<AdminContext | null> {
  const jar = await cookies();
  const parsed = await parseAdminSessionToken(jar.get(adminCookieName())?.value);
  if (!parsed) return null;

  if (parsed.kind === "legacy") {
    return { role: "legacy", user: null, label: "Master admin" };
  }

  const user = await getAdminUserById(parsed.userId);
  if (!user || !user.active) return null;
  return {
    role: user.role,
    user,
    label: user.name || user.email,
  };
}

export async function isAdmin() {
  return (await getAdminContext()) !== null;
}

export async function isOwner() {
  const context = await getAdminContext();
  if (!context) return false;
  return context.role === "legacy" || context.role === "owner";
}

export function hasCapability(
  context: AdminContext,
  capability: AdminCapability,
) {
  return capabilitiesForRole(context.role).includes(capability);
}

export async function unauthorizedUnlessAdmin(
  capability: AdminCapability = "cms",
) {
  const context = await getAdminContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasCapability(context, capability)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function unauthorizedUnlessOwner() {
  return unauthorizedUnlessAdmin("users");
}
