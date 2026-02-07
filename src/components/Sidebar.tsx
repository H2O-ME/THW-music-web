'use client'

import { useUIStore } from '@/store/useUIStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useFavoritesStore } from '@/store/useFavoritesStore'
import { useEffect, useState } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function Sidebar() {
  const { isSidebarOpen, currentView, setCurrentView, toggleSidebar, setSidebarOpen } = useUIStore()
  const { user, setLoginModalOpen, logout } = useAuthStore()
  const { loadFavorites } = useFavoritesStore()
  const [mounted, setMounted] = useState(false)

  // Handle responsive sidebar behavior
  useEffect(() => {
    setMounted(true)
    let lastWidth = window.innerWidth

    const handleResize = () => {
      const currentWidth = window.innerWidth
      // Only act if crossing the 768px threshold
      if (lastWidth >= 768 && currentWidth < 768) {
        setSidebarOpen(false)
      } else if (lastWidth < 768 && currentWidth >= 768) {
        setSidebarOpen(true)
      }
      lastWidth = currentWidth
    }

    // Initial check
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])

  useEffect(() => {
    if (user) {
      loadFavorites()
    }
  }, [user, loadFavorites])

  // Prevent hydration mismatch by returning null until mounted
  if (!mounted) return null;

  const navItems = [
    { id: 'home', icon: 'ri-home-4-line', label: '首页', title: '首页' },
    { id: 'playlists', icon: 'ri-play-list-fill', label: '歌单广场', title: '歌单广场' },
    { id: 'favorites', icon: 'ri-heart-line', label: '我的收藏', title: '我的收藏' },
    { id: 'history', icon: 'ri-history-line', label: '最近播放', title: '最近播放' },
  ] as const

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden",
          isSidebarOpen ? "block opacity-100" : "hidden opacity-0"
        )}
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col bg-white dark:bg-[#0a0a0b] border-r border-gray-100 dark:border-white/5 z-50 transition-all duration-300 h-full shrink-0",
          "fixed md:relative",
          isSidebarOpen ? "w-64 translate-x-0" : "w-0 md:w-24 -translate-x-full md:translate-x-0"
        )}
      >
        <div className={cn(
          "mb-10 mt-6 px-2 flex items-center h-10 transition-all",
          isSidebarOpen ? "gap-4 px-6" : "justify-center"
        )}>
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                <i className="ri-music-fill text-xl"></i>
              </div>
              <h1 className="font-black text-xl tracking-tight text-gray-900 dark:text-white uppercase">THW music</h1>
            </div>
          ) : (
            <button 
              onClick={toggleSidebar}
              className="w-12 h-12 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 text-blue-600 transition-all flex items-center justify-center shadow-sm"
            >
              <i className="ri-music-fill text-2xl"></i>
            </button>
          )}
        </div>

        <nav className="space-y-1.5 flex-1 px-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id)
                if (window.innerWidth < 768) toggleSidebar()
              }}
              className={cn(
                "w-full flex items-center rounded-2xl transition-all overflow-hidden whitespace-nowrap h-12 relative group",
                isSidebarOpen ? "px-5 gap-4" : "justify-center",
                currentView === item.id 
                  ? "bg-blue-600/5 text-blue-600" 
                  : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
              title={item.title}
            >
              <i className={cn(item.icon, "text-xl shrink-0 transition-transform group-hover:scale-110", currentView === item.id ? "text-blue-600" : "")}></i>
              {isSidebarOpen && <span className={cn("text-sm font-bold", currentView === item.id ? "text-gray-900 dark:text-white" : "opacity-80")}>{item.label}</span>}
              
              {currentView === item.id && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-l-full"></div>
              )}
            </button>
          ))}
          
          <div className="pt-6 my-6 border-t border-gray-100 dark:border-white/5 mx-2"></div>
        </nav>

        <div className="mt-auto mb-6 px-2">
          {/* Account UI removed from sidebar as requested */}
        </div>
      </aside>
    </>
  )
}
