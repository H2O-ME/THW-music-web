'use client'

import { useUIStore } from '@/store/useUIStore'
import { useEffect, useState } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function BottomNav() {
  const { currentView, setCurrentView } = useUIStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null;

  const navItems = [
    { id: 'home', icon: 'ri-home-4-line', activeIcon: 'ri-home-4-fill', label: '首页' },
    { id: 'playlists', icon: 'ri-play-list-line', activeIcon: 'ri-play-list-fill', label: '发现' },
    { id: 'favorites', icon: 'ri-heart-line', activeIcon: 'ri-heart-fill', label: '收藏' },
  ] as const

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-t border-gray-200/50 dark:border-white/5 px-4 pb-safe pt-2 z-40 flex items-center justify-around shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = currentView === item.id
        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 py-1 px-4 transition-all duration-300 relative",
              isActive ? "text-blue-600" : "text-gray-400 dark:text-gray-500"
            )}
          >
            <i className={cn(isActive ? item.activeIcon : item.icon, "text-2xl transition-transform", isActive && "scale-110")}></i>
            <span className="text-[10px] font-bold tracking-wider">{item.label}</span>
            {isActive && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full blur-[2px] opacity-50"></div>
            )}
          </button>
        )
      })}
    </nav>
  )
}
