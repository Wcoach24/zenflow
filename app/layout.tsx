import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZenFlow — Sensory Experiences",
  description:
    "Interactive ASMR & relaxation web app. Touch, feel, and hear beautiful sensory experiences on your phone.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ZenFlow",
  },
  openGraph: {
    title: "ZenFlow",
    description: "Interactive sensory experiences for relaxation",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A1A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-[#0A0A1A] overflow-hidden">
        {children}
      </body>
    </html>
  );
}