'use client'

import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useFavoritesStore } from '@/store/useFavoritesStore'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function Player() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [mounted, setMounted] = useState(false)
  
  const {
    playlist,
    currentSongIndex,
    isPlaying,
    volume,
    currentTime,
    duration,
    lyrics,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    nextSong,
    prevSong,
    setIsLyricViewOpen,
    isLyricViewOpen,
    setVolume
  } = usePlayerStore()

  const { isFavorite, toggleFavorite } = useFavoritesStore()

  const currentSong = playlist[currentSongIndex]

  const [isDragging, setIsDragging] = useState(false)
  const [dragValue, setDragValue] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  const displayTime = isDragging ? dragValue : currentTime

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.name,
        artist: currentSong.artist,
        album: currentSong.album || '',
        artwork: [
          { src: currentSong.pic, sizes: '96x96', type: 'image/png' },
          { src: currentSong.pic, sizes: '128x128', type: 'image/png' },
          { src: currentSong.pic, sizes: '192x192', type: 'image/png' },
          { src: currentSong.pic, sizes: '256x256', type: 'image/png' },
          { src: currentSong.pic, sizes: '384x384', type: 'image/png' },
          { src: currentSong.pic, sizes: '512x512', type: 'image/png' },
        ]
      })

      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true))
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false))
      navigator.mediaSession.setActionHandler('previoustrack', () => prevSong())
      navigator.mediaSession.setActionHandler('nexttrack', () => nextSong())
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && audioRef.current) {
          audioRef.current.currentTime = details.seekTime
          setCurrentTime(details.seekTime)
        }
      })
    }
  }, [currentSong, setIsPlaying, nextSong, prevSong, setCurrentTime])

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Play failed:", error)
            // If error is NotAllowedError (user didn't interact), we might want to show pause state
            // But here we just log it.
          })
        }
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying])

  // Reset loading state when song changes
  useEffect(() => {
    setIsLoading(true)
    setError(false)
  }, [currentSongIndex])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const onCanPlay = () => {
    setIsLoading(false)
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(console.error)
    }
  }

  const onWaiting = () => setIsLoading(true)
  
  const onPlaying = () => setIsLoading(false)

  const onError = () => {
    setIsLoading(false)
    setError(true)
    console.error("Audio Error:", audioRef.current?.error)
    // Optional: Auto skip to next song on error
    // setTimeout(() => nextSong(), 2000)
  }

  const onEnded = () => {
    nextSong()
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setDragValue(time)
  }

  const handleProgressChangeEnd = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = dragValue
      setCurrentTime(dragValue)
    }
    setIsDragging(false)
  }

  const handleProgressChangeStart = () => {
    setIsDragging(true)
    setDragValue(currentTime)
  }

  const togglePiP = async () => {
    if (!currentSong) return

    if ('documentPictureInPicture' in window) {
      try {
        // @ts-ignore
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 380,
          height: 520,
        })

        // Copy styles
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
        styles.forEach((style) => pipWindow.document.head.appendChild(style.cloneNode(true)))

        const state = usePlayerStore.getState()
        const currentLyric = lyrics[state.currentLyricIndex]?.text || 'THW Music'

        // Create Container
        const container = pipWindow.document.createElement('div')
        container.className = 'pip-container h-full w-full flex flex-col items-center justify-between p-8 text-center overflow-hidden relative bg-[#0a0a0b] text-white select-none'
        
        // Dynamic Glass Background
        const bg = pipWindow.document.createElement('div')
        bg.className = 'absolute inset-0 z-0'
        bg.innerHTML = `
          <div class="absolute inset-0 bg-cover bg-center opacity-40 blur-[80px] scale-150 transition-all duration-1000" style="background-image: url('${currentSong.pic}')"></div>
          <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#0a0a0b]"></div>
        `
        container.appendChild(bg)

        // Main Content
        const content = pipWindow.document.createElement('div')
        content.className = 'relative z-10 w-full flex flex-col items-center'
        content.innerHTML = `
          <div class="relative w-44 h-44 mb-10 group">
            <div class="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-110 opacity-50 transition-opacity"></div>
            <img src="${currentSong.pic}" class="relative w-full h-full rounded-[2.5rem] object-cover shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-white/10" />
          </div>

          <div class="w-full mb-10 px-2">
            <h2 class="text-2xl font-black mb-2 truncate drop-shadow-lg tracking-tight">${currentSong.name}</h2>
            <p class="text-white/40 text-sm font-bold tracking-widest uppercase truncate">${currentSong.artist}</p>
          </div>
          
          <div class="w-full mb-10 min-h-[4rem] flex items-center justify-center">
            <p id="pip-lyric" class="text-lg font-bold text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] line-clamp-2 leading-tight px-4 transition-all duration-300">
              ${currentLyric}
            </p>
          </div>

          <div class="w-full px-2 mb-10">
            <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
              <div id="pip-progress" class="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-300" style="width: ${(state.currentTime / (state.duration || 1)) * 100}%"></div>
            </div>
            <div class="flex justify-between mt-3 text-[10px] font-black text-white/20 tracking-tighter">
              <span id="pip-current-time">${formatTime(state.currentTime)}</span>
              <span id="pip-duration">${formatTime(state.duration)}</span>
            </div>
          </div>

          <div class="flex items-center gap-10">
            <button id="pip-prev" class="p-2 text-white/40 hover:text-white transition-all active:scale-90"><i class="ri-skip-back-fill text-3xl"></i></button>
            <button id="pip-play" class="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)]">
              <i class="ri-${state.isPlaying ? 'pause' : 'play'}-fill text-4xl ml-0.5"></i>
            </button>
            <button id="pip-next" class="p-2 text-white/40 hover:text-white transition-all active:scale-90"><i class="ri-skip-forward-fill text-3xl"></i></button>
          </div>
        `
        container.appendChild(content)
        pipWindow.document.body.appendChild(container)

        // Events
        pipWindow.document.getElementById('pip-play').onclick = () => {
          const s = usePlayerStore.getState()
          setIsPlaying(!s.isPlaying)
        }
        pipWindow.document.getElementById('pip-prev').onclick = () => prevSong()
        pipWindow.document.getElementById('pip-next').onclick = () => nextSong()

        // Sync
        const updateTimer = setInterval(() => {
          if (pipWindow.closed) {
            clearInterval(updateTimer)
            return
          }
          
          const s = usePlayerStore.getState()
          
          // Progress
          const progress = pipWindow.document.getElementById('pip-progress')
          if (progress) progress.style.width = `${(s.currentTime / (s.duration || 1)) * 100}%`
          
          const timeEl = pipWindow.document.getElementById('pip-current-time')
          if (timeEl) timeEl.innerText = formatTime(s.currentTime)

          const durEl = pipWindow.document.getElementById('pip-duration')
          if (durEl) durEl.innerText = formatTime(s.duration)
          
          // Lyric
          const lyricEl = pipWindow.document.getElementById('pip-lyric')
          const currentLyricText = lyrics[s.currentLyricIndex]?.text || 'THW Music'
          if (lyricEl && lyricEl.innerText !== currentLyricText) {
            lyricEl.style.opacity = '0'
            lyricEl.style.transform = 'translateY(5px)'
            setTimeout(() => {
              lyricEl.innerText = currentLyricText
              lyricEl.style.opacity = '1'
              lyricEl.style.transform = 'translateY(0)'
            }, 150)
          }

          // Play/Pause Icon
          const playBtn = pipWindow.document.querySelector('#pip-play i')
          if (playBtn) playBtn.className = `ri-${s.isPlaying ? 'pause' : 'play'}-fill text-4xl ml-0.5`
        }, 500)

      } catch (err) {
        console.error('PiP Error:', err)
      }
    } else {
      alert('您的浏览器不支持小窗播放功能')
    }
  }

  // if (!currentSong) return null // Don't return null, show placeholder

  if (!mounted) return null

  const hasSong = !!currentSong && !!currentSong.url

  return (
    <div className={cn(
      "fixed left-0 right-0 md:left-6 md:right-6 z-[200] perspective-[1000px] group/player px-2 pb-2 md:p-0 transition-all duration-700 ease-in-out",
      isLyricViewOpen ? "bottom-0 md:bottom-6" : "bottom-[72px] md:bottom-6",
      !hasSong ? "translate-y-[200%] opacity-0 pointer-events-none" : (
        isPlaying 
          ? "translate-y-0" 
          : "translate-y-[calc(100%-32px)] hover:translate-y-0"
      )
    )}>
      {/* Diffraction Background */}
      {currentSong && !isLyricViewOpen && (
        <div className={cn(
          "absolute inset-4 z-0 rounded-3xl opacity-40 blur-[40px] transition-all duration-1000 animate-pulse-slow pointer-events-none hidden md:block",
          !isPlaying && "opacity-0 group-hover/player:opacity-40"
        )}>
          <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url(${currentSong.pic})` }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 mix-blend-overlay"></div>
        </div>
      )}

      <div className={cn(
        "relative h-20 md:h-24 bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 flex items-center justify-between transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden",
        isLyricViewOpen 
          ? "bg-[#0a0a0b]/80 text-white ring-1 ring-white/10 border-white/5 rounded-3xl md:rounded-[2.5rem] px-4 md:px-6 w-full" 
          : "text-gray-900 dark:text-white rounded-3xl md:rounded-[2rem] w-full px-4 md:px-8 cursor-pointer"
      )}>
        <audio
          ref={audioRef}
          src={currentSong?.url || undefined}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={onEnded}
          onCanPlay={onCanPlay}
          onWaiting={onWaiting}
          onPlaying={onPlaying}
          onError={onError}
          onLoadStart={() => setIsLoading(true)}
        />

        {/* Song Info */}
        <div className={cn(
          "flex items-center gap-3 md:gap-5 flex-1 md:w-1/3 min-w-0 transition-all duration-300",
        )}>
          <div 
            className="relative group cursor-pointer shrink-0"
            onClick={() => currentSong && setIsLyricViewOpen(!isLyricViewOpen)}
          >
            <div className={cn(
              "w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl shadow-lg overflow-hidden bg-gray-100 dark:bg-white/5 flex items-center justify-center border border-white/10"
            )}>
              {currentSong ? (
                <img 
                  src={currentSong.pic} 
                  alt={currentSong.name} 
                  className={cn("w-full h-full object-cover transition-transform duration-1000", isPlaying ? "scale-100" : "scale-110 grayscale")}
                />
              ) : (
                <i className="ri-music-2-line text-gray-300 dark:text-gray-600 text-xl md:text-2xl"></i>
              )}
            </div>
            {currentSong && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl md:rounded-2xl transition-all backdrop-blur-sm">
                <i className={cn("text-white text-lg md:text-xl", isLyricViewOpen ? "ri-arrow-down-s-line" : "ri-arrow-up-s-line")}></i>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className={cn("font-bold text-sm md:text-base truncate transition-colors", isLyricViewOpen ? "text-white" : "text-gray-900 dark:text-white")}>
              {currentSong?.name || 'THW Music'}
            </h4>
            <p className={cn("text-[10px] md:text-xs font-medium truncate transition-colors", isLyricViewOpen ? "text-white/60" : "text-gray-500 dark:text-gray-400")}>
              {currentSong?.artist || '探索无限可能'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center justify-center gap-0 md:gap-1 shrink-0 z-10 mx-4">
          <div className="flex items-center gap-4 md:gap-8 mb-0 md:mb-1">
            <button onClick={prevSong} disabled={!currentSong} className={cn(
              "transition-all active:scale-90 disabled:opacity-30 hidden md:block", 
              isLyricViewOpen ? "text-white/80 hover:text-white" : "text-gray-400 hover:text-blue-600",
            )}>
              <i className="ri-skip-back-fill text-2xl"></i>
            </button>
            <button 
              onClick={() => currentSong && setIsPlaying(!isPlaying)}
              disabled={!currentSong}
              className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 shadow-xl shrink-0", 
                isLyricViewOpen 
                  ? "bg-white text-black hover:scale-105" 
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-blue-600/30"
              )}
            >
              {isLoading ? (
                <i className="ri-loader-4-line text-xl md:text-2xl animate-spin"></i>
              ) : (
                <i className={cn(isPlaying ? "ri-pause-fill" : "ri-play-fill", "text-xl md:text-2xl")}></i>
              )}
            </button>
            <button onClick={nextSong} disabled={!currentSong} className={cn(
              "transition-all active:scale-90 disabled:opacity-30", 
              isLyricViewOpen ? "text-white/80 hover:text-white" : "text-gray-400 hover:text-blue-600",
            )}>
              <i className="ri-skip-forward-fill text-xl md:text-2xl"></i>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className={cn(
            "w-full min-w-[200px] md:min-w-[400px] flex items-center gap-2 group/progress relative transition-all duration-300",
            !isLyricViewOpen && "hidden md:flex"
          )}>
            <span className={cn("text-[9px] font-black w-8 text-right tabular-nums transition-colors hidden md:block", isLyricViewOpen ? "text-white/40" : "text-gray-400 group-hover/progress:text-blue-500")}>
              {formatTime(displayTime)}
            </span>
            <div className="flex-1 relative h-3 flex items-center cursor-pointer">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={displayTime}
                onChange={handleProgressChange}
                onMouseDown={handleProgressChangeStart}
                onMouseUp={handleProgressChangeEnd}
                onTouchStart={handleProgressChangeStart}
                onTouchEnd={handleProgressChangeEnd}
                className="player-progress opacity-0 absolute inset-0 z-20 cursor-pointer"
              />
              <div className="w-full h-[2px] md:h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-100", isLyricViewOpen ? "bg-white" : "bg-gradient-to-r from-blue-400 to-blue-600")}
                  style={{ width: `${(displayTime / (duration || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            <span className={cn("text-[9px] font-black w-8 tabular-nums transition-colors hidden md:block", isLyricViewOpen ? "text-white/40" : "text-gray-400 group-hover/progress:text-blue-500")}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Extra Controls */}
        <div className={cn(
          "flex items-center justify-end gap-2 md:gap-3 flex-1 md:w-1/3 transition-opacity duration-300",
        )}>
          <button 
            onClick={() => currentSong && toggleFavorite(currentSong)}
            disabled={!currentSong}
            className={cn(
              "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30 active:scale-90",
              currentSong && isFavorite(currentSong.id) 
                ? "bg-red-500/10 text-red-500" 
                : "hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-red-500"
            )}
          >
            <i className={cn(currentSong && isFavorite(currentSong.id) ? "ri-heart-fill" : "ri-heart-line", "text-lg md:text-xl")}></i>
          </button>
          
          <button 
            onClick={togglePiP}
            disabled={!currentSong}
            className="w-10 h-10 rounded-full hidden md:flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-blue-600 transition-all disabled:opacity-30 active:scale-90"
            title="画中画模式"
          >
             <i className="ri-picture-in-picture-2-line text-xl"></i>
          </button>

          <button 
            onClick={() => currentSong && setIsLyricViewOpen(!isLyricViewOpen)}
            disabled={!currentSong}
            className={cn(
              "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30 active:scale-90",
              isLyricViewOpen 
                ? "bg-white/20 text-white" 
                : "hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-blue-600"
            )}
          >
            <i className="ri-article-line text-lg md:text-xl"></i>
          </button>
        </div>
      </div>
    </div>
  )

}
