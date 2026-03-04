import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://westwoodcommunityband.ca"),
  title: "Westwood Community Band",
  description:
    "Winnipeg's community concert band — forty-five years of making music. Join us for performances, rehearsals, and musical fellowship.",
  openGraph: {
    title: "Westwood Community Band",
    description:
      "Winnipeg's community concert band — forty-five years of making music. Join us for performances, rehearsals, and musical fellowship.",
    url: "/",
    siteName: "Westwood Community Band",
    type: "website",
    locale: "en_CA",
    images: [
      {
        url: "/og-westwood-community-band.png",
        width: 1200,
        height: 630,
        alt: "Westwood Community Band — Forty-Five Years of Making Music",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Westwood Community Band",
    description:
      "Winnipeg's community concert band — forty-five years of making music.",
    images: ["/og-westwood-community-band.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
