"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Images" },
  { href: "/admin/paypal", label: "PayPal" },
  { href: "/admin/database", label: "Database" },
  { href: "/admin/orders", label: "Orders" },
];

export function AdminHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin";
  }

  return (
    <header className="mb-10 border-b border-white/10 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.22em] text-flagRed uppercase">
            Control panel
          </p>
          <h1 className="mt-1 font-display text-4xl text-white">{title}</h1>
          <p className="mt-2 max-w-xl text-sm text-steel">{description}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/shop"
            className="rounded border border-white/20 px-4 py-2 font-display text-xs tracking-[0.14em] text-white uppercase"
          >
            View shop
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded border border-white/20 px-4 py-2 font-display text-xs tracking-[0.14em] text-white uppercase"
          >
            Sign out
          </button>
        </div>
      </div>
      <nav className="mt-6 flex gap-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded px-4 py-2 font-display text-xs tracking-[0.14em] uppercase ${
                active
                  ? "bg-white text-ink"
                  : "border border-white/20 text-steel hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
