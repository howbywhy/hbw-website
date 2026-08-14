import type { Metadata } from "next";
import Script from "next/script";
import { HbwRuntime } from "@/components/HbwRuntime";
import "@/styles/document.css";
import "@/styles/webflow.css";
import "@/styles/hbw-custom.css";
import "@/styles/hbw-evolution-01.css";

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

const ROUTE_BOOT = `
(function () {
  try {
    var p = (window.location && window.location.pathname) || '/';
    p = p.replace(/[?#].*$/, '').replace(/\\/+$/, '') || '/';
    var root = document.documentElement;
    root.classList.add('w-mod-js');
    if ('ontouchstart' in window) root.classList.add('w-mod-touch');
    if (p === '/') root.classList.add('hbw-route-home');
    if (p === '/projects' || p.indexOf('/projects/') === 0) root.classList.add('hbw-route-projects');
    root.classList.toggle('hbw-route-intake-start', p === '/intake/start');
    if (p === '/projects/sub-3') root.classList.add('hbw-route-sub3');
    if (p.indexOf('/projects/') === 0 && p !== '/projects' && p !== '/projects/sub-3') {
      root.classList.add('hbw-project-page-loading');
    }
    document.addEventListener('DOMContentLoaded', function () {
      if (p === '/') {
        var folder = document.querySelector('.folder-tab-container');
        if (folder) folder.classList.add('is-visible');
        var desc = document.querySelector('.hbw-description');
        if (desc) desc.classList.add('hbw-descfade-visible');
      }
    });
    window.addEventListener('load', function () {
      window.setTimeout(function () {
        if (!document.querySelector('script[src=\"/runtime/hbw-runtime.js\"]')) {
          var s = document.createElement('script');
          s.src = '/runtime/hbw-runtime.js';
          s.dataset.hbwRuntime = 'true';
          document.body.appendChild(s);
        }
        if (!document.querySelector('script[src=\"/runtime/hbw-evolution-01.js\"]')) {
          var evo = document.createElement('script');
          evo.src = '/runtime/hbw-evolution-01.js';
          evo.dataset.hbwEvolution = '01';
          document.body.appendChild(evo);
        }
      }, 50);
    });
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ROUTE_BOOT }} />
        <Script src="/runtime/hbw-runtime.js" strategy="beforeInteractive" />
        <Script src="/runtime/hbw-evolution-01.js" strategy="beforeInteractive" />
      </head>
      <body className="body" suppressHydrationWarning>
        {children}
        <HbwRuntime />
      </body>
    </html>
  );
}
