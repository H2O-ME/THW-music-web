'use client'

import { Song, Playlist } from "@/types"
import { usePlayerStore } from "@/store/usePlayerStore"
import { useFavoritesStore } from "@/store/useFavoritesStore"
import { useUIStore } from "@/store/useUIStore"

interface PlaylistViewProps {
  playlist: Playlist
  tracks: Song[]
  isLoading: boolean
}

export function PlaylistView({ playlist, tracks, isLoading }: PlaylistViewProps) {
  const { playSong, setPlaylist } = usePlayerStore()
  const { isFavorite, toggleFavorite } = useFavoritesStore()
  const { setSelectedPlaylist } = useUIStore()

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
          <img src={playlist.coverImgUrl} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        <div className="flex flex-col justify-center py-4 flex-1">
          <div className="mb-6">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold mb-4 border border-blue-100 dark:border-blue-800/50 uppercase tracking-wider">歌单</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">{playlist.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-3xl line-clamp-4 font-medium">{playlist.description || '暂无简介'}</p>
          </div>
          <button 
            onClick={() => {
              setPlaylist(tracks)
              if (tracks.length > 0) playSong(tracks[0])
            }}
            className="w-fit px-8 py-3 bg-blue-600 text-white rounded-full font-bold flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <i className="ri-play-fill text-xl"></i>
            播放全部
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
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
          {tracks.map((song, index) => (
            <div 
              key={`${song.id}-${index}`}
              className="gsap-item grid grid-cols-[32px_1fr_48px] md:grid-cols-[48px_1fr_200px_80px] gap-4 items-center p-2 md:p-3 rounded-2xl hover:bg-white/80 dark:hover:bg-white/5 transition-all cursor-pointer group"
              onClick={() => {
                setPlaylist(tracks)
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
