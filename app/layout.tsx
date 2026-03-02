import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Libya Ads",
  description: "Advanced Ad Creation and Management Platform",
  openGraph: {
    type: "website",
    url: "https://intag.vercel.app",
    title: "Libya Ads",
    description: "Advanced Ad Creation and Management Platform",
    siteName: "Libya Ads",
  },
  other: {
    "fb:app_id": "146492924904048", // Used from the previously configured FB App ID
  }
};

import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <LanguageProvider>
            {children}
            <SpeedInsights />
          </LanguageProvider>
        </ThemeProvider>

        <Script id="facebook-jssdk" strategy="lazyOnload">
          {`
            window.fbAsyncInit = function() {
              FB.init({
                appId      : '146492924904048',
                cookie     : true,
                xfbml      : true,
                version    : 'v21.0'
              });
                
              FB.AppEvents.logPageView();   
            };
          
            (function(d, s, id){
               var js, fjs = d.getElementsByTagName(s)[0];
               if (d.getElementById(id)) {return;}
               js = d.createElement(s); js.id = id;
               js.src = "https://connect.facebook.net/en_US/sdk.js";
               fjs.parentNode.insertBefore(js, fjs);
             }(document, 'script', 'facebook-jssdk'));
          `}
        </Script>
      </body>
    </html>
  );
}
