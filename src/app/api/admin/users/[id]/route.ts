import { NextResponse } from "next/server";
import { getAdminContext, unauthorizedUnlessOwner } from "@/lib/admin-auth";
import {
  countActiveOwners,
  deleteAdminUser,
  getAdminUserById,
  updateAdminUser,
  type AdminRole,
} from "@/lib/admin-users";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const denied = await unauthorizedUnlessOwner();
  if (denied) return denied;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        name?: string;
        role?: string;
        active?: boolean;
        password?: string;
      }
    | null;

  const role: AdminRole | undefined =
    body?.role === "owner" || body?.role === "editor" ? body.role : undefined;

  try {
    const existing = await getAdminUserById(id);
    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const removesOwner =
      existing.role === "owner" &&
      existing.active &&
      (body?.active === false || role === "editor");
    if (removesOwner && (await countActiveOwners(id)) < 1) {
      return NextResponse.json(
        { error: "Keep at least one active owner on the team." },
        { status: 400 },
      );
    }

    const user = await updateAdminUser(id, {
      name: body?.name,
      role,
      active: body?.active,
      password: body?.password,
    });
    return NextResponse.json({ user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await unauthorizedUnlessOwner();
  if (denied) return denied;

  const { id } = await params;
  const context = await getAdminContext();
  if (context?.user?.id === id) {
    return NextResponse.json(
      { error: "You cannot remove your own account while signed in." },
      { status: 400 },
    );
  }

  try {
    const existing = await getAdminUserById(id);
    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (
      existing.role === "owner" &&
      existing.active &&
      (await countActiveOwners(id)) < 1
    ) {
      return NextResponse.json(
        { error: "Keep at least one active owner on the team." },
        { status: 400 },
      );
    }
    await deleteAdminUser(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not delete user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
