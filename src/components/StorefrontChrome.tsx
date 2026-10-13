"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import type { PublicSite } from "@/lib/cms";

export function StorefrontChrome({
  header,
  homeBottom,
  logoSrc,
  site,
  children,
}: {
  header: ReactNode;
  homeBottom?: ReactNode;
  logoSrc: string;
  site: PublicSite;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  const home = pathname === "/";

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
      {!admin && home && homeBottom ? homeBottom : null}
      {admin ? null : (
        <Footer logoSrc={logoSrc} site={site} className={home ? "mt-0" : "mt-16"} />
      )}
    </>
  );
}
