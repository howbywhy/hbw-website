import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { OG_SITE, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-meta";
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
  /*
   * Icons big enough to be used, drawn from the mark itself.
   *
   * This was a 32px favicon and, for the home screen, a 256px JPEG named
   * HBW-Brand-Partner — a photograph-format file standing in for a logo, at a
   * size iOS has to resample, with no 192 or 512 for Android or a browser
   * wanting a larger one. The mark is a vector and always was: these are
   * rendered from public/identity/hbw-mark.svg onto the site's own paper, so
   * the icon and the logotype on the page are the same drawing.
   */
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  manifest: "/manifest.webmanifest",
  /*
   * siteName and locale, which every preview was going out without.
   *
   * og:title, description, image and url were all being set; what was missing
   * is the part that says whose page this is and what language it is in — so
   * a link shared anywhere showed the title and the picture with no studio
   * name above them, on every one of the nine pages.
   */
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
    ...OG_SITE,
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

          A third sat here briefly, reading ?nav=top so the top row and the
          middle line could be put side by side on the real site. The top row
          won and is simply the nav now, so the flag that chose it is gone
          too — a flag kept past its decision is a second way for the site to
          behave that nobody is testing.
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
