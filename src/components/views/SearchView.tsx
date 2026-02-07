'use client'

import { Song } from "@/types"
import { usePlayerStore } from "@/store/usePlayerStore"
import { useFavoritesStore } from "@/store/useFavoritesStore"

interface SearchViewProps {
  query: string
  results: Song[]
  isLoading: boolean
}

export function SearchView({ query, results, isLoading }: SearchViewProps) {
  const { playSong } = usePlayerStore()
  const { isFavorite, toggleFavorite } = useFavoritesStore()

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
          <i className="ri-search-2-line text-blue-600"></i>
          搜索结果: <span className="text-blue-600">"{query}"</span>
        </h2>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{results.length} 首歌曲</div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="grid grid-cols-[48px_1fr_200px_80px] gap-4 px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] border-b border-gray-100 dark:border-white/5 mb-4">
            <div className="text-center">#</div>
            <div>标题 / 歌手</div>
            <div className="hidden md:block">专辑</div>
            <div className="text-right pr-4"><i className="ri-time-line text-sm"></i></div>
          </div>
          {results.map((song, index) => (
            <div 
              key={`${song.id}-${index}`} 
              className="gsap-item grid grid-cols-[48px_1fr_200px_80px] gap-4 items-center p-3 px-6 rounded-2xl hover:bg-white dark:hover:bg-white/5 transition-all cursor-pointer group"
              onClick={() => playSong(song)}
            >
              <div className="text-center text-gray-400 font-mono text-sm group-hover:text-blue-600 transition-colors">
                {(index + 1).toString().padStart(2, '0')}
              </div>
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden shadow-sm">
                  <img src={song.pic} alt={song.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="ri-play-fill text-white text-2xl"></i>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors text-sm">{song.name}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1 font-bold">{song.artist}</div>
                </div>
              </div>
              <div className="hidden md:block text-xs text-gray-400 dark:text-gray-500 truncate font-bold">
                {song.album}
              </div>
              <div className="flex items-center justify-end pr-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(song);
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <i className={isFavorite(song.id) ? "ri-heart-fill text-red-500" : "ri-heart-line text-gray-400"}></i>
                </button>
              </div>
            </div>
          ))}
          {results.length === 0 && !isLoading && (
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
