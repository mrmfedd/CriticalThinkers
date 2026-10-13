"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import type { PublicSite } from "@/lib/cms";

export function StorefrontChrome({
  header,
  logoSrc,
  site,
  children,
}: {
  header: ReactNode;
  logoSrc: string;
  site: PublicSite;
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
      {admin ? null : <Footer logoSrc={logoSrc} site={site} />}
    </>
  );
}
