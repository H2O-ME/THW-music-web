'use client'

import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '@/store/useUIStore'
import { usePlayerStore } from '@/store/usePlayerStore'
import { Song } from '@/types'
import { api } from '@/lib/api'

import { useAuthStore } from '@/store/useAuthStore'

export function SearchHeader() {
  const { searchQuery, setSearchQuery, toggleSidebar, setCurrentView } = useUIStore()
  const { playSong } = usePlayerStore()
  const { user, setLoginModalOpen, logout } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchQuery)

  useEffect(() => {
    setMounted(true)
  }, [])
  const [suggestions, setSuggestions] = useState<Song[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [hotSearch, setHotSearch] = useState<any[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Sync local search with global search query (e.g. when cleared or set from outside)
  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  const handleSearchSubmit = (keyword: string) => {
    const trimmed = keyword.trim()
    if (trimmed) {
      setLocalSearch(trimmed)
      setSearchQuery(trimmed)
      setCurrentView('search')
      setIsFocused(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(localSearch)
    }
  }

  // Fetch Hot Search once
  useEffect(() => {
    const fetchHotSearch = async () => {
      try {
        const data = await api.getHotSearch()
        if (data.data) setHotSearch(data.data.slice(0, 10))
      } catch (err) {
        console.error('Fetch hot search error:', err)
      }
    }
    fetchHotSearch()
  }, [])

  useEffect(() => {
    if (localSearch.trim().length < 2) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      if (abortControllerRef.current) abortControllerRef.current.abort()
      abortControllerRef.current = new AbortController()

      setIsLoadingSuggestions(true)
      try {
        const data = await api.search(localSearch, abortControllerRef.current.signal)
        setSuggestions(data.slice(0, 6))
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error(err)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    const timer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timer)
  }, [localSearch])

  if (!mounted) return null

  return (
    <header className="h-20 flex items-center px-4 md:px-10 bg-white/40 dark:bg-[#0a0a0b]/40 backdrop-blur-xl z-20 sticky top-0">
      <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto gap-8">
        {/* Left Section: Menu Toggle (Mobile) */}
        <div className="flex md:hidden">
          <button 
            onClick={toggleSidebar}
            className="text-gray-700 dark:text-gray-300 w-10 h-10 flex items-center justify-center rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/5 active:scale-95 transition-all shadow-sm"
          >
            <i className="ri-menu-2-line text-xl"></i>
          </button>
        </div>

        {/* Center Section: Search Bar */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-xl group">
            <i className="ri-search-2-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"></i>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onKeyDown={handleKeyDown}
              className="w-full pl-11 pr-12 py-3 bg-gray-100/50 dark:bg-white/5 hover:bg-gray-200/50 dark:hover:bg-white/10 border border-transparent focus:border-blue-500/20 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all dark:text-white shadow-inner"
              placeholder="搜索音乐、艺术、灵感..."
            />
            
            {localSearch && (
              <button 
                onClick={() => setLocalSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <i className="ri-close-circle-fill"></i>
              </button>
            )}

            {/* Suggestions Dropdown */}
            {isFocused && (
              <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-white/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                {localSearch.trim().length >= 2 ? (
                  isLoadingSuggestions ? (
                    <div className="p-10 flex flex-col items-center justify-center gap-4">
                      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">正在深度检索...</p>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="py-4">
                      <div className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">最佳匹配</div>
                      {suggestions.map((song, index) => (
                        <button
                          key={`${song.id}-${index}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSearchSubmit(song.name);
                          }}
                          className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-blue-500/5 dark:hover:bg-white/5 transition-all text-left group"
                        >
                          <div className="relative w-12 h-12 shrink-0">
                            <img src={song.pic} alt={song.name} className="w-full h-full rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 flex items-center justify-center bg-blue-600/40 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity">
                              <i className="ri-play-fill text-white text-xl"></i>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-black text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 transition-colors selection:bg-transparent">{song.name}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1 font-medium selection:bg-transparent">{song.artist}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-gray-400">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-search-line text-3xl opacity-20"></i>
                      </div>
                      <p className="text-sm font-bold">未找到相关结果</p>
                    </div>
                  )
                ) : (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6 px-2">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        实时热搜榜
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                      {hotSearch.map((item, index) => (
                        <button
                          key={index}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSearchSubmit(item.searchWord);
                          }}
                          className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-all text-left group"
                        >
                          <span className={`text-sm font-black italic w-6 text-center ${index < 3 ? 'text-blue-600' : 'text-gray-300 dark:text-gray-700'}`}>
                            {(index + 1).toString().padStart(2, '0')}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-bold group-hover:text-blue-600 truncate selection:bg-transparent">{item.searchWord}</span>
                          {item.iconType === 1 && <span className="text-[8px] font-black bg-red-500 text-white px-1 rounded">HOT</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-3 md:gap-6">
          <button className="hidden md:flex w-10 h-10 items-center justify-center rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-all text-gray-500 dark:text-gray-400">
            <i className="ri-notification-3-line text-xl"></i>
          </button>
          
          <div className="relative">
            {user ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 p-[2px] active:scale-95 transition-all"
                >
                  <div className="w-full h-full rounded-[10px] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden font-bold text-blue-600 text-sm">
                    {user.username[0].toUpperCase()}
                  </div>
                </button>
                
                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                    <div className="absolute top-full right-0 mt-3 w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                      <div className="p-4 border-b border-gray-50 dark:border-white/5">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">当前账号</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.username}</p>
                      </div>
                      <div className="p-2">
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all text-left group">
                          <i className="ri-user-settings-line text-lg text-gray-400 group-hover:text-blue-500"></i>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">账号设置</span>
                        </button>
                        <button 
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all text-left group"
                        >
                          <i className="ri-logout-box-r-line text-lg text-gray-400 group-hover:text-red-500"></i>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-500">退出登录</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setLoginModalOpen(true)}
                className="px-4 md:px-6 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-black rounded-xl md:rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-600/20"
              >
                登录
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
