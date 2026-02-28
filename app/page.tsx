import Link from "next/link";
import { Inter } from "next/font/google";
import { getSettings, getPageBySlug } from "@/sanity/lib/queries";
import { PortableText } from "@portabletext/react";
import { getServerSession } from "next-auth/next";

import HomeClientContent from "./HomeClientContent";

const inter = Inter({ subsets: ["latin"] });

export default async function Home() {
  const settings = await getSettings();
  const page = await getPageBySlug("home");
  const session = await getServerSession();

  return (
    <div className={`min-h-screen bg-[#0B0E14] font-sans text-slate-300 antialiased selection:bg-[#1877F2]/30 selection:text-white pb-20 ${inter.className}`}>
      <HomeClientContent settings={settings} page={page} session={session} />
    </div>
  );
}
