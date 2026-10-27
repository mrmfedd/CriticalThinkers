import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import {
  hashAdminPassword,
  verifyAdminPassword,
} from "@/lib/admin-password";

export type AdminRole = "owner" | "editor";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
};

type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  password_hash: string;
  created_at: string;
};

function isMissingTable(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const message = error.message || "";
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /relation.*does not exist/i.test(message)
  );
}

function rowToUser(row: Omit<AdminUserRow, "password_hash">): AdminUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    active: row.active,
    createdAt: row.created_at,
  };
}

export async function probeAdminUsers() {
  if (!supabaseConfigured()) {
    return { ok: false, error: "Connect Supabase in Admin → Database first." };
  }
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: "Supabase is not connected." };
  }
  const result = await supabase.from("admin_users").select("id").limit(1);
  if (!result.error) return { ok: true };
  if (isMissingTable(result.error)) {
    return {
      ok: false,
      needsSchema: true,
      error: "Run the updated supabase/schema.sql to create admin_users.",
    };
  }
  return { ok: false, error: result.error.message };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const result = await supabase
    .from("admin_users")
    .select("id, email, name, role, active, created_at")
    .order("created_at", { ascending: true });
  if (result.error) {
    if (isMissingTable(result.error)) return [];
    throw new Error(result.error.message);
  }
  return (result.data ?? []).map((row) => rowToUser(row as AdminUserRow));
}

export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const result = await supabase
    .from("admin_users")
    .select("id, email, name, role, active, created_at")
    .eq("id", id)
    .maybeSingle();
  if (result.error) {
    if (isMissingTable(result.error)) return null;
    throw new Error(result.error.message);
  }
  return result.data ? rowToUser(result.data as AdminUserRow) : null;
}

export async function getAdminUserByEmail(email: string) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const normalized = email.trim().toLowerCase();
  const result = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", normalized)
    .maybeSingle();
  if (result.error) {
    if (isMissingTable(result.error)) return null;
    throw new Error(result.error.message);
  }
  return (result.data as AdminUserRow | null) ?? null;
}

export async function verifyAdminUserLogin(email: string, password: string) {
  const row = await getAdminUserByEmail(email);
  if (!row || !row.active) return null;
  const ok = await verifyAdminPassword(password, row.password_hash);
  if (!ok) return null;
  return rowToUser(row);
}

export async function createAdminUser(input: {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not connected.");

  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const password = input.password;
  if (!email.includes("@")) throw new Error("Enter a valid email.");
  if (!name) throw new Error("Name is required.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");

  const password_hash = await hashAdminPassword(password);
  const result = await supabase
    .from("admin_users")
    .insert({
      email,
      name,
      role: input.role,
      active: true,
      password_hash,
    })
    .select("id, email, name, role, active, created_at")
    .single();

  if (result.error) {
    if (/duplicate|unique/i.test(result.error.message)) {
      throw new Error("That email is already on the team.");
    }
    throw new Error(result.error.message);
  }
  return rowToUser(result.data as AdminUserRow);
}

export async function updateAdminUser(
  id: string,
  patch: {
    name?: string;
    role?: AdminRole;
    active?: boolean;
    password?: string;
  },
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not connected.");

  const body: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) throw new Error("Name is required.");
    body.name = name;
  }
  if (patch.role !== undefined) body.role = patch.role;
  if (patch.active !== undefined) body.active = patch.active;
  if (patch.password !== undefined) {
    if (patch.password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    body.password_hash = await hashAdminPassword(patch.password);
  }

  if (Object.keys(body).length === 0) {
    const existing = await getAdminUserById(id);
    if (!existing) throw new Error("User not found.");
    return existing;
  }

  const result = await supabase
    .from("admin_users")
    .update(body)
    .eq("id", id)
    .select("id, email, name, role, active, created_at")
    .single();

  if (result.error) throw new Error(result.error.message);
  return rowToUser(result.data as AdminUserRow);
}

export async function deleteAdminUser(id: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not connected.");
  const result = await supabase.from("admin_users").delete().eq("id", id);
  if (result.error) throw new Error(result.error.message);
}

export async function countActiveOwners(excludeId?: string) {
  const users = await listAdminUsers();
  return users.filter(
    (user) => user.role === "owner" && user.active && user.id !== excludeId,
  ).length;
}
