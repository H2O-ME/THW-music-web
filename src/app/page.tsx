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

const SearchHeader = dynamic(() => import("@/components/SearchHeader").then(m => m.SearchHeader), { ssr: false })

export default function Home() {
  const { currentView, searchQuery, selectedPlaylist, setSelectedPlaylist, setCurrentView, setSearchQuery } = useUIStore()
  const { playSong, setPlaylist } = usePlayerStore()
  const { user, setLoginModalOpen } = useAuthStore()
  const { favoriteSongs, isFavorite, toggleFavorite, loadFavorites } = useFavoritesStore()
  const [topPlaylists, setTopPlaylists] = useState<Playlist[]>([])
  const [playlistTracks, setPlaylistTracks] = useState<Song[]>([])
  const [searchResults, setSearchResults] = useState<Song[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const contentRef = useRef<HTMLDivElement>(null)
  const searchAbortControllerRef = useRef<AbortController | null>(null)
  
  // New State
  const [hotSearch, setHotSearch] = useState<HotSearchItem[]>([])
  const [topArtists, setTopArtists] = useState<Artist[]>([])
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
        // Page entrance animation
        gsap.fromTo(contentRef.current, 
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
        )

        // Staggered entrance for list items
        const gridItems = contentRef.current?.querySelectorAll('.gsap-item') || []
        if (gridItems.length > 0) {
          gsap.fromTo(gridItems,
            { opacity: 0, x: -10 },
            { 
              opacity: 1, 
              x: 0, 
              duration: 0.4, 
              stagger: 0.03, 
              ease: "power1.out",
              clearProps: "all" 
            }
          )
        }
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

        if (resPlaylists.status === 'fulfilled') {
          if (resPlaylists.value.code === 200) setTopPlaylists(resPlaylists.value.playlists);
        }

        if (resHotSearch.status === 'fulfilled') {
          if (resHotSearch.value.data) setHotSearch(resHotSearch.value.data);
        }

        if (resNewSongs.status === 'fulfilled') {
          if (resNewSongs.value.result) setNewSongs(resNewSongs.value.result);
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

  useEffect(() => {
    if (currentView === 'favorites' && user) {
      loadFavorites()
    }
  }, [currentView, user, loadFavorites])

  const handlePlayNewSong = async (item: NewSongItem) => {
    setSearchQuery(item.name)
    setCurrentView('search')
  }

  const renderContent = () => {
    if (currentView === 'search' && searchQuery) {
      return (
        <div className="animate-in fade-in duration-700">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <i className="ri-search-2-line text-blue-600"></i>
              搜索结果: <span className="text-blue-600">"{searchQuery}"</span>
            </h2>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{searchResults.length} 首歌曲</div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64" key="search-loader">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-1 bg-white/30 dark:bg-black/10 rounded-[2rem] p-2 md:p-4 backdrop-blur-sm border border-white/40 dark:border-white/5 shadow-sm">
              <div className="grid grid-cols-[32px_1fr_48px] md:grid-cols-[48px_1fr_200px_80px] gap-4 px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100/50 dark:border-white/5 mb-2">
                <div className="text-center">#</div>
                <div>标题 / 歌手</div>
                <div className="hidden md:block">专辑</div>
                <div className="text-right pr-4"><i className="ri-time-line text-sm"></i></div>
              </div>
              {searchResults.map((song, index) => (
                <div 
                  key={`${song.id}-${index}`} 
                  className="gsap-item grid grid-cols-[32px_1fr_48px] md:grid-cols-[48px_1fr_200px_80px] gap-4 items-center p-2 md:p-3 rounded-2xl hover:bg-white/80 dark:hover:bg-white/5 transition-all cursor-pointer group"
                  onClick={() => playSong(song)}
                >
                  <div className="text-center text-gray-400 font-mono text-xs md:text-sm group-hover:text-blue-600 transition-colors">
                    {(index + 1).toString().padStart(2, '0')}
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className="relative w-10 h-10 md:w-11 md:h-11 shrink-0 rounded-lg md:rounded-xl overflow-hidden shadow-sm">
                      <img src={song.pic} alt={song.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <i className="ri-play-fill text-white text-lg md:text-xl"></i>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors text-xs md:text-sm">{song.name}</div>
                      <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate mt-1 font-medium">{song.artist}</div>
                    </div>
                  </div>
                  <div className="hidden md:block text-xs text-gray-400 dark:text-gray-500 truncate font-medium">
                    {song.album}
                  </div>
                  <div className="flex items-center justify-end pr-2 md:pr-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(song);
                      }}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
                    >
                      <i className={isFavorite(song.id) ? "ri-heart-fill text-red-500" : "ri-heart-line text-gray-400"}></i>
                    </button>
                  </div>
                </div>
              ))}
              {searchResults.length === 0 && !isLoading && (
                <div className="py-20 text-center text-gray-400">
                  <i className="ri-search-line text-5xl mb-4 block opacity-20"></i>
                  <p className="text-sm font-medium">未找到相关结果</p>
                </div>
              )}
            </div>
          )}
        </div>
      )
    }

    switch (currentView) {
      case 'home':
        return (
          <div className="animate-in fade-in duration-700 space-y-16 pb-12">
            
            {/* Hero Section - Refactored */}
            <section className="relative h-[300px] md:h-[400px] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.3)] mx-2 md:mx-0">
              <div className="absolute inset-0 z-0">
                <img 
                  src={newSongs[0]?.picUrl || topPlaylists[0]?.coverImgUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2070&auto=format&fit=crop"} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s] ease-out" 
                  alt="Featured"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent backdrop-blur-[2px]"></div>
              </div>
              
              <div className="relative h-full flex flex-col justify-center px-6 md:px-16 z-10">
                <div className="flex items-center gap-3 mb-4 md:mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                  <span className="w-8 md:w-12 h-[3px] bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                  <span className="text-blue-400 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] drop-shadow-md">今日首发</span>
                </div>
                
                <h2 className="text-3xl md:text-7xl font-black text-white mb-6 md:mb-8 leading-tight md:leading-none max-w-4xl tracking-tighter drop-shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                  {newSongs[0]?.name || hotSearch[0]?.searchWord || "探索无界音乐"}
                </h2>
                
                <div className="flex flex-wrap items-center gap-4 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                  <button 
                    onClick={() => newSongs[0] && handlePlayNewSong(newSongs[0])}
                    className="group relative px-6 md:px-10 py-3 md:py-5 bg-white text-black rounded-full font-black text-xs md:text-sm hover:scale-105 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative flex items-center gap-2 md:gap-3">
                      <i className="ri-play-fill text-xl md:text-2xl"></i>
                      立即播放
                    </span>
                  </button>
                  
                  <div className="flex items-center gap-3 md:gap-4">
                     <button className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all active:scale-95 group">
                        <i className="ri-heart-line text-lg md:text-2xl group-hover:text-red-500 transition-colors"></i>
                     </button>
                     <button className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all active:scale-95">
                        <i className="ri-share-forward-line text-lg md:text-2xl"></i>
                     </button>
                  </div>
                </div>
              </div>

              {/* Decorative Glass Cards */}
              <div className="absolute bottom-12 right-12 hidden lg:flex gap-4">
                {newSongs.slice(1, 4).map((item, i) => (
                   <div 
                    key={item.id}
                    className="w-48 p-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-3 hover:bg-black/60 transition-colors cursor-pointer group"
                    onClick={() => handlePlayNewSong(item)}
                   >
                     <img src={item.picUrl} className="w-10 h-10 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                     <div className="min-w-0">
                       <p className="text-white text-xs font-bold truncate group-hover:text-blue-400 transition-colors">{item.name}</p>
                       <p className="text-white/40 text-[10px] truncate">{item.song.artists[0].name}</p>
                     </div>
                   </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
              {/* New Songs - Now Full Width since Hot Search Sidebar is removed */}
              <div className="xl:col-span-3">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                    <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                    新歌速递
                  </h2>
                  <button className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center gap-2">
                    播放全部 <i className="ri-play-circle-line text-lg"></i>
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 px-2 md:px-0">
                  {newSongs.slice(0, 12).map((item) => (
                    <div 
                      key={item.id}
                      className="gsap-item flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl md:rounded-[2rem] bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                      onClick={() => handlePlayNewSong(item)}
                    >
                      <div className="relative w-full aspect-square md:w-16 md:h-16 shrink-0 rounded-xl md:rounded-2xl overflow-hidden shadow-md">
                        <img src={item.picUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 scale-50 group-hover:scale-100 transition-transform duration-500">
                            <i className="ri-play-fill text-white text-lg md:text-xl"></i>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-center md:text-left">
                        <h4 className="text-xs md:text-sm font-black text-gray-800 dark:text-white truncate group-hover:text-blue-600 transition-colors">{item.name}</h4>
                        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate mt-1 font-medium">{item.song.artists.map(a => a.name).join('/')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )
      case 'playlists':
        if (selectedPlaylist) {
          return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button 
                onClick={() => setSelectedPlaylist(null)}
                className="mb-8 flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-all group"
              >
                <i className="ri-arrow-left-line group-hover:-translate-x-1 transition-transform"></i>
                <span className="text-sm font-medium">返回歌单广场</span>
              </button>
              
              <div className="flex flex-col md:flex-row gap-10 mb-12">
                <div className="w-64 h-64 md:w-72 md:h-72 shrink-0 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] group relative">
                  <img src={selectedPlaylist.coverImgUrl} alt={selectedPlaylist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="flex flex-col justify-center py-4 flex-1">
                  <div className="mb-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold mb-4 border border-blue-100 dark:border-blue-800/50 uppercase tracking-wider">歌单</span>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">{selectedPlaylist.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-3xl line-clamp-4 font-medium">{selectedPlaylist.description || '暂无简介'}</p>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center h-64" key="playlist-loader">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-1 bg-white/30 dark:bg-black/10 rounded-[2rem] p-2 md:p-4 backdrop-blur-sm border border-white/40 dark:border-white/5">
                  <div className="grid grid-cols-[32px_1fr_48px] md:grid-cols-[48px_1fr_200px_80px] gap-4 px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100/50 dark:border-white/5 mb-2">
                    <div className="text-center">#</div>
                    <div>标题 / 歌手</div>
                    <div className="hidden md:block">专辑</div>
                    <div className="text-right pr-4"><i className="ri-time-line text-sm"></i></div>
                  </div>
                  {playlistTracks.map((song, index) => (
                    <div 
                      key={`${song.id}-${index}`}
                      className="gsap-item grid grid-cols-[32px_1fr_48px] md:grid-cols-[48px_1fr_200px_80px] gap-4 items-center p-2 md:p-3 rounded-2xl hover:bg-white/80 dark:hover:bg-white/5 transition-all cursor-pointer group"
                      onClick={() => {
                        setPlaylist(playlistTracks)
                        playSong(song)
                      }}
                    >
                      <div className="text-center text-gray-400 font-mono text-xs md:text-sm group-hover:text-blue-600 transition-colors">
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div className="relative w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-lg overflow-hidden shadow-sm">
                          <img src={song.pic} alt={song.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <i className="ri-play-fill text-white text-lg md:text-xl"></i>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors text-xs md:text-sm">{song.name}</div>
                          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate mt-1 font-medium">{song.artist}</div>
                        </div>
                      </div>
                      <div className="hidden md:block text-xs text-gray-400 dark:text-gray-500 truncate font-medium">
                        {song.album}
                      </div>
                      <div className="flex items-center justify-end pr-2 md:pr-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(song);
                          }}
                          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
                        >
                          <i className={isFavorite(song.id) ? "ri-heart-fill text-red-500" : "ri-heart-line text-gray-400"}></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        }
        return (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
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
                  <h3 className="text-xs md:text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">{playlist.name}</h3>
                </div>
              ))}
            </div>
          </div>
        )
      case 'favorites':
        if (!user) {
          return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in zoom-in duration-700">
              <div className="w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                <i className="ri-user-heart-line text-5xl text-blue-600"></i>
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">开启你的私人曲库</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-10 font-medium leading-relaxed">
                登录后即可同步您的收藏歌曲，并在任何设备上随时随地享受。
              </p>
              <button 
                onClick={() => setLoginModalOpen(true)}
                className="px-12 py-4 bg-blue-600 text-white rounded-full font-black shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95"
              >
                立即登录
              </button>
            </div>
          )
        }
        return (
          <div className="animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                  <i className="ri-heart-3-fill text-red-500"></i>
                </div>
                我的收藏
              </h2>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{favoriteSongs.length} 首珍藏曲目</div>
            </div>
            
            <div className="space-y-1 bg-white/30 dark:bg-black/10 rounded-[2rem] md:rounded-[2.5rem] p-2 md:p-3 backdrop-blur-sm border border-white/40 dark:border-white/5 shadow-sm">
              <div className="grid grid-cols-[32px_1fr_48px] md:grid-cols-[48px_1fr_200px_80px] gap-4 px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100/50 dark:border-white/5 mb-4">
                <div className="text-center">#</div>
                <div>标题 / 歌手</div>
                <div className="hidden md:block">专辑</div>
                <div className="text-right pr-4"><i className="ri-time-line text-sm"></i></div>
              </div>
              {favoriteSongs.length > 0 ? (
                favoriteSongs.map((song, index) => (
                  <div 
                    key={`${song.id}-${index}`} 
                    className="gsap-item grid grid-cols-[32px_1fr_48px] md:grid-cols-[48px_1fr_200px_80px] gap-4 items-center p-2 md:p-3 rounded-2xl hover:bg-white/80 dark:hover:bg-white/5 transition-all cursor-pointer group"
                    onClick={() => playSong(song)}
                  >
                    <div className="text-center text-gray-400 font-mono text-xs md:text-sm group-hover:text-blue-600 transition-colors">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className="relative w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-lg md:rounded-xl overflow-hidden shadow-sm">
                        <img src={song.pic} alt={song.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <i className="ri-play-fill text-white text-xl md:text-2xl"></i>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors text-xs md:text-sm">{song.name}</div>
                        <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate mt-1 font-medium">{song.artist}</div>
                      </div>
                    </div>
                    <div className="hidden md:block text-xs text-gray-400 dark:text-gray-500 truncate font-medium">
                      {song.album}
                    </div>
                    <div className="flex items-center justify-end pr-2 md:pr-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(song);
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-red-500"
                      >
                        <i className="ri-heart-fill"></i>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center text-gray-400">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <i className="ri-heart-add-line text-4xl opacity-20"></i>
                  </div>
                  <p className="text-sm font-medium">暂无收藏歌曲，去发现好音乐吧</p>
                  <button 
                    onClick={() => setCurrentView('home')}
                    className="mt-6 text-blue-600 text-xs font-black uppercase tracking-widest hover:underline"
                  >
                    前往发现
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      <SearchHeader />
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-10 pt-6 pb-40 scroll-smooth custom-scrollbar relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-400/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-400/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
    </>
  )
}
