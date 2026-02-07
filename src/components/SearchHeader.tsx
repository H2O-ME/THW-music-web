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

  const fetchHotSearch = async () => {
    try {
      const res = await api.getHotSearch()
      // Robust data extraction for different API structures
      const list = res?.data || res?.result?.hots || res?.result || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        // Normalize items to ensure they have searchWord
        const normalized = list.map((item: any) => ({
          ...item,
          searchWord: item.searchWord || item.first || item.keyword || ''
        })).filter((item: any) => item.searchWord);
        setHotSearch(normalized.slice(0, 10))
      }
    } catch (err) {
      console.error('Fetch hot search error:', err)
    }
  }

  // Fetch Hot Search once on mount
  useEffect(() => {
    fetchHotSearch()
  }, [])

  // Re-fetch if empty when focused
  useEffect(() => {
    if (isFocused && hotSearch.length === 0) {
      fetchHotSearch()
    }
  }, [isFocused, hotSearch.length])

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
    <header className="h-24 flex items-center px-4 md:px-10 bg-transparent z-40 absolute top-0 left-0 right-0 pointer-events-none transition-all duration-300">
      <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto gap-8 pointer-events-auto">
        {/* Left Section: Menu Toggle (Mobile) */}
        <div className="flex md:hidden">
          <button 
            onClick={toggleSidebar}
            className="text-gray-700 dark:text-gray-300 w-10 h-10 flex items-center justify-center rounded-xl bg-white/90 dark:bg-black/50 border border-white/20 dark:border-white/5 active:scale-95 transition-all shadow-xl backdrop-blur-xl"
          >
            <i className="ri-menu-2-line text-xl"></i>
          </button>
        </div>

        {/* Center Section: Search Bar */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-xl group">
            <i className="ri-search-2-line absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors z-10"></i>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onKeyDown={handleKeyDown}
              className="w-full pl-12 pr-12 py-3.5 bg-white/80 dark:bg-[#1a1a1c]/80 hover:bg-white dark:hover:bg-[#1a1a1c] border border-white/20 dark:border-white/5 rounded-2xl text-sm font-bold focus:outline-none transition-all dark:text-white shadow-lg backdrop-blur-xl focus:ring-2 focus:ring-blue-500/20"
              placeholder="搜索任何歌曲、歌手、专辑..."
            />
            
            {localSearch && (
              <button 
                onClick={() => { setLocalSearch(''); setSearchQuery('') }}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 z-10"
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
        <div className="flex items-center gap-3">
          <button 
            onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : setLoginModalOpen(true)}
            className="w-11 h-11 rounded-full bg-blue-600/90 backdrop-blur-md text-white flex items-center justify-center shadow-lg shadow-blue-600/20 hover:scale-105 transition-all border border-white/10"
          >
            {user ? (
              <span className="font-black text-sm uppercase">{user.username[0]}</span>
            ) : (
              <i className="ri-user-3-fill text-lg"></i>
            )}
          </button>
          
          {isUserMenuOpen && user && (
            <div className="absolute top-[calc(100%-8px)] right-0 mt-2 w-48 bg-white/95 dark:bg-[#1a1a1c]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-white/5 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <button 
                onClick={() => { logout(); setIsUserMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
              >
                <i className="ri-logout-circle-line"></i> 退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
