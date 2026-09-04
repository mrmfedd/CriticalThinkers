import type { Metadata } from "next";
import { Oswald, IBM_Plex_Sans } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StorefrontChrome } from "@/components/StorefrontChrome";
import { getSiteSettings } from "@/lib/cms";
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

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: {
      default: `${settings.name} · ${settings.tagline}`,
      template: `%s · ${settings.name}`,
    },
    description: settings.metaDescription,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} font-body`}>
        <CartProvider>
          <StorefrontChrome
            header={
              <Header
                logoSrc={settings.logoUrl}
                name={settings.name}
                tagline={settings.tagline}
              />
            }
            footer={<Footer logoSrc={settings.logoUrl} site={settings} />}
          >
            {children}
          </StorefrontChrome>
        </CartProvider>
      </body>
    </html>
  );
}
