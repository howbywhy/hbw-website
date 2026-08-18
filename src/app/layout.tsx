import type { Metadata, Viewport } from "next";
import { HbwShell } from "@/components/home/HbwShell";
import "@/styles/document.css";
import "@/styles/hbw-home-prototype.css";

export const metadata: Metadata = {
  title: {
    default: "HBW — Clarity for brands at a turning point",
    template: "%s",
  },
  description:
    "HBW (How by why) is a Sydney-based brand and design practice led by Mark Blackler.",
  icons: {
    icon: "/identity/667c032fa556e88548bbe621_favicon-32x32.png",
    apple: "/identity/691abe1b2fa84bbebe7f3095_HBW-Brand-Partner.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="hbw-workspace" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/Geist.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script src="/runtime/hbw-workspace-boot.js" />
      </head>
      <body className="body" suppressHydrationWarning>
        <HbwShell>{children}</HbwShell>
      </body>
    </html>
  );
}
