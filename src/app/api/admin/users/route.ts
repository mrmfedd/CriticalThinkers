import { NextResponse } from "next/server";
import { unauthorizedUnlessOwner } from "@/lib/admin-auth";
import {
  createAdminUser,
  listAdminUsers,
  probeAdminUsers,
  type AdminRole,
} from "@/lib/admin-users";

export const runtime = "nodejs";

export async function GET() {
  const denied = await unauthorizedUnlessOwner();
  if (denied) return denied;

  const probe = await probeAdminUsers();
  if (!probe.ok) {
    return NextResponse.json({ users: [], probe });
  }

  try {
    const users = await listAdminUsers();
    return NextResponse.json({ users, probe });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load team members.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await unauthorizedUnlessOwner();
  if (denied) return denied;

  const probe = await probeAdminUsers();
  if (!probe.ok) {
    return NextResponse.json(
      { error: probe.error || "Admin users table is not ready." },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        email?: string;
        name?: string;
        password?: string;
        role?: string;
      }
    | null;

  const role: AdminRole = body?.role === "owner" ? "owner" : "editor";

  try {
    const user = await createAdminUser({
      email: body?.email || "",
      name: body?.name || "",
      password: body?.password || "",
      role,
    });
    return NextResponse.json({ user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
