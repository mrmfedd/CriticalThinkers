"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function StorefrontChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");

  return (
    <>
      {admin ? null : header}
      <main
        className={
          admin ? "min-h-screen" : "mx-auto min-h-[70vh] max-w-6xl px-4 py-10"
        }
      >
        {children}
      </main>
      {admin ? null : footer}
    </>
  );
}
