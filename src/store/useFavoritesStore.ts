import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Song } from '@/types'
import { useAuthStore } from './useAuthStore'

interface FavoritesState {
  favorites: Set<string>;
  favoriteSongs: Song[];
  isLoading: boolean;
  
  // Actions
  loadFavorites: () => Promise<void>;
  toggleFavorite: (song: Song) => Promise<void>;
  isFavorite: (songId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: new Set(),
  favoriteSongs: [],
  isLoading: false,

  isFavorite: (songId) => get().favorites.has(String(songId)),

  loadFavorites: async () => {
    const user = useAuthStore.getState().user
    if (!user) {
      set({ favorites: new Set(), favoriteSongs: [] })
      return
    }

    set({ isLoading: true })
    try {
      console.log('Loading favorites for user:', user.id)
      const { data, error } = await supabase
        .from('app_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase fetch favorites error:', error)
        throw error
      }

      console.log('Fetched favorites data:', data?.length, 'items')

      const favoriteIds = new Set(data.map(item => String(item.song_id)))
      const favoriteSongs = data.map(item => {
        try {
          const song = typeof item.song_data === 'string' ? JSON.parse(item.song_data) : item.song_data
          if (!song) return null
          
          return {
            ...song,
            id: song.id || item.song_id,
            name: song.name || song.title || '未知歌曲',
            artist: song.artist || song.author || '未知歌手',
            pic: song.pic || song.cover || song.img || ''
          } as Song
        } catch (e) {
          console.error('Failed to parse song_data:', e, item.song_data)
          return null
        }
      }).filter((s): s is Song => s !== null)
      
      console.log('Processed favorite songs:', favoriteSongs.length)
      set({ favorites: favoriteIds, favoriteSongs })
    } catch (err) {
      console.error('Failed to load favorites:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  toggleFavorite: async (song) => {
    const user = useAuthStore.getState().user
    if (!user) {
      useAuthStore.getState().setLoginModalOpen(true)
      return
    }

    const songId = String(song.id)
    const isFav = get().favorites.has(songId)

    try {
      if (isFav) {
        const { error } = await supabase
          .from('app_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('song_id', songId)
        
        if (error) throw error

        const newFavorites = new Set(get().favorites)
        newFavorites.delete(songId)
        set({ 
          favorites: newFavorites,
          favoriteSongs: get().favoriteSongs.filter(s => String(s.id) !== songId)
        })
      } else {
        const { error } = await supabase
          .from('app_favorites')
          .insert([{
            user_id: user.id,
            song_id: songId,
            song_data: song
          }])
        
        if (error) throw error

        const newFavorites = new Set(get().favorites)
        newFavorites.add(songId)
        set({ 
          favorites: newFavorites,
          favoriteSongs: [song, ...get().favoriteSongs]
        })
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }
}))
