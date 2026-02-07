'use client'

import { usePlayerStore } from "@/store/usePlayerStore"
import { useFavoritesStore } from "@/store/useFavoritesStore"

export function HistoryView() {
  const { history, playSong, clearHistory } = usePlayerStore()
  const { isFavorite, toggleFavorite } = useFavoritesStore()

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
            <i className="ri-history-line text-blue-600"></i>
          </div>
          播放历史
        </h2>
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest flex items-center gap-2"
          >
            清空最近播放 <i className="ri-delete-bin-line"></i>
          </button>
        )}
      </div>
      
      <div className="space-y-1 bg-white/30 dark:bg-black/10 rounded-[2rem] md:rounded-[2.5rem] p-2 md:p-3 backdrop-blur-sm border border-white/40 dark:border-white/5 shadow-sm">
        <div className="grid grid-cols-[32px_1fr_48px] md:grid-cols-[48px_1fr_200px_80px] gap-4 px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100/50 dark:border-white/5 mb-4">
          <div className="text-center">#</div>
          <div>标题 / 歌手</div>
          <div className="hidden md:block">专辑</div>
          <div className="text-right pr-4"><i className="ri-time-line text-sm"></i></div>
        </div>
        
        {history.length > 0 ? (
          history.map((song, index) => (
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
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
                >
                  <i className={isFavorite(song.id) ? "ri-heart-fill text-red-500" : "ri-heart-line text-gray-400"}></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center text-gray-400">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <i className="ri-time-line text-4xl opacity-20"></i>
            </div>
            <p className="text-sm font-medium">暂无播放记录</p>
          </div>
        )}
      </div>
    </div>
  )
}
