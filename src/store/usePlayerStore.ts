import { create } from 'zustand'
import { Song, LyricLine } from '@/types'

interface PlayerState {
  playlist: Song[]
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
  
  // Helpers
  nextSong: () => void
  prevSong: () => void
  playSong: (song: Song) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  playlist: [],
  currentSongIndex: -1,
  isPlaying: false,
  volume: 0.7,
  currentTime: 0,
  duration: 0,
  lyrics: [],
  currentLyricIndex: -1,
  isLyricViewOpen: false,

  setPlaylist: (playlist) => set({ playlist }),
  setCurrentSongIndex: (currentSongIndex) => set({ currentSongIndex }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setLyrics: (lyrics) => set({ lyrics }),
  setCurrentLyricIndex: (currentLyricIndex) => set({ currentLyricIndex }),
  setIsLyricViewOpen: (isLyricViewOpen) => set({ isLyricViewOpen }),

  nextSong: () => {
    const { playlist, currentSongIndex } = get()
    if (playlist.length === 0) return
    const nextIndex = (currentSongIndex + 1) % playlist.length
    set({ currentSongIndex: nextIndex, isPlaying: true })
  },

  prevSong: () => {
    const { playlist, currentSongIndex } = get()
    if (playlist.length === 0) return
    const prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length
    set({ currentSongIndex: prevIndex, isPlaying: true })
  },

  playSong: (song) => {
    const { playlist } = get()
    const index = playlist.findIndex(s => s.id === song.id)
    if (index !== -1) {
      set({ currentSongIndex: index, isPlaying: true })
    } else {
      set({ playlist: [song, ...playlist], currentSongIndex: 0, isPlaying: true })
    }
  }
}))
