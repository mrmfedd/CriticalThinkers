import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin-auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { SupabaseConnectForm } from "@/components/admin/SupabaseConnectForm";
import { probeStore } from "@/lib/cart-store";
import { getSupabaseAdminView } from "@/lib/supabase";
import { readFileSync } from "node:fs";
import path from "node:path";

export const metadata: Metadata = {
  title: "Database",
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

export default async function AdminDatabasePage() {
  if (!(await isAdmin())) {
    return <AdminLoginForm />;
  }

  return (
    <SupabaseConnectForm
      initial={getSupabaseAdminView()}
      initialProbe={await probeStore()}
      schemaSql={schemaSql()}
    />
  );
}
