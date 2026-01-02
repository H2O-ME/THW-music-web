import { create } from 'zustand'

interface UIState {
  isSidebarOpen: boolean
  currentView: 'home' | 'playlists' | 'favorites' | 'search'
  searchQuery: string
  selectedPlaylist: any | null
  
  // Actions
  setSidebarOpen: (isOpen: boolean) => void
  setCurrentView: (view: UIState['currentView']) => void
  setSearchQuery: (query: string) => void
  setSelectedPlaylist: (playlist: any | null) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  currentView: 'home',
  searchQuery: '',
  selectedPlaylist: null,

  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setCurrentView: (currentView) => set((state) => ({ 
    currentView, 
    selectedPlaylist: currentView === 'playlists' ? state.selectedPlaylist : null,
    searchQuery: currentView === 'search' ? state.searchQuery : '' 
  })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedPlaylist: (selectedPlaylist) => set({ selectedPlaylist }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}))
