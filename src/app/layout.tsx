import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "./Providers";

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        {/* iOS 상태바 / 안전영역 배경색 — globals.css :root --color-bg 와 동기화 */}
        <meta name="theme-color" content="#000000" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/remixicon@4.6.0/fonts/remixicon.css"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
