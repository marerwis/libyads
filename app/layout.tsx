import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InTag - Advanced Ad Manager",
  description: "Advanced Ad Creation and Management Platform",
  openGraph: {
    type: "website",
    url: "https://intag.vercel.app",
    title: "InTag - Advanced Ad Manager",
    description: "Advanced Ad Creation and Management Platform",
    siteName: "InTag",
  },
  other: {
    "fb:app_id": "146492924904048", // Used from the previously configured FB App ID
  }
};

import { LanguageProvider } from "@/components/LanguageProvider";

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
        <LanguageProvider>
          {children}
          <SpeedInsights />
        </LanguageProvider>
      </body>
    </html>
  );
}
