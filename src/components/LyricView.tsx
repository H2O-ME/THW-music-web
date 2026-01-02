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
    setLyrics,
    currentLyricIndex,
    setCurrentLyricIndex,
    isLyricViewOpen,
    setIsLyricViewOpen
  } = usePlayerStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentSong = playlist[currentSongIndex]
  const containerRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

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
      setLyrics([])
      return
    }

    const fetchLyrics = async () => {
      try {
        const res = await fetch(currentSong.lrc)
        const text = await res.text()
        const lines = text.split('\n')
        const parsedLyrics = lines
          .map(line => {
            const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/)
            if (match) {
              const mins = parseInt(match[1])
              const secs = parseFloat(match[2])
              return {
                time: mins * 60 + secs,
                text: match[3].trim()
              }
            }
            return null
          })
          .filter((line): line is { time: number; text: string } => line !== null && line.text !== '')
        
        setLyrics(parsedLyrics)
      } catch (err) {
        console.error('Failed to fetch lyrics:', err)
        setLyrics([])
      }
    }

    fetchLyrics()
  }, [currentSong?.lrc, setLyrics, mounted])

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
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      {/* Background Blur */}
      {currentSong && (
        <div ref={bgRef} className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src={currentSong.pic} 
            alt="" 
            className="w-full h-full object-cover opacity-50 blur-[100px] scale-125 transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl" />
        </div>
      )}

      {/* Exit Button - Top Left */}
      <button 
        onClick={() => setIsLyricViewOpen(false)}
        className="absolute top-6 left-6 md:top-8 md:left-8 text-white/50 hover:text-white p-2 md:p-3 rounded-full hover:bg-white/10 transition-all z-20 flex items-center gap-2 group"
      >
        <i className="ri-arrow-down-s-line text-2xl md:text-3xl group-hover:translate-y-1 transition-transform"></i>
      </button>

      <div ref={contentRef} className="flex-1 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 p-6 md:p-16 overflow-hidden z-10 w-full max-w-[1600px] mx-auto">
        {/* Mobile: Top Song Info */}
        <div className="md:hidden w-full pt-16 pb-4 text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight drop-shadow-lg line-clamp-1 px-8">{currentSong?.name}</h2>
          <p className="text-base text-white/60 font-medium tracking-wide drop-shadow-md">{currentSong?.artist}</p>
        </div>

        {/* Left Side: Cover Art (Desktop) */}
        <div className="hidden md:flex flex-col items-center justify-center w-[45%] h-full animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="relative group w-[50vh] h-[50vh] max-w-[500px] max-h-[500px]">
            <div className="absolute -inset-8 bg-white/5 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <img 
              src={currentSong?.pic} 
              alt={currentSong?.name} 
              className="w-full h-full rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] object-cover relative z-10 border border-white/10"
            />
          </div>
          <div className="mt-12 text-center relative z-10 w-full px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight drop-shadow-lg line-clamp-2">{currentSong?.name}</h2>
            <p className="text-xl text-white/60 font-medium tracking-wide drop-shadow-md">{currentSong?.artist}</p>
          </div>
        </div>

        {/* Right Side: Lyrics */}
        <div 
          ref={containerRef}
          className="relative flex-1 w-full md:w-[55%] h-full overflow-y-auto no-scrollbar mask-image-gradient-bottom py-[40vh] md:py-[50vh] text-center md:text-left px-4 md:px-12"
        >
          {lyrics.length > 0 ? (
            <div className="space-y-8 md:space-y-10">
              {lyrics.map((line, index) => (
                <div
                  key={`${line.time}-${index}`}
                  className={cn(
                    "lyric-line text-xl md:text-4xl font-bold transition-all duration-500 ease-out origin-center md:origin-left cursor-pointer px-4",
                    index === currentLyricIndex 
                      ? "text-white opacity-100 scale-110 md:scale-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]" 
                      : "text-white/40 opacity-50 scale-95 blur-[0.5px] hover:text-white/70 hover:opacity-80"
                  )}
                  onClick={() => {
                    // Seek to lyric time
                    const player = document.querySelector('audio');
                    if (player) {
                      player.currentTime = line.time;
                    }
                  }}
                >
                  {line.text}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/30 text-xl md:text-2xl font-medium animate-pulse">
              <p>{currentSong ? '纯音乐 / 暂无歌词' : '暂无播放内容'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
