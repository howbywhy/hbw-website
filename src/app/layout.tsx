import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { CmsPreviewProvider } from "@/components/home/CmsPreviewContext";
import { HbwMotionSessionProvider } from "@/components/home/HbwMotionSession";
import "@/styles/document.css";
import "@/styles/hbw-home-prototype.css";
import "@/styles/hbw-rail.css";

const title = "HBW — Clarity for brands at a turning point";
const description =
  "HBW (How by Why) is an independent brand and design practice led by Mark Blackler, based in the Blue Mountains and working with founders across Sydney and Australia. Brand strategy, identity and design.";

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
        <link rel="preload" href="/fonts/Geist.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
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
