import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(name) {
  try {
    const text = readFileSync(path.join(root, name), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index <= 0) continue;
      const key = trimmed.slice(0, index);
      const value = trimmed.slice(index + 1);
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const connectionString =
  process.env.DATABASE_URL?.trim() || process.env.SUPABASE_DB_URL?.trim();

if (!connectionString) {
  console.error(
    "Missing DATABASE_URL. In Supabase: Project Settings → Database → Connection string (URI), then add to .env.local:\nDATABASE_URL=postgresql://...",
  );
  process.exit(1);
}

const sql = readFileSync(path.join(root, "supabase", "schema.sql"), "utf8");
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Schema applied successfully.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end();
}
