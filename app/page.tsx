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
    <div className={`min-h-screen dark:bg-[#0B0E14] bg-slate-50 font-sans dark:text-slate-300 text-slate-800 antialiased selection:bg-[#1877F2]/30 dark:selection:text-white selection:text-slate-900 pb-20 transition-colors duration-300 ${inter.className}`}>
      <HomeClientContent settings={settings} page={page} session={session} />
    </div>
  );
}
