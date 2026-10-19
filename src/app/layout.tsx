import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-meta";
import "@/styles/document.css";
import "@/styles/hbw-home-prototype.css";
import "@/styles/hbw-rail.css";

const title = SITE_TITLE;
const description = SITE_DESCRIPTION;

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
    card: "summary_large_image",
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
    <html lang="en" className="hbw-workspace hbw-entered" suppressHydrationWarning>
      <head>
        {/*
          Medium first: the site is set in it, so it is the one face that holds
          up first paint. Regular follows for the pages still on the old shell.
          The subset Geist.woff2 this used to preload is no longer referenced by
          any @font-face — it was forty kilobytes fetched for nothing.
        */}
        <link rel="preload" href="/fonts/Geist-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Geist-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/*
          Nothing is hidden before first paint any more. The two scripts that
          used to sit here held the chrome and the frames back so an entrance
          and a turn could play over them; with no entrance and no turn, the
          page simply paints what it is.
        */}
      </head>
      <body className="body" suppressHydrationWarning>
        {/*
          No providers around the page.

          Two of them wrapped every route — one for the CMS preview, one for
          a motion session carried across route boundaries. Nothing read
          either: the preview routes have gone, and the motion store was
          reachable only from its own test. A context that nothing consumes
          is a render and a re-render on every navigation, for nobody.
        */}
        {children}
        {/*
          Page views, referrers, countries and devices, from the host the site
          already runs on. Cookieless, so it needs no consent banner — which is
          the reason to prefer it here over Google Analytics.
        */}
        <Analytics />
      </body>
    </html>
  );
}
