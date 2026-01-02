import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "remixicon/fonts/remixicon.css";
import "./globals.css";
import dynamic from 'next/dynamic'
import { PWARegistration } from "@/components/PWARegistration";

const Sidebar = dynamic(() => import("@/components/Sidebar").then(m => m.Sidebar), { ssr: false })
const Player = dynamic(() => import("@/components/Player").then(m => m.Player), { ssr: false })
const LyricView = dynamic(() => import("@/components/LyricView").then(m => m.LyricView), { ssr: false })
const LoginModal = dynamic(() => import("@/components/LoginModal").then(m => m.LoginModal), { ssr: false })
const BottomNav = dynamic(() => import("@/components/BottomNav").then(m => m.BottomNav), { ssr: false })

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "THW music",
  description: "A premium music player",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "THW music",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <PWARegistration />
        <div className="flex flex-1 h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 relative bg-white/50 mica-effect overflow-hidden flex flex-col">
            {children}
          </main>
        </div>
        <Player />
        <BottomNav />
        <LyricView />
        <LoginModal />
      </body>
    </html>
  );
}
