'use client'

import dynamic from 'next/dynamic'
import { PWARegistration } from "@/components/PWARegistration"

const Sidebar = dynamic(() => import("@/components/Sidebar").then(m => m.Sidebar), { ssr: false })
const Player = dynamic(() => import("@/components/Player").then(m => m.Player), { ssr: false })
const LyricView = dynamic(() => import("@/components/LyricView").then(m => m.LyricView), { ssr: false })
const LoginModal = dynamic(() => import("@/components/LoginModal").then(m => m.LoginModal), { ssr: false })
const BottomNav = dynamic(() => import("@/components/BottomNav").then(m => m.BottomNav), { ssr: false })

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
    </>
  )
}
