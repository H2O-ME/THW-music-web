'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

const Sidebar = dynamic(() => import("@/components/Sidebar").then(m => m.Sidebar), { ssr: false })
const Player = dynamic(() => import("@/components/Player").then(m => m.Player), { ssr: false })
const LyricView = dynamic(() => import("@/components/LyricView").then(m => m.LyricView), { ssr: false })
const LoginModal = dynamic(() => import("@/components/LoginModal").then(m => m.LoginModal), { ssr: false })
const BottomNav = dynamic(() => import("@/components/BottomNav").then(m => m.BottomNav), { ssr: false })

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, setLoginModalOpen } = useAuthStore()

  useEffect(() => {
    // Check if user is logged in, if not open modal after a short delay to ensure hydration
    if (!user) {
      const timer = setTimeout(() => {
        setLoginModalOpen(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [user, setLoginModalOpen])

  return (
    <>
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
