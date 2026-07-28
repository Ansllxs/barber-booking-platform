import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { BUSINESS } from "@/lib/constants";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#050505",
};
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BUSINESS.name} | Barbería Premium`,
    template: `%s | ${BUSINESS.name}`,
  },
  description:
    "Reserva tu cita en COELI BARBER CLUB. Barbería premium en Costa Rica. Cortes, barba, paquetes y rituales exclusivos.",
  icons: {
    icon: "/brand/logo.png",
    apple: "/brand/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "es_CR",
    siteName: BUSINESS.name,
    title: `${BUSINESS.name} | Barbería Premium`,
    description:
      "Experiencia de barbería premium. Reserva en línea sin llamadas ni WhatsApp.",
    images: [{ url: "/brand/logo.png", width: 512, height: 512, alt: BUSINESS.name }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${sans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
