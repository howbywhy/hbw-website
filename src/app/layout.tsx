import type { Metadata, Viewport } from "next";
import { HbwShell } from "@/components/home/HbwShell";
import "@/styles/document.css";
import "@/styles/hbw-home-prototype.css";

const title = "HBW — Clarity for brands at a turning point";
const description =
  "HBW (How by why) is a Sydney-based brand and design practice led by Mark Blackler.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hbw.works"),
  title: {
    default: title,
    template: "%s",
  },
  description,
  icons: {
    icon: "/identity/667c032fa556e88548bbe621_favicon-32x32.png",
    apple: "/identity/691abe1b2fa84bbebe7f3095_HBW-Brand-Partner.jpg",
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
  },
  twitter: {
    title,
    description,
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
