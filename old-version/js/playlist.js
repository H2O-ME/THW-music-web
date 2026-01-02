import { api } from './api.js';
import { player } from './player.js';
import { UIManager } from './ui.js';
import { Toast, formatTime } from './utils.js';

export class PlaylistManager {
    static init() {
        this.container = document.getElementById('playlist-view');
        this.grid = document.getElementById('playlist-grid');
        this.detailView = document.getElementById('playlist-detail-view');
        this.playlistInfo = document.getElementById('playlist-info');
        this.playlistTracks = document.getElementById('playlist-tracks');
        this.backButton = document.getElementById('back-to-playlists');
        this.navButton = document.getElementById('nav-playlists');

        if (this.navButton) {
            this.navButton.addEventListener('click', () => {
                UIManager.switchView('playlist');
                this.showPlaylists();
            });
        }

        if (this.backButton) {
            this.backButton.addEventListener('click', () => {
                this.detailView.classList.add('hidden');
                this.container.classList.remove('hidden');
            });
        }
    }

    static async showPlaylists() {
        this.container.classList.remove('hidden');
        this.detailView.classList.add('hidden');
        
        // If already loaded, don't reload unless empty (api cache handles fetch, but we can check grid)
        if (this.grid.children.length > 0) return;

        const playlists = await api.getTopPlaylists();
        this.renderPlaylists(playlists);
    }

    static renderPlaylists(playlists) {
        const DEFAULT_COVER = 'https://ts1.tc.mm.bing.net/th/id/OIP-C.Pfgh1epEw4M9-PtJ3wxwHgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3';
        this.grid.innerHTML = '';
        playlists.forEach(list => {
            const card = document.createElement('div');
            card.className = 'group cursor-pointer';
            card.innerHTML = `
                <div class="relative aspect-square rounded-xl overflow-hidden mb-3 bg-gray-100">
                    <img src="${list.coverImgUrl}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" onerror="this.src='${DEFAULT_COVER}'">
                    <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <i class="ri-play-circle-fill text-4xl text-white drop-shadow-lg transform scale-90 group-hover:scale-100 transition-transform"></i>
                    </div>
                    <div class="absolute top-2 right-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                        <i class="ri-headphone-line"></i>
                        <span>${this.formatCount(list.playCount)}</span>
                    </div>
                </div>
                <h3 class="font-bold text-gray-800 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">${list.name}</h3>
            `;
            card.addEventListener('click', () => this.showPlaylistDetail(list));
            this.grid.appendChild(card);
        });
    }

    static async showPlaylistDetail(playlist) {
        this.container.classList.add('hidden');
        this.detailView.classList.remove('hidden');
        
        // Render Info
        this.playlistInfo.innerHTML = `
            <div class="w-48 h-48 md:w-64 md:h-64 shrink-0 rounded-xl overflow-hidden shadow-lg">
                <img src="${playlist.coverImgUrl}" class="w-full h-full object-cover">
            </div>
            <div class="flex flex-col justify-end py-2">
                <div class="mb-auto">
                    <span class="inline-block px-2 py-0.5 rounded border border-blue-500 text-blue-500 text-xs font-bold mb-2">歌单</span>
                    <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-4">${playlist.name}</h2>
                    <p class="text-sm text-gray-500 line-clamp-3 mb-4 mt-4">${playlist.description || '暂无简介'}</p>
                </div>
            </div>
        `;

        // Fetch Tracks
        this.playlistTracks.innerHTML = '<div class="py-10 text-center"><div class="loader mx-auto"></div></div>';
        const tracks = await api.getPlaylistDetail(playlist.id);
        this.renderTracks(tracks);
    }

    static renderTracks(tracks) {
        this.playlistTracks.innerHTML = '';
        tracks.forEach((song, index) => {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-4 p-3 rounded-lg hover:bg-white/50 transition-colors cursor-pointer group';
            
            const artistName = song.ar.map(a => a.name).join('/');
            const albumName = song.al.name;
            
            row.innerHTML = `
                <div class="w-8 text-center text-gray-400 text-sm font-mono group-hover:hidden">${index + 1}</div>
                <div class="w-8 hidden group-hover:flex items-center justify-center text-blue-600">
                    <i class="ri-play-fill text-xl"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-800 truncate">${song.name}</div>
                    <div class="text-xs text-gray-500 truncate mt-0.5">${artistName} - ${albumName}</div>
                </div>
                <div class="text-xs text-gray-400 font-mono">${formatTime(song.dt / 1000)}</div>
            `;

            row.addEventListener('click', () => this.playSongWithSearch(song));
            this.playlistTracks.appendChild(row);
        });
    }

    static async playSongWithSearch(song) {
        const artistName = song.ar ? song.ar.map(a => a.name).join(' ') : '';
        const keyword = `${song.name} ${artistName}`;
        
        Toast.show(`正在搜索资源: ${song.name}...`, 'info');
        
        try {
            const results = await api.search(keyword);
            if (results && results.length > 0) {
                const bestMatch = results[0];
                // Play this song
                player.playList([bestMatch], 0);
            } else {
                Toast.show('未找到该歌曲资源', 'error');
            }
        } catch (e) {
            console.error(e);
            Toast.show('搜索失败', 'error');
        }
    }

    static formatCount(count) {
        if (count > 100000000) return (count / 100000000).toFixed(1) + '亿';
        if (count > 10000) return (count / 10000).toFixed(1) + '万';
        return count;
    }
}
