import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { CmsPreviewProvider } from "@/components/home/CmsPreviewContext";
import { HbwMotionSessionProvider } from "@/components/home/HbwMotionSession";
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
          Arrival. Runs before first paint so the chrome starts hidden rather
          than flashing in and then fading. The class is dropped once the
          sequence has played, so nothing replays later in the session.

          It only ever hides things, so every failure mode is the site as it
          was: no class on reduced motion, no class if the script throws, and
          no class if scripting is off.

          1500ms covers the sequence in hbw-rail.css — the last beat starts at
          3 × ui + micro and runs for continuity, which is 1380ms.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{' +
              'if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;' +
              'var r=document.documentElement;r.setAttribute("data-hbw-arriving","");' +
              'setTimeout(function(){r.removeAttribute("data-hbw-arriving")},1500);' +
              '}catch(e){}})()',
          }}
        />
      </head>
      <body className="body" suppressHydrationWarning>
        <CmsPreviewProvider>
          <HbwMotionSessionProvider>{children}</HbwMotionSessionProvider>
        </CmsPreviewProvider>
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
