import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "./Providers";
import LegacyPublicStorageCleanup from "@/components/security/LegacyPublicStorageCleanup";
import { getRequestLocale } from '@/capabilities/content/publicContent.server';

export const metadata: Metadata = {
  title: "STANN LUMO",
  description: "TECHNO / SEOUL",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    // Listing `icon` here replaces the file-based icon tags, so the iOS home-screen icon must be named too.
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

// One viewport tag: a hand-written <meta name="viewport"> would sit beside Next's default one.
// themeColor keeps the iOS status bar and safe areas black (globals.css :root --color-bg).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const initialLanguage = await getRequestLocale();
  return (
    <html lang={initialLanguage} suppressHydrationWarning>
      <head>
        {/* Marks a running script before the bundle arrives, so the reveal gate's CSS failsafe can wait for hydration
            instead of showing image placeholders on slow connections (PublicSiteShell.module.css). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.dataset.js=''" }} />
        {/* One font request discovered with the document, instead of CSS @imports found only after the app stylesheet loads.
            Noto Sans KR is the variable font in unicode-range slices: a page downloads only the slices its Korean text uses. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* The pages-router rule does not see that the App Router root layout already covers every route. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+KR:wght@400..900&display=swap"
        />
      </head>
      <body>
        <LegacyPublicStorageCleanup />
        <Providers initialLanguage={initialLanguage}>{children}</Providers>
      </body>
    </html>
  );
}
