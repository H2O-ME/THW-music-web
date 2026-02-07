'use client'

import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '@/store/usePlayerStore'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { gsap } from 'gsap'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function LyricView() {
  const [mounted, setMounted] = useState(false)
  const {
    playlist,
    currentSongIndex,
    currentTime,
    lyrics,
    fetchLyrics,
    currentLyricIndex,
    setCurrentLyricIndex,
    isLyricViewOpen,
    setIsLyricViewOpen,
    isPlaying,
    setIsPlaying,
    nextSong,
    prevSong,
    duration,
    setCurrentTime
  } = usePlayerStore()

  const [localTime, setLocalTime] = useState(currentTime)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!isDragging) {
      setLocalTime(currentTime)
    }
  }, [currentTime, isDragging])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setLocalTime(val)
  }

  const handleSeekEnd = () => {
    const audio = document.querySelector('audio')
    if (audio) {
      audio.currentTime = localTime
      setCurrentTime(localTime)
    }
    setIsDragging(false)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentSong = playlist[currentSongIndex]
  const containerRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (isLyricViewOpen && mounted) {
      const ctx = gsap.context(() => {
        gsap.fromTo(bgRef.current, 
          { opacity: 0, scale: 1.1 },
          { opacity: 1, scale: 1, duration: 1, ease: "power2.out" }
        )
        gsap.fromTo(contentRef.current,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power3.out" }
        )
      })
      return () => ctx.revert()
    }
  }, [isLyricViewOpen, mounted])

  useEffect(() => {
    if (!currentSong?.lrc || !mounted) {
      usePlayerStore.setState({ lyrics: [] })
      return
    }

    fetchLyrics(currentSong.lrc)
  }, [currentSong?.lrc, fetchLyrics, mounted])

  useEffect(() => {
    if (!mounted) return

    const index = lyrics.findIndex((line, i) => {
      const nextLine = lyrics[i + 1]
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time)
    })

    if (index !== -1 && index !== currentLyricIndex) {
      setCurrentLyricIndex(index)
    }
  }, [currentTime, lyrics, currentLyricIndex, setCurrentLyricIndex, mounted])

  useEffect(() => {
    if (currentLyricIndex !== -1 && containerRef.current && mounted) {
      const lyricsContainer = containerRef.current.firstElementChild
      const activeLine = lyricsContainer?.children[currentLyricIndex] as HTMLElement
      
      if (activeLine) {
        const containerHeight = containerRef.current.clientHeight
        const offset = activeLine.offsetTop - containerHeight / 2 + activeLine.clientHeight / 2
        
        gsap.to(containerRef.current, {
          scrollTop: offset,
          duration: 0.8,
          ease: "power3.out"
        })
      }
    }
  }, [currentLyricIndex, mounted])

  if (!mounted || !isLyricViewOpen) return null

  return (
    <div className="fixed inset-0 z-[300] bg-[#1a1625] flex flex-col overflow-hidden animate-in fade-in duration-700">
      {/* Immersive Background */}
      {currentSong && (
        <div ref={bgRef} className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 opacity-[0.4] blur-[100px] scale-150 transition-all duration-1000"
            style={{ 
              backgroundImage: `url(${currentSong.pic})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a0c] via-transparent to-[#1a1625]/30 opacity-80" />
          <div className="absolute inset-0 bg-[#0a0a0c]/40 backdrop-blur-3xl" />
        </div>
      )}

      {/* macOS Title Bar Controls */}
      <div className="absolute top-4 left-6 md:top-8 md:left-8 z-50 flex items-center gap-2 group cursor-default">
        <div 
          onClick={() => setIsLyricViewOpen(false)}
          className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-[#ff5f57] border border-black/5 flex items-center justify-center text-[8px] md:text-[10px] text-black/40"
        >
          <i className="ri-close-fill opacity-0 group-hover:opacity-100"></i>
        </div>
        <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-[#febc2e] border border-black/5"></div>
        <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-[#28c840] border border-black/5"></div>
      </div>

      {/* Pull Down Button */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1">
        <button 
          onClick={() => setIsLyricViewOpen(false)}
          className="w-10 h-6 flex items-center justify-center text-white/20 hover:text-white transition-all active:translate-y-1"
        >
          <i className="ri-arrow-down-s-line text-2xl md:text-3xl"></i>
        </button>
      </div>

      <div ref={contentRef} className="flex-1 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 lg:gap-32 p-6 md:p-12 lg:p-16 overflow-hidden z-20 w-full max-w-[1600px] mx-auto h-full px-8 md:px-12 md:pl-32 lg:pl-48">
        {/* Left Side: Cover Art & Built-in Player */}
        <div className="flex flex-col items-center md:items-start justify-center w-full md:w-[300px] lg:w-[380px] shrink-0 h-full max-h-[85vh] py-4 md:py-8">
          <div className="relative w-40 md:w-full aspect-square group mb-6 md:mb-10 flex-shrink min-h-0 max-h-[35vh]">
            <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full opacity-30"></div>
            <img 
              src={currentSong?.pic} 
              alt={currentSong?.name} 
              className="w-full h-full rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.5)] object-cover relative z-10 border border-white/10"
            />
          </div>
          
          {/* Song Info & Controller */}
          <div className="w-full text-center md:text-left shrink-0">
            <div className="mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl lg:text-2xl font-black text-white mb-1.5 tracking-tight line-clamp-2 leading-tight uppercase">{currentSong?.name}</h2>
              <div className="flex items-center justify-center md:justify-start gap-2 text-white/40 font-bold tracking-wider text-[10px] md:text-xs uppercase">
                <span className="truncate max-w-[120px]">{currentSong?.artist}</span>
                <span className="opacity-30">•</span>
                <span className="truncate max-w-[120px] opacity-60">{currentSong?.album || 'Single'}</span>
              </div>
            </div>

            {/* Built-in Player Bar */}
            <div className="w-full space-y-4 md:space-y-5 px-2 md:px-0">
              <div className="relative h-4 flex items-center group/progress">
                <input 
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={isDragging ? localTime : currentTime}
                  onChange={handleSeek}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={handleSeekEnd}
                  className="player-progress absolute inset-0 w-full z-20 opacity-0 cursor-pointer"
                />
                <div className="w-full h-[2.5px] bg-white/10 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute left-0 top-0 h-full bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                    style={{ width: `${((isDragging ? localTime : currentTime) / (duration || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between text-[9px] font-black text-white/20 uppercase tracking-[0.2em] tabular-nums -mt-2">
                <span>{formatTime(isDragging ? localTime : currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              <div className="flex items-center justify-between px-1">
                <button className="text-white/20 hover:text-white transition-colors active:scale-95"><i className="ri-repeat-2-line text-base"></i></button>
                <div className="flex items-center gap-6 md:gap-8 lg:gap-10">
                  <button onClick={prevSong} className="text-white/40 hover:text-white transition-all active:scale-75"><i className="ri-skip-back-fill text-xl md:text-2xl"></i></button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 md:w-14 md:h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-90 transition-all shadow-xl"
                  >
                    <i className={cn(isPlaying ? "ri-pause-fill" : "ri-play-fill", "text-2xl md:text-3xl")}></i>
                  </button>
                  <button onClick={nextSong} className="text-white/40 hover:text-white transition-all active:scale-75"><i className="ri-skip-forward-fill text-xl md:text-2xl"></i></button>
                </div>
                <button className="text-white/20 hover:text-white transition-colors active:scale-95"><i className="ri-shuffle-line text-base"></i></button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Lyrics Scrolling */}
        <div 
          ref={containerRef}
          className="relative hidden md:block flex-1 w-full h-[80vh] overflow-y-auto no-scrollbar py-[40vh] text-center md:text-left md:px-12 lg:px-20 mask-image-gradient-vertical will-change-scroll transform-gpu"
        >
          {lyrics.length > 0 ? (
            <div className="space-y-6 md:space-y-8 lg:space-y-10 backface-hidden">
              {lyrics.map((line, index) => (
                <div
                  key={`${line.time}-${index}`}
                  className={cn(
                    "lyric-line text-lg md:text-xl lg:text-3xl font-black transition-all duration-700 ease-out origin-center md:origin-left cursor-pointer tracking-tight leading-tight",
                    index === currentLyricIndex 
                      ? "text-white opacity-100 scale-105 translate-x-4 drop-shadow-[0_10px_40px_rgba(255,255,255,0.2)]" 
                      : "text-white/30 opacity-30 scale-95 blur-[1px] hover:text-white/60 hover:opacity-100 hover:blur-0"
                  )}
                  onClick={() => {
                    const audio = document.querySelector('audio')
                    if (audio) audio.currentTime = line.time
                  }}
                >
                  {line.text}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/20 text-xl font-black uppercase tracking-widest italic pt-10">
              <p>{currentSong ? 'Pure Music / No Lyrics' : 'Nothing Playing'}</p>
            </div>
          )}
        </div>

        {/* Mobile Mobile Lyric Hint */}
        <div className="md:hidden w-full text-center mt-auto pb-8">
          <p className="text-white/20 text-[10px] font-black uppercase tracking-widest animate-pulse">
            {lyrics.length > 0 ? '滑动查看歌词' : '纯音乐，请欣赏'}
          </p>
        </div>
      </div>
    </div>
  )
}

