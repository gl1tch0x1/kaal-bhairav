import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "./Providers";

export const metadata: Metadata = {
  title: "KaalBhairav OSINT Platform",
  description: "Advanced Open Source Intelligence Platform — Powered by KaalBhairav",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Cinzel:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="bg-[#050b14] text-[#e8f4fd] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
