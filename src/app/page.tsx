'use client'

import { useAuthStore } from "@/store/useAuthStore"
import { useUIStore } from "@/store/useUIStore"
import { usePlayerStore } from "@/store/usePlayerStore"
import { useFavoritesStore } from "@/store/useFavoritesStore"
import { useEffect, useState, useRef } from "react"
import { Song, Playlist, Artist, HotSearchItem, NewSongItem } from "@/types"
import { gsap } from "gsap"
import dynamic from 'next/dynamic'

import { api } from '@/lib/api'

import { HomeView } from "@/components/views/HomeView"
import { PlaylistView } from "@/components/views/PlaylistView"
import { FavoriteView } from "@/components/views/FavoriteView"
import { SearchView } from "@/components/views/SearchView"
import { HistoryView } from "@/components/views/HistoryView"

const SearchHeader = dynamic(() => import("@/components/SearchHeader").then(m => m.SearchHeader), { ssr: false })

export default function Home() {
  const { currentView, searchQuery, selectedPlaylist, setSelectedPlaylist } = useUIStore()
  const { user } = useAuthStore()
  const { favoriteSongs, loadFavorites } = useFavoritesStore()
  const [topPlaylists, setTopPlaylists] = useState<Playlist[]>([])
  const [playlistTracks, setPlaylistTracks] = useState<Song[]>([])
  const [searchResults, setSearchResults] = useState<Song[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const contentRef = useRef<HTMLDivElement>(null)
  const searchAbortControllerRef = useRef<AbortController | null>(null)
  
  const [hotSearch, setHotSearch] = useState<HotSearchItem[]>([])
  const [newSongs, setNewSongs] = useState<NewSongItem[]>([])

  // Load favorites when user is available
  useEffect(() => {
    if (user && favoriteSongs.length === 0) {
      loadFavorites()
    }
  }, [user, loadFavorites, favoriteSongs.length])

  useEffect(() => {
    if (contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(contentRef.current, 
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
        )
      }, contentRef)
      return () => ctx.revert()
    }
  }, [currentView, selectedPlaylist])

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [resPlaylists, resHotSearch, resNewSongs] = await Promise.allSettled([
          api.getTopPlaylists(),
          api.getHotSearch(),
          api.getNewSongs()
        ]);

        if (resPlaylists.status === 'fulfilled' && resPlaylists.value.code === 200) {
          setTopPlaylists(resPlaylists.value.playlists);
        }
        if (resHotSearch.status === 'fulfilled' && resHotSearch.value.data) {
          setHotSearch(resHotSearch.value.data);
        }
        if (resNewSongs.status === 'fulfilled' && resNewSongs.value.result) {
          setNewSongs(resNewSongs.value.result);
        }
      } catch (err) {
        console.error('获取首页数据失败:', err);
      }
    }
    fetchHomeData()
  }, [])

  useEffect(() => {
    if (!selectedPlaylist) return

    const fetchPlaylistTracks = async () => {
      setIsLoading(true)
      try {
        const data = await api.getPlaylistTracks(selectedPlaylist.id)
        setPlaylistTracks(data)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPlaylistTracks()
  }, [selectedPlaylist])

  useEffect(() => {
    if (currentView !== 'search' || !searchQuery) {
      setSearchResults([])
      return
    }

    const performSearch = async () => {
      if (searchAbortControllerRef.current) searchAbortControllerRef.current.abort()
      searchAbortControllerRef.current = new AbortController()
      
      setIsLoading(true)
      try {
        const data = await api.search(searchQuery, searchAbortControllerRef.current.signal)
        setSearchResults(data)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(performSearch, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, currentView])

  const renderContent = () => {
    if (currentView === 'search') {
      return <SearchView query={searchQuery} results={searchResults} isLoading={isLoading} />
    }

    switch (currentView) {
      case 'home':
        return <HomeView topPlaylists={topPlaylists} newSongs={newSongs} hotSearch={hotSearch} />
      case 'playlists':
        if (selectedPlaylist) {
          return <PlaylistView playlist={selectedPlaylist} tracks={playlistTracks} isLoading={isLoading} />
        }
        return (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
              <i className="ri-play-list-fill text-blue-600"></i>
              歌单广场
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {topPlaylists.map((playlist) => (
                <div 
                  key={playlist.id} 
                  className="gsap-item group cursor-pointer"
                  onClick={() => setSelectedPlaylist(playlist)}
                >
                  <div className="relative aspect-square mb-3 md:mb-4 overflow-hidden rounded-xl md:rounded-2xl shadow-lg">
                    <img src={playlist.coverImgUrl} alt={playlist.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-blue-600 shadow-xl opacity-100 md:opacity-0 translate-y-0 md:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                      <i className="ri-play-fill text-lg md:text-xl"></i>
                    </div>
                  </div>
                  <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">{playlist.name}</h3>
                </div>
              ))}
            </div>
          </div>
        )
      case 'favorites':
        return <FavoriteView />
      case 'history':
        return <HistoryView />
      default:
        return null
    }
  }

  return (
    <>
      <SearchHeader />
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-10 pt-28 pb-40 scroll-smooth custom-scrollbar relative z-10 will-change-scroll transform-gpu"
      >
        <div className="max-w-7xl mx-auto backface-hidden">
          {renderContent()}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-400/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-400/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
    </>
  )
}

