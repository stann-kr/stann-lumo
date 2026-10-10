import type { Metadata } from "next";
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
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const initialLanguage = await getRequestLocale();
  return (
    <html lang={initialLanguage} suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        {/* iOS 상태바 / 안전영역 배경색 — globals.css :root --color-bg 와 동기화 */}
        <meta name="theme-color" content="#000000" />
        {/* One font request discovered with the document, instead of CSS @imports found only after the app stylesheet loads. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* The pages-router rule does not see that the App Router root layout already covers every route. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <LegacyPublicStorageCleanup />
        <Providers initialLanguage={initialLanguage}>{children}</Providers>
      </body>
    </html>
  );
}
