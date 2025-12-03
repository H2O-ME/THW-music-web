import { supabase } from './supabase.js';
import { AuthManager } from './auth.js';
import { Toast } from './utils.js';
import { player } from './player.js';
import { SearchManager } from './search.js';
import { state } from './state.js';
import { UIManager } from './ui.js';

export class FavoritesManager {
    static favorites = new Set(); // Store song IDs

    static init() {
        this.btnFavorite = document.getElementById('btn-favorite');
        this.navBtn = document.getElementById('nav-favorites');
        
        if (this.btnFavorite) {
            this.btnFavorite.addEventListener('click', () => this.toggleFavorite());
        }

        if (this.navBtn) {
            this.navBtn.addEventListener('click', () => this.showFavoritesPage());
        }

        // Listen for auth changes
        document.addEventListener('auth:login', () => this.loadFavorites());
        document.addEventListener('auth:logout', () => {
            this.favorites.clear();
            this.updateIcon(player.currentSong ? player.currentSong.id : null);
        });
        
        // Listen for song changes to update the heart icon
        document.addEventListener('player:songchange', (e) => {
            // Pass the song ID explicitly if available in the event
            const song = e.detail;
            let id = song.id || song.song_id || song.songid || song.mid;
            if (!id && song.url) {
                const match = song.url.match(/[?&]id=(\d+)/);
                if (match) id = match[1];
            }
            this.updateIcon(id);
        });

        // Handle custom events from list view
        document.addEventListener('req:toggle-favorite', async (e) => {
            const song = e.detail;
            // We need to temporarily set current song or refactor toggleFavorite to accept song
            // Refactoring toggleFavorite is better but risky if I break existing calls.
            // Let's overload toggleFavorite to accept optional song.
            await this.toggleFavorite(song);
            
            // If we are on favorites page, we might want to reload the list
            // Check if favorites nav is active
            if (this.navBtn && this.navBtn.classList.contains('bg-white')) {
                this.showFavoritesPage();
            } else {
                // If on search page, update the specific row button
                // We can dispatch an event to update UI or just re-render?
                // Re-rendering search results is expensive.
                // Let's just update the button state in the DOM if possible.
                // Actually, toggleFavorite calls updateIcon which updates the player bar.
                // We also need to update the list row icon.
                this.updateListIcons();
            }
        });

        document.addEventListener('req:check-favorites', () => {
            this.updateListIcons();
        });

        // Check if already logged in (in case we missed the event)
        if (AuthManager.getCurrentUser()) {
            this.loadFavorites();
        }
    }

    static updateListIcons() {
        const buttons = document.querySelectorAll('.btn-fav-row');
        buttons.forEach(btn => {
            const id = btn.dataset.id;
            // Reset state
            btn.classList.remove('pointer-events-none');
            
            if (this.favorites.has(String(id))) {
                btn.innerHTML = '<i class="ri-heart-fill text-lg"></i>';
                btn.classList.add('text-red-500');
                btn.classList.remove('text-gray-400');
            } else {
                btn.innerHTML = '<i class="ri-heart-line text-lg"></i>';
                btn.classList.remove('text-red-500');
                btn.classList.add('text-gray-400');
            }
        });
    }

    static async loadFavorites() {
        const user = AuthManager.getCurrentUser();
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('app_favorites')
                .select('song_id')
                .eq('user_id', user.id);

            if (error) throw error;

            this.favorites.clear();
            data.forEach(item => this.favorites.add(String(item.song_id)));
            
            // Update current icon if song is playing
            if (player.currentSong) {
                this.updateIcon(player.currentSong.id);
            }

            // Update list icons to reflect loaded favorites
            this.updateListIcons();
        } catch (error) {
            console.error('Failed to load favorites:', error);
        }
    }

    static async addFavorite(song) {
        const user = AuthManager.getCurrentUser();
        if (!user) throw new Error('Not logged in');

        let rawId = song.id || song.song_id || song.songid || song.mid;
        if (!rawId && song.url) {
            const match = song.url.match(/[?&]id=(\d+)/);
            if (match) rawId = match[1];
        }

        if (rawId === undefined || rawId === null || rawId === '') throw new Error('Invalid ID');

        const songId = String(rawId);
        if (this.favorites.has(songId)) return; // Already favorite

        const { error } = await supabase
            .from('app_favorites')
            .insert([{
                user_id: user.id,
                song_id: songId,
                song_data: song
            }]);

        if (error) {
            if (error.code === '23505') {
                this.favorites.add(songId);
                return;
            }
            throw error;
        }
        this.favorites.add(songId);
    }

    static async toggleFavorite(targetSong = null) {
        const user = AuthManager.getCurrentUser();
        if (!user) {
            Toast.show('请先登录', 'error');
            return;
        }

        const song = targetSong || player.currentSong;
        if (!song) return;

        // Robust ID check
        let rawId = song.id || song.song_id || song.songid || song.mid;
        
        // Try to extract from URL if missing (Meting API sometimes omits ID in search results)
        if (!rawId && song.url) {
            const match = song.url.match(/[?&]id=(\d+)/);
            if (match) rawId = match[1];
        }

        if (rawId === undefined || rawId === null || rawId === '') {
            console.error('Song object missing ID:', song);
            Toast.show('无法收藏：歌曲ID无效', 'error');
            return;
        }

        const songId = String(rawId); // Ensure ID is string
        const isFav = this.favorites.has(songId);

        // Loading State
        const btn = this.btnFavorite;
        const originalIcon = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="ri-loader-4-line animate-spin text-xl md:text-lg"></i>';
        }

        try {
            if (isFav) {
                // Remove
                const { error } = await supabase
                    .from('app_favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('song_id', songId);
                
                if (error) throw error;
                
                this.favorites.delete(songId);
                Toast.show('已取消收藏', 'success');
            } else {
                // Add
                const { error } = await supabase
                    .from('app_favorites')
                    .insert([{
                        user_id: user.id,
                        song_id: songId,
                        song_data: song
                    }]);

                if (error) {
                    // Handle duplicate key error gracefully (in case local state was out of sync)
                    if (error.code === '23505') {
                        this.favorites.add(songId);
                        this.updateIcon(songId);
                        this.updateListIcons();
                        Toast.show('已收藏', 'success');
                        return;
                    }
                    throw error;
                }

                this.favorites.add(songId);
                Toast.show('已收藏', 'success');
            }
            this.updateIcon(songId);
            this.updateListIcons();
        } catch (error) {
            console.error('Favorite operation failed:', error);
            Toast.show('操作失败', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                // Icon will be updated by updateIcon, but if it failed, we might want to restore?
                // updateIcon checks this.favorites, so it should be correct.
                this.updateIcon(songId); 
            }
            // Ensure list icons are refreshed (removes spinners)
            this.updateListIcons();
        }
    }

    static updateIcon(targetId = null) {
        if (!this.btnFavorite) return;
        
        let idStr = null;

        // 1. Try to use the provided targetId
        if (targetId !== null && targetId !== undefined) {
            idStr = String(targetId);
        }
        
        // 2. If no valid ID provided, try to get from current song
        if (!idStr && player.currentSong) {
             const song = player.currentSong;
             let rawId = song.id || song.song_id || song.songid || song.mid;
             
             // Try to extract from URL if missing
             if (!rawId && song.url) {
                const match = song.url.match(/[?&]id=(\d+)/);
                if (match) rawId = match[1];
             }
             
             if (rawId !== undefined && rawId !== null && rawId !== '') {
                 idStr = String(rawId);
             }
        }

        const icon = this.btnFavorite.querySelector('i');
        
        // Reset classes first
        icon.className = '';
        this.btnFavorite.classList.remove('text-red-500', 'text-gray-400');

        // Debug log to help trace issues
        // console.log('Updating icon for ID:', idStr, 'Is Favorite:', this.favorites.has(idStr), 'Favorites:', this.favorites);

        if (idStr && this.favorites.has(idStr)) {
            icon.className = 'ri-heart-fill text-xl';
            this.btnFavorite.classList.add('text-red-500');
        } else {
            icon.className = 'ri-heart-line text-xl';
            this.btnFavorite.classList.add('text-gray-400');
        }
    }

    static async showFavoritesPage() {
        const user = AuthManager.getCurrentUser();
        if (!user) {
            Toast.show('请先登录查看收藏', 'error');
            return;
        }

        UIManager.switchView('favorites');

        // Show Loading
        const container = document.getElementById('results-container');
        const loading = document.getElementById('loading-state');
        
        container.classList.add('hidden');
        loading.classList.remove('hidden');
        
        try {
            const { data, error } = await supabase
                .from('app_favorites')
                .select('song_data')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const songs = data.map(item => item.song_data);
            // state.playlist = songs; // Removed: Don't update playlist immediately

            loading.classList.add('hidden');
            container.classList.remove('hidden');
            
            // Animation
            container.classList.remove('animate-fade-in');
            void container.offsetWidth; // Trigger reflow
            container.classList.add('animate-fade-in');
            
            if (songs.length === 0) {
                container.innerHTML = '<div class="col-span-full text-center text-gray-500 mt-10">暂无收藏歌曲</div>';
            } else {
                this.renderFavorites(songs);
            }
        } catch (error) {
            console.error('Failed to fetch favorites page:', error);
            Toast.show('加载收藏失败', 'error');
            loading.classList.add('hidden');
        }
    }

    static renderFavorites(songs) {
        const container = document.getElementById('results-container');
        const header = document.getElementById('list-header');
        
        if (!songs || songs.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-gray-500 mt-10">暂无收藏歌曲</div>';
            if (header) header.classList.add('hidden');
            return;
        }

        if (header) header.classList.remove('hidden');
        
        UIManager.renderList(container, songs, {
            emptyMessage: '<div class="col-span-full text-center text-gray-500 mt-10">暂无收藏歌曲</div>'
        });
        
        // Update icons after rendering
        this.updateListIcons();
    }
}
