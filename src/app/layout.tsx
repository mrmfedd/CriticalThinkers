import type { Metadata } from "next";
import { Oswald, IBM_Plex_Sans } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StorefrontChrome } from "@/components/StorefrontChrome";
import { getBrandImages } from "@/lib/image-store";
import { site } from "@/lib/site";
import "./globals.css";

const display = Oswald({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description:
    "Make America Think Again. T-shirts and gear from CriticalThinkers.us.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = getBrandImages();

  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} font-body`}>
        <CartProvider>
          <StorefrontChrome
            header={<Header logoSrc={brand.logo} />}
            footer={<Footer logoSrc={brand.logo} />}
          >
            {children}
          </StorefrontChrome>
        </CartProvider>
      </body>
    </html>
  );
}
