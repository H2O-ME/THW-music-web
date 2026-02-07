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
        
        // Main Content
        const content = pipWindow.document.createElement('div')
        content.className = 'relative z-10 w-full flex flex-col items-center'
        
        // Helper for inner HTML to avoid repetition
        const renderPiPContent = (s: any, lyric: string) => `
          <div class="absolute inset-0 z-0">
            <div class="absolute inset-0 bg-cover bg-center opacity-40 blur-[80px] scale-150 transition-all duration-1000" style="background-image: url('${currentSong.pic}')"></div>
            <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#0a0a0b]"></div>
          </div>
          <div class="relative z-10 w-full flex flex-col items-center">
            <div class="relative w-44 h-44 mb-10 group mt-4">
              <div class="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-110 opacity-50"></div>
              <img src="${currentSong.pic}" class="relative w-full h-full rounded-[2.5rem] object-cover shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-white/10" />
            </div>

            <div class="w-full mb-10 px-2 text-center">
              <h2 class="text-2xl font-black mb-2 truncate drop-shadow-lg tracking-tight">${currentSong.name}</h2>
              <p class="text-white/40 text-sm font-bold tracking-widest uppercase truncate">${currentSong.artist}</p>
            </div>
            
            <div class="w-full mb-10 min-h-[4rem] flex items-center justify-center">
              <p id="pip-lyric" class="text-lg font-bold text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] line-clamp-2 leading-tight px-4 transition-all duration-300">
                ${lyric}
              </p>
            </div>

            <div class="w-full px-2 mb-10">
              <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                <div id="pip-progress" class="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style="width: ${(s.currentTime / (s.duration || 1)) * 100}%"></div>
              </div>
              <div class="flex justify-between mt-3 text-[10px] font-black text-white/20 tracking-tighter uppercase">
                <span id="pip-current-time">${formatTime(s.currentTime)}</span>
                <span id="pip-duration">${formatTime(s.duration)}</span>
              </div>
            </div>

            <div class="flex items-center gap-10">
              <button id="pip-prev" class="p-2 text-white/40 hover:text-white transition-all active:scale-90"><i class="ri-skip-back-fill text-3xl"></i></button>
              <button id="pip-play" class="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)]">
                <i class="ri-${s.isPlaying ? 'pause' : 'play'}-fill text-4xl ml-0.5"></i>
              </button>
              <button id="pip-next" class="p-2 text-white/40 hover:text-white transition-all active:scale-90"><i class="ri-skip-forward-fill text-3xl"></i></button>
            </div>
          </div>
        `

        container.innerHTML = renderPiPContent(state, currentLyric)
        pipWindow.document.body.appendChild(container)

        // Events
        const setupEvents = () => {
          const playBtn = pipWindow.document.getElementById('pip-play')
          const prevBtn = pipWindow.document.getElementById('pip-prev')
          const nextBtn = pipWindow.document.getElementById('pip-next')

          if (playBtn) playBtn.onclick = () => {
            const s = usePlayerStore.getState()
            setIsPlaying(!s.isPlaying)
          }
          if (prevBtn) prevBtn.onclick = () => prevSong()
          if (nextBtn) nextBtn.onclick = () => nextSong()
        }

        setupEvents()

        // Sync
        let lastSongId = currentSong.id
        const updateTimer = setInterval(() => {
          if (pipWindow.closed) {
            clearInterval(updateTimer)
            return
          }
          
          const s = usePlayerStore.getState()
          const currentS = s.playlist[s.currentSongIndex]

          // If song changed, re-render everything
          if (currentS && currentS.id !== lastSongId) {
            lastSongId = currentS.id
            const currentLyricText = lyrics[s.currentLyricIndex]?.text || 'THW Music'
            container.innerHTML = renderPiPContent(s, currentLyricText)
            setupEvents()
            return
          }
          
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
            lyricEl.innerText = currentLyricText
          }

          // Play/Pause Icon
          const playBtnIcon = pipWindow.document.querySelector('#pip-play i')
          if (playBtnIcon) playBtnIcon.className = `ri-${s.isPlaying ? 'pause' : 'play'}-fill text-4xl ml-0.5`
        }, 200)

      } catch (err) {
        console.error('PiP Error:', err)
      }
    } else {
      alert('您的浏览器不支持画中画控制窗口，请使用最新版 Chrome 或 Edge')
    }
  }

  // if (!currentSong) return null // Don't return null, show placeholder

  if (!mounted) return null

  const hasSong = !!currentSong && !!currentSong.url

  return (
    <div className={cn(
      "fixed left-0 right-0 md:left-[280px] md:right-8 z-[200] transition-all duration-700 ease-in-out",
      isLyricViewOpen 
        ? "bottom-[-100px] opacity-0 pointer-events-none" 
        : "bottom-[70px] md:bottom-6",
      !hasSong ? "translate-y-[200%] opacity-0 pointer-events-none" : "translate-y-0"
    )}>
      <div className={cn(
        "relative h-16 md:h-20 flex items-center justify-between transition-all duration-500 overflow-hidden",
        isLyricViewOpen 
          ? "bg-[#1a1a1c]/80 text-white border-white/5 rounded-[2.5rem] px-4 md:px-8 w-full backdrop-blur-3xl shadow-2xl" 
          : "bg-white/90 dark:bg-[#0a0a0b]/90 backdrop-blur-2xl border border-white/40 dark:border-white/5 text-gray-900 dark:text-white rounded-[2rem] md:rounded-[2.5rem] w-full px-4 md:px-6 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]"
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
        <div className="flex items-center gap-3.5 flex-1 md:w-1/3 min-w-0">
          <div 
            className="relative group cursor-pointer shrink-0"
            onClick={() => currentSong && setIsLyricViewOpen(!isLyricViewOpen)}
          >
            <div className={cn(
              "w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-md overflow-hidden bg-gray-100 dark:bg-white/5 border border-white/10"
            )}>
              {currentSong ? (
                <img 
                  src={currentSong.pic} 
                  alt={currentSong.name} 
                  className={cn("w-full h-full object-cover transition-all duration-700", isPlaying ? "scale-100 rotate-0" : "scale-110 grayscale")}
                />
              ) : (
                <i className="ri-music-2-line text-gray-300 dark:text-gray-600 text-lg md:text-xl"></i>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-xs md:text-sm truncate leading-tight">
              {currentSong?.name || 'THW Music'}
            </h4>
            <p className="text-[9px] md:text-[10px] font-bold opacity-40 truncate mt-0.5 uppercase tracking-wider">
              {currentSong?.artist || '探索无限可能'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center justify-center gap-0.5 shrink-0 z-10 mx-2 md:mx-4">
          <div className="flex items-center gap-4 md:gap-7">
            <button onClick={prevSong} disabled={!currentSong} className="transition-all active:scale-90 disabled:opacity-30 hidden md:block text-gray-400 hover:text-blue-600">
              <i className="ri-skip-back-fill text-xl md:text-2xl"></i>
            </button>
            <button 
              onClick={() => currentSong && setIsPlaying(!isPlaying)}
              disabled={!currentSong}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 shadow-lg shrink-0", 
                isLyricViewOpen 
                  ? "bg-white text-black" 
                  : "bg-blue-600 text-white shadow-blue-600/20"
              )}
            >
              {isLoading ? (
                <i className="ri-loader-4-line text-xl animate-spin"></i>
              ) : (
                <i className={cn(isPlaying ? "ri-pause-fill" : "ri-play-fill", "text-xl")}></i>
              )}
            </button>
            <button onClick={nextSong} disabled={!currentSong} className="transition-all active:scale-90 disabled:opacity-30 text-gray-400 hover:text-blue-600">
              <i className="ri-skip-forward-fill text-xl md:text-2xl"></i>
            </button>
          </div>
          
          {/* Progress Bar (Desktop only in player bar) */}
          <div className="hidden md:flex w-[200px] lg:w-[320px] items-center gap-3 group/progress relative">
            <span className="text-[9px] font-black w-8 text-right opacity-30 tabular-nums">
              {formatTime(displayTime)}
            </span>
            <div className="flex-1 relative h-4 flex items-center cursor-pointer">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={displayTime}
                onChange={handleProgressChange}
                onMouseDown={handleProgressChangeStart}
                onMouseUp={handleProgressChangeEnd}
                className="player-progress opacity-0 absolute inset-0 z-20 cursor-pointer w-full"
              />
              <div className="w-full h-[3px] bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden relative">
                <div 
                  className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-100", isLyricViewOpen ? "bg-white" : "bg-blue-600")}
                  style={{ width: `${(displayTime / (duration || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            <span className="text-[9px] font-black w-8 opacity-30 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Extra Controls */}
        <div className="flex items-center justify-end gap-0.5 md:gap-1.5 flex-1 md:w-1/3">
          <button 
            onClick={() => currentSong && toggleFavorite(currentSong)}
            disabled={!currentSong}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30 active:scale-90",
              currentSong && isFavorite(currentSong.id) 
                ? "text-red-500" 
                : "text-gray-400 hover:text-red-500"
            )}
          >
            <i className={cn(currentSong && isFavorite(currentSong.id) ? "ri-heart-fill" : "ri-heart-line", "text-lg")}></i>
          </button>
          
          <button 
            onClick={togglePiP}
            disabled={!currentSong}
            className="w-9 h-9 rounded-full hidden md:flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all disabled:opacity-30"
          >
             <i className="ri-picture-in-picture-2-line text-lg"></i>
          </button>

          <button 
            onClick={() => currentSong && setIsLyricViewOpen(!isLyricViewOpen)}
            disabled={!currentSong}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30 active:scale-90",
              isLyricViewOpen 
                ? "bg-white/10 text-white" 
                : "text-gray-400 hover:text-blue-600"
            )}
          >
            <i className="ri-article-line text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  )


}
