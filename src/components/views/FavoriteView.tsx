'use client'

import { useEffect } from "react"
import { Song } from "@/types"
import { usePlayerStore } from "@/store/usePlayerStore"
import { useFavoritesStore } from "@/store/useFavoritesStore"
import { useAuthStore } from "@/store/useAuthStore"
import { useUIStore } from "@/store/useUIStore"

export function FavoriteView() {
  const { playSong } = usePlayerStore()
  const { favoriteSongs, isFavorite, toggleFavorite, loadFavorites } = useFavoritesStore()
  const { user, setLoginModalOpen } = useAuthStore()
  const { setCurrentView } = useUIStore()

  // Immediately request database update once when component mounts
  useEffect(() => {
    if (user) {
      loadFavorites()
    }
  }, [user, loadFavorites])

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
      <div className="flex items-center justify-between mb-8">
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
}
