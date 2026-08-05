import type { Metadata } from "next";
import { Fraunces, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const body = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const mono = Space_Mono({
  variable: "--font-stat",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Profile pages hand Next relative image paths for their unfurl cards, and
// Open Graph requires absolute URLs — metadataBase is what turns one into the
// other. AUTH_URL is already the canonical public origin in production.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
  title: "link.xxoo.ooo",
  description: "One link. Everything you make.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface-sunk text-ink font-body">
        {children}
      </body>
    </html>
  );
}
