'use client'

import { Playlist, NewSongItem, HotSearchItem } from "@/types"
import { usePlayerStore } from "@/store/usePlayerStore"
import { useUIStore } from "@/store/useUIStore"
import { api, normalizeSong } from "@/lib/api"

interface HomeViewProps {
  topPlaylists: Playlist[]
  newSongs: NewSongItem[]
  hotSearch: HotSearchItem[]
}

export function HomeView({ topPlaylists, newSongs, hotSearch }: HomeViewProps) {
  const { playSong } = usePlayerStore()
  const { setCurrentView, setSearchQuery, setSelectedPlaylist } = useUIStore()

  const handlePlayNewSong = (item: NewSongItem) => {
    // Convert NewSongItem to Song format using normalizeSong helper
    const song = normalizeSong({
      id: item.id,
      name: item.name,
      artist: item.song.artists.map(a => a.name).join('/'),
      album: item.song.album?.name,
      pic: item.picUrl,
      url: `https://music.163.com/song/media/outer/url?id=${item.id}.mp3`
    })
    playSong(song)
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative h-[240px] md:h-[320px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.25)] mx-2 md:mx-0">
        <div className="absolute inset-0 z-0">
          <img 
            src={newSongs[0]?.picUrl || topPlaylists[0]?.coverImgUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2070&auto=format&fit=crop"} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s] ease-out" 
            alt="Featured"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent backdrop-blur-[2px]"></div>
        </div>
        
        <div className="relative h-full flex flex-col justify-center px-6 md:px-12 z-10">
          <div className="flex items-center gap-2 mb-3 md:mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <span className="w-6 md:w-8 h-[2px] bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
            <span className="text-blue-400 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] drop-shadow-md">今日首发</span>
          </div>
          
          <h2 className="text-2xl md:text-5xl font-black text-white mb-4 md:mb-6 leading-tight md:leading-none max-w-3xl tracking-tighter drop-shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            {newSongs[0]?.name || hotSearch[0]?.searchWord || "探索无界音乐"}
          </h2>
          
          <div className="flex flex-wrap items-center gap-3 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <button 
              onClick={() => newSongs[0] && handlePlayNewSong(newSongs[0])}
              className="group relative px-5 md:px-8 py-2.5 md:py-4 bg-white text-black rounded-full font-black text-[10px] md:text-xs hover:scale-105 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center gap-2 md:gap-3">
                <i className="ri-play-fill text-lg md:text-xl"></i>
                立即播放
              </span>
            </button>
          </div>
        </div>

        {/* Decorative Glass Cards */}
        <div className="absolute bottom-8 right-8 hidden lg:flex gap-3">
          {newSongs.slice(1, 4).map((item) => (
             <div 
              key={item.id}
              className="w-40 p-2.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-2.5 hover:bg-black/60 transition-colors cursor-pointer group"
              onClick={() => handlePlayNewSong(item)}
             >
               <img src={item.picUrl} className="w-8 h-8 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
               <div className="min-w-0">
                 <p className="text-white text-[10px] font-bold truncate group-hover:text-blue-400 transition-colors">{item.name}</p>
                 <p className="text-white/40 text-[9px] truncate">{item.song.artists[0].name}</p>
               </div>
             </div>
          ))}
        </div>
      </section>

      {/* New Songs List */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
            新歌速递
          </h2>
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
      </section>

      {/* Recommended Playlists */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
            推荐歌单
          </h2>
          <button 
            onClick={() => setCurrentView('playlists')}
            className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
          >
            查看全部
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {topPlaylists.slice(0, 10).map((playlist) => (
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
      </section>
    </div>
  )
}


