import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isAdmin, isOwner } from "@/lib/admin-auth";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { UsersPanel } from "@/components/admin/UsersPanel";

export const metadata: Metadata = {
  title: "Team",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function schemaSql() {
  try {
    return readFileSync(path.join(process.cwd(), "supabase/schema.sql"), "utf8");
  } catch {
    return "";
  }
}

export default async function AdminUsersPage() {
  if (!(await isAdmin())) {
    return <AdminLoginForm />;
  }
  if (!(await isOwner())) {
    return <AdminAccessDenied area="team management" />;
  }

  return <UsersPanel schemaSql={schemaSql()} />;
}
