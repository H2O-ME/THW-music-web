import { api } from './api.js';
import { state } from './state.js';
import { player } from './player.js';
import { Toast } from './utils.js';
import { UIManager } from './ui.js';

export class SearchManager {
    static init() {
        this.input = document.getElementById('search-input');
        this.container = document.getElementById('results-container');
        this.welcomeState = document.getElementById('welcome-state');
        this.loadingState = document.getElementById('loading-state');
        this.navSearch = document.getElementById('nav-search');
        this.suggestionsContainer = document.getElementById('search-suggestions');

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(this.input.value);
                this.hideSuggestions();
            }
        });

        // Search Suggestions
        let debounceTimer;
        this.input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const value = e.target.value.trim();
            if (!value) {
                this.hideSuggestions();
                return;
            }
            debounceTimer = setTimeout(() => this.handleInput(value), 100);
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (this.suggestionsContainer && !this.suggestionsContainer.contains(e.target) && e.target !== this.input) {
                this.hideSuggestions();
            }
        });

        if (this.navSearch) {
            this.navSearch.addEventListener('click', () => this.showSearchPage());
        }

        // Load Hot Search
        this.loadInitialData();
    }

    static loadInitialData() {
        const load = () => {
            this.loadHotSearch();
            this.loadTopArtists();
            this.loadNewSongs();
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(load);
        } else {
            setTimeout(load, 500);
        }
    }

    static async loadNewSongs() {
        const container = document.getElementById('new-songs-container');
        const grid = document.getElementById('new-songs-grid');
        if (!container || !grid) return;

        try {
            const data = await api.getNewSongs();
            if (data && data.length > 0) {
                grid.innerHTML = '';
                // Take top 10 items
                data.slice(0, 10).forEach((item) => {
                    const song = item.song;
                    const card = document.createElement('div');
                    card.className = 'flex items-center gap-3 p-3 rounded-xl bg-white/60 hover:bg-white hover:shadow-md transition-all cursor-pointer group';
                    
                    const artistName = song.artists.map(a => a.name).join('/');
                    const DEFAULT_COVER = 'https://ts1.tc.mm.bing.net/th/id/OIP-C.Pfgh1epEw4M9-PtJ3wxwHgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3';
                    
                    card.innerHTML = `
                        <div class="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden">
                            <img src="${item.picUrl}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="${item.name}" onerror="this.src='${DEFAULT_COVER}'">
                            <div class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <i class="ri-play-fill text-white text-xl"></i>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">${item.name}</h4>
                            <p class="text-xs text-gray-500 truncate mt-0.5">${artistName}</p>
                        </div>
                    `;

                    card.addEventListener('click', () => {
                        // Search for the song instead of playing directly
                        const keyword = `${item.name} ${artistName}`;
                        this.input.value = keyword;
                        this.performSearch(keyword);
                    });

                    grid.appendChild(card);
                });
                container.classList.remove('hidden');
            }
        } catch (e) {
            console.error('Failed to load new songs', e);
        }
    }

    static async handleInput(value) {
        if (this.suggestionController) {
            this.suggestionController.abort();
        }
        this.suggestionController = new AbortController();

        const data = await api.getSearchSuggestions(value, this.suggestionController.signal);
        if (data) {
            this.renderSuggestions(data);
        } else {
            this.hideSuggestions();
        }
    }

    static renderSuggestions(data) {
        if (!this.suggestionsContainer) return;
        
        const { songs, artists, albums, order } = data;
        if (!order || order.length === 0) {
            this.hideSuggestions();
            return;
        }

        let html = '';
        
        order.forEach(type => {
            if (type === 'songs' && songs && songs.length > 0) {
                html += `<div class="px-4 py-2 text-xs font-bold text-gray-400 bg-gray-50">单曲</div>`;
                songs.forEach(song => {
                    const artistName = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
                    html += `
                        <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between suggestion-item" data-keyword="${song.name} ${artistName}">
                            <span class="text-sm text-gray-700 truncate">${song.name} <span class="text-gray-400 text-xs">- ${artistName}</span></span>
                        </div>
                    `;
                });
            } else if (type === 'artists' && artists && artists.length > 0) {
                html += `<div class="px-4 py-2 text-xs font-bold text-gray-400 bg-gray-50">歌手</div>`;
                const DEFAULT_COVER = 'https://ts1.tc.mm.bing.net/th/id/OIP-C.Pfgh1epEw4M9-PtJ3wxwHgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3';
                artists.forEach(artist => {
                    html += `
                        <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3 suggestion-item" data-keyword="${artist.name}">
                            <img src="${artist.picUrl}" class="w-8 h-8 rounded-full object-cover" onerror="this.src='${DEFAULT_COVER}'">
                            <span class="text-sm text-gray-700 font-medium">${artist.name}</span>
                        </div>
                    `;
                });
            } else if (type === 'albums' && albums && albums.length > 0) {
                html += `<div class="px-4 py-2 text-xs font-bold text-gray-400 bg-gray-50">专辑</div>`;
                albums.forEach(album => {
                    html += `
                        <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3 suggestion-item" data-keyword="${album.name}">
                            <span class="text-sm text-gray-700 truncate">${album.name} <span class="text-gray-400 text-xs">- ${album.artist.name}</span></span>
                        </div>
                    `;
                });
            }
        });

        if (html) {
            this.suggestionsContainer.innerHTML = html;
            this.suggestionsContainer.classList.remove('hidden');
            
            // Add click listeners
            this.suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const keyword = item.dataset.keyword;
                    this.input.value = keyword;
                    this.performSearch(keyword);
                    this.hideSuggestions();
                });
            });
        } else {
            this.hideSuggestions();
        }
    }

    static hideSuggestions() {
        if (this.suggestionsContainer) {
            this.suggestionsContainer.classList.add('hidden');
        }
    }

    static async loadTopArtists() {
        const container = document.getElementById('top-artists-container');
        const grid = document.getElementById('top-artists-grid');
        if (!container || !grid) return;

        try {
            const artists = await api.getTopArtists();
            if (artists && artists.length > 0) {
                grid.innerHTML = '';
                // Take top 20 items for scrolling
                const DEFAULT_COVER = 'https://ts1.tc.mm.bing.net/th/id/OIP-C.Pfgh1epEw4M9-PtJ3wxwHgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3';
                artists.slice(0, 20).forEach((artist) => {
                    const card = document.createElement('div');
                    // Fixed width for horizontal scroll
                    card.className = 'group relative flex-shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 snap-start';
                    
                    card.innerHTML = `
                        <!-- Background Image -->
                        <img src="${artist.picUrl}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="${artist.name}" onerror="this.src='${DEFAULT_COVER}'">
                        
                        <!-- Gradient Overlay -->
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                        
                        <!-- Content -->
                        <div class="absolute inset-0 p-3 flex flex-col justify-between text-white">
                            <div></div> <!-- Spacer -->
                            <div class="flex justify-between items-end">
                                <h4 class="text-sm font-bold truncate w-full">${artist.name}</h4>
                            </div>
                        </div>
                    `;

                    card.addEventListener('click', () => {
                        this.input.value = artist.name;
                        this.performSearch(artist.name);
                    });

                    grid.appendChild(card);
                });
                container.classList.remove('hidden');
            }
        } catch (e) {
            console.error('Failed to load top artists', e);
        }
    }

    static async loadHotSearch() {
        const container = document.getElementById('hot-search-container');
        const grid = document.getElementById('hot-search-grid');
        if (!container || !grid) return;

        try {
            const data = await api.getHotSearch();
            if (data && data.length > 0) {
                grid.innerHTML = '';
                // Take top 10 items to match height roughly
                data.slice(0, 10).forEach((item, index) => {
                    const card = document.createElement('div');
                    // Solid background, no blur needed if solid, but maybe keep it clean
                    card.className = 'group relative bg-white rounded-lg p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden flex items-center gap-3';
                    
                    // Determine image to show - simplified for compact view
                    let imgHtml = '';
                    if (item.iconUrl) {
                        imgHtml = `<img src="${item.iconUrl}" class="w-8 h-8 object-contain group-hover:scale-110 transition-transform" alt="icon">`;
                    } else {
                        imgHtml = `<div class="w-8 h-8 flex items-center justify-center text-lg font-bold text-gray-200 italic">#${index + 1}</div>`;
                    }

                    card.innerHTML = `
                        <div class="flex items-center gap-3 w-full">
                            <span class="text-sm font-bold ${index < 3 ? 'text-red-500' : 'text-gray-400'} w-6 text-center">#${index + 1}</span>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2">
                                    <h4 class="font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate text-sm">${item.searchWord}</h4>
                                    ${item.iconType === 1 ? '<span class="text-[10px] px-1 py-0 bg-red-100 text-red-600 rounded-full shrink-0">HOT</span>' : ''}
                                </div>
                                <div class="text-xs text-gray-400 mt-0.5">${item.score ? (item.score / 10000).toFixed(1) + '万' : ''}</div>
                            </div>
                            ${item.iconUrl ? `<img src="${item.iconUrl}" class="w-8 h-8 object-contain opacity-80" alt="icon">` : ''}
                        </div>
                    `;

                    card.addEventListener('click', () => {
                        this.input.value = item.searchWord;
                        this.performSearch(item.searchWord);
                    });

                    grid.appendChild(card);
                });
                container.classList.remove('hidden');
            }
        } catch (e) {
            console.error('Failed to load hot search', e);
        }
    }

    static showSearchPage() {
        UIManager.switchView('home');
        
        // Clear search input
        this.input.value = '';
        
        // Animation
        this.welcomeState.classList.remove('animate-fade-in');
        void this.welcomeState.offsetWidth; // Trigger reflow
        this.welcomeState.classList.add('animate-fade-in');
        
        // Reload hot search/artists to ensure it's fresh/visible
        this.loadHotSearch();
        this.loadTopArtists();
    }

    static async performSearch(keyword) {
        if (!keyword.trim()) return;

        if (this.searchController) {
            this.searchController.abort();
        }
        this.searchController = new AbortController();

        UIManager.switchView('search');
        this.container.classList.add('hidden'); // Hide container initially to show loading
        this.loadingState.classList.remove('hidden');
        
        try {
            const results = await api.search(keyword, this.searchController.signal);
            // state.playlist = results; // Removed: Don't update playlist immediately
            
            this.loadingState.classList.add('hidden');
            this.container.classList.remove('hidden');
            
            // Animation
            this.container.classList.remove('animate-fade-in');
            void this.container.offsetWidth; // Trigger reflow
            this.container.classList.add('animate-fade-in');
            
            this.renderResults(results);
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error(error);
            Toast.show('搜索失败，请重试', 'error');
            this.loadingState.classList.add('hidden');
        }
    }

    static renderResults(songs) {
        const header = document.getElementById('list-header');
        
        // Ensure welcome state is hidden when showing results
        if (this.welcomeState) this.welcomeState.classList.add('hidden');
        
        if (!songs || songs.length === 0) {
            this.container.innerHTML = '<div class="text-center text-gray-500 py-10">未找到相关歌曲</div>';
            if (header) header.classList.add('hidden');
            return;
        }

        if (header) header.classList.remove('hidden');
        this.container.classList.remove('hidden');

        UIManager.renderList(this.container, songs, {
            emptyMessage: '<div class="text-center text-gray-500 py-10">未找到相关歌曲</div>'
        });
    }
}
