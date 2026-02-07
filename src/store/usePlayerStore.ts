import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Song, LyricLine } from '@/types'

interface PlayerState {
  playlist: Song[]
  history: Song[]
  currentSongIndex: number
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  lyrics: LyricLine[]
  currentLyricIndex: number
  isLyricViewOpen: boolean
  
  // Actions
  setPlaylist: (playlist: Song[]) => void
  setCurrentSongIndex: (index: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setLyrics: (lyrics: LyricLine[]) => void
  setCurrentLyricIndex: (index: number) => void
  setIsLyricViewOpen: (isOpen: boolean) => void
  addToHistory: (song: Song) => void
  clearHistory: () => void
  fetchLyrics: (lrcUrl: string) => Promise<void>
  
  // Helpers
  nextSong: () => void
  prevSong: () => void
  playSong: (song: Song) => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      playlist: [],
      history: [],
      currentSongIndex: -1,
      isPlaying: false,
      volume: 0.7,
      currentTime: 0,
      duration: 0,
      lyrics: [],
      currentLyricIndex: -1,
      isLyricViewOpen: false,

      setPlaylist: (playlist) => set({ playlist }),
      setCurrentSongIndex: (currentSongIndex) => {
        set({ currentSongIndex })
        const song = get().playlist[currentSongIndex]
        if (song) get().addToHistory(song)
      },
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setVolume: (volume) => set({ volume }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      setDuration: (duration) => set({ duration }),
      setLyrics: (lyrics) => set({ lyrics }),
      setCurrentLyricIndex: (currentLyricIndex) => set({ currentLyricIndex }),
      setIsLyricViewOpen: (isLyricViewOpen) => set({ isLyricViewOpen }),

      addToHistory: (song) => {
        const { history } = get()
        const newHistory = [song, ...history.filter(s => s.id !== song.id)].slice(0, 50)
        set({ history: newHistory })
      },

      clearHistory: () => set({ history: [] }),

      fetchLyrics: async (lrcUrl) => {
        if (!lrcUrl) {
          set({ lyrics: [] })
          return
        }
        try {
          const res = await fetch(lrcUrl)
          const text = await res.text()
          const lines = text.split('\n')
          const parsedLyrics = lines
            .map(line => {
              const match = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/)
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
            .filter((line): line is LyricLine => line !== null && line.text !== '')
          set({ lyrics: parsedLyrics })
        } catch (err) {
          console.error('Fetch lyrics error:', err)
          set({ lyrics: [] })
        }
      },

      nextSong: () => {
        const { playlist, currentSongIndex } = get()
        if (playlist.length === 0) return
        const nextIndex = (currentSongIndex + 1) % playlist.length
        set({ currentSongIndex: nextIndex, isPlaying: true })
        
        const song = playlist[nextIndex]
        if (song) get().addToHistory(song)
      },

      prevSong: () => {
        const { playlist, currentSongIndex } = get()
        if (playlist.length === 0) return
        const prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length
        set({ currentSongIndex: prevIndex, isPlaying: true })
        
        const song = playlist[prevIndex]
        if (song) get().addToHistory(song)
      },

      playSong: (song) => {
        const { playlist } = get()
        const index = playlist.findIndex(s => s.id === song.id)
        if (index !== -1) {
          set({ currentSongIndex: index, isPlaying: true })
        } else {
          set({ playlist: [song, ...playlist], currentSongIndex: 0, isPlaying: true })
        }
        get().addToHistory(song)
      }
    }),
    {
      name: 'thw-music-player-storage',
      partialize: (state) => ({ 
        volume: state.volume, 
        history: state.history,
        playlist: state.playlist,
        currentSongIndex: state.currentSongIndex 
      }),
    }
  )
)
