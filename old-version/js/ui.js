import { player } from './player.js';

export class UIManager {
    static init() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebar-toggle');
        this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
        this.sidebarBackdrop = document.getElementById('sidebar-backdrop');
        this.sidebarTexts = document.querySelectorAll('.sidebar-text');
        this.mainContent = document.querySelector('main');
        
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => this.openMobileSidebar());
        }

        if (this.sidebarBackdrop) {
            this.sidebarBackdrop.addEventListener('click', () => this.closeMobileSidebar());
        }

        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    static toggleSidebar() {
        // Desktop toggle logic
        const isCollapsed = this.sidebar.classList.contains('w-16');
        this.setSidebarState(!isCollapsed);
    }

    static openMobileSidebar() {
        this.sidebar.classList.remove('-translate-x-full');
        this.sidebarBackdrop.classList.remove('hidden');
        requestAnimationFrame(() => {
            this.sidebarBackdrop.classList.remove('opacity-0');
        });
    }

    static closeMobileSidebar() {
        this.sidebar.classList.add('-translate-x-full');
        this.sidebarBackdrop.classList.add('opacity-0');
        setTimeout(() => {
            this.sidebarBackdrop.classList.add('hidden');
        }, 300);
    }

    static handleResize() {
        if (window.innerWidth < 768) {
            // Mobile
            this.sidebar.classList.add('fixed', 'h-full', '-translate-x-full');
            this.sidebar.classList.remove('relative', 'w-16');
            this.sidebar.classList.add('w-64');
            
            // Ensure content is visible
            this.sidebarTexts.forEach(el => el.classList.remove('hidden'));
            const logoContainer = document.getElementById('logo-container');
            if (logoContainer) logoContainer.classList.remove('hidden');
            
            // Hide internal toggle
            if (this.sidebarToggle) this.sidebarToggle.classList.add('hidden');
            
            // Reset alignment
            const header = this.sidebar.querySelector('.mb-6');
            if (header) header.classList.remove('justify-center');
            const navButtons = this.sidebar.querySelectorAll('nav button');
            navButtons.forEach(btn => btn.classList.remove('justify-center'));

        } else {
            // Desktop
            this.sidebar.classList.remove('fixed', 'h-full', '-translate-x-full');
            this.sidebar.classList.add('relative');
            this.sidebarBackdrop.classList.add('hidden', 'opacity-0');
            
            if (this.sidebarToggle) this.sidebarToggle.classList.remove('hidden');
            
            // Default to expanded if not explicitly collapsed? 
            // Or keep current state. If it was w-64, it stays w-64.
            if (!this.sidebar.classList.contains('w-16')) {
                this.sidebar.classList.add('w-64');
            }
        }
    }

    static updateSidebarNav(activeId) {
        const buttons = document.querySelectorAll('nav button');
        buttons.forEach(btn => {
            if (btn.id === activeId) {
                btn.classList.remove('text-gray-800', 'hover:text-gray-900', 'hover:bg-white/50');
                btn.classList.add('bg-white', 'shadow-sm', 'text-gray-900');
            } else {
                btn.classList.add('text-gray-800', 'hover:text-gray-900', 'hover:bg-white/50');
                btn.classList.remove('bg-white', 'shadow-sm', 'text-gray-900');
            }
        });
    }

    static switchView(viewName) {
        // Hide all main views
        const views = ['welcome-state', 'results-container', 'playlist-view', 'playlist-detail-view', 'loading-state'];
        views.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });

        // Show specific view
        if (viewName === 'home') {
            const el = document.getElementById('welcome-state');
            if (el) el.classList.remove('hidden');
            this.updateSidebarNav('nav-search');
        } else if (viewName === 'search') {
            const el = document.getElementById('results-container');
            if (el) el.classList.remove('hidden');
            this.updateSidebarNav('nav-search');
        } else if (viewName === 'playlist') {
            const el = document.getElementById('playlist-view');
            if (el) el.classList.remove('hidden');
            this.updateSidebarNav('nav-playlists');
        } else if (viewName === 'favorites') {
            const el = document.getElementById('results-container');
            if (el) el.classList.remove('hidden');
            this.updateSidebarNav('nav-favorites');
        }
        
        // Handle list header visibility
        const listHeader = document.getElementById('list-header');
        if (listHeader) {
            if (viewName === 'search' || viewName === 'favorites') listHeader.classList.remove('hidden');
            else listHeader.classList.add('hidden');
        }

        // Handle favorites header visibility
        const favHeader = document.getElementById('favorites-header');
        if (favHeader) {
            if (viewName === 'favorites') favHeader.classList.remove('hidden');
            else favHeader.classList.add('hidden');
        }
    }

    static createSongRow(song, index, options = {}) {
        const {
            showArtist = true,
            showAlbum = false,
            showDuration = false,
            showLike = true,
            highlightPlaying = false
        } = options;

        const row = document.createElement('div');
        // Common row classes
        row.className = 'group grid grid-cols-[40px_1fr_50px] md:grid-cols-[50px_4fr_3fr_100px] gap-2 md:gap-4 px-2 md:px-4 py-3 rounded-lg hover:bg-gray-50/80 transition-colors items-center cursor-pointer border-b border-gray-50 last:border-0';
        
        const picUrl = song.pic;
        const artist = song.author ? song.author.split(' / ')[0] : 'Unknown';
        const songId = song.id || song.song_id || song.songid || song.mid || '';
        const DEFAULT_COVER = 'https://ts1.tc.mm.bing.net/th/id/OIP-C.Pfgh1epEw4M9-PtJ3wxwHgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3';

        row.innerHTML = `
            <div class="text-center text-gray-400 text-xs font-mono group-hover:text-gray-600">${String(index + 1).padStart(2, '0')}</div>
            <div class="flex items-center gap-3 overflow-hidden">
                <div class="w-10 h-10 rounded-md bg-gray-100 shrink-0 overflow-hidden relative">
                    <img src="${picUrl}" loading="lazy" class="w-full h-full object-cover" onerror="this.src='${DEFAULT_COVER}'">
                    <div class="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center">
                        <i class="ri-play-fill text-white"></i>
                    </div>
                </div>
                <div class="flex flex-col overflow-hidden">
                    <div class="text-sm font-medium text-gray-900 truncate">${song.title}</div>
                    <div class="text-xs text-gray-500 truncate md:hidden">${artist}</div>
                    ${song.quality ? '<span class="inline-block px-1 rounded border border-red-500 text-[10px] text-red-500 w-fit scale-90 origin-left mt-0.5">SQ</span>' : ''}
                </div>
            </div>
            <div class="text-sm text-gray-500 truncate hidden md:block">${artist}</div>
            <div class="flex justify-center">
                <button class="btn-fav-row text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50" data-id="${songId}">
                    <i class="ri-heart-line text-lg"></i>
                </button>
            </div>
        `;

        // Event Listeners
        row.addEventListener('click', (e) => {
            if (e.target.closest('.btn-fav-row')) return;
            if (options.onPlay) options.onPlay(index);
            else player.playList(options.playlist || [song], index);
        });

        const btnFav = row.querySelector('.btn-fav-row');
        btnFav.addEventListener('click', (e) => {
            e.stopPropagation();
            // Loading state
            btnFav.innerHTML = '<i class="ri-loader-4-line animate-spin text-lg"></i>';
            btnFav.classList.add('pointer-events-none');
            
            document.dispatchEvent(new CustomEvent('req:toggle-favorite', { detail: song }));
        });

        return row;
    }
    
    static renderList(container, songs, options = {}) {
        if (!container) {
            console.warn('UIManager.renderList: container is null');
            return;
        }
        container.innerHTML = '';
        if (!songs || songs.length === 0) {
            container.innerHTML = options.emptyMessage || '<div class="col-span-full text-center text-gray-500 mt-10">暂无歌曲</div>';
            return;
        }

        // Use Time Slicing (Chunking) to avoid blocking the main thread
        const CHUNK_SIZE = 20;
        let index = 0;

        const renderChunk = () => {
            const chunk = songs.slice(index, index + CHUNK_SIZE);
            if (chunk.length === 0) {
                // Finished rendering
                // Check favorites
                document.dispatchEvent(new CustomEvent('req:check-favorites'));
                return;
            }

            const fragment = document.createDocumentFragment();
            chunk.forEach((song, i) => {
                const row = this.createSongRow(song, index + i, {
                    ...options,
                    playlist: songs,
                    onPlay: (idx) => {
                        if (options.onPlay) options.onPlay(songs, idx);
                        else player.playList(songs, idx);
                    }
                });
                
                // Simple fade in for new items
                row.style.opacity = '0';
                row.style.transform = 'translateY(10px)';
                requestAnimationFrame(() => {
                    row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    row.style.opacity = '1';
                    row.style.transform = 'translateY(0)';
                });
                
                fragment.appendChild(row);
            });
            container.appendChild(fragment);

            index += CHUNK_SIZE;
            if (index < songs.length) {
                // Schedule next chunk
                requestAnimationFrame(renderChunk);
            } else {
                // Finished
                document.dispatchEvent(new CustomEvent('req:check-favorites'));
            }
        };

        renderChunk();
    }

    static setSidebarState(collapsed) {
        const logoContainer = document.getElementById('logo-container');
        const header = this.sidebar.querySelector('.mb-6');
        const navButtons = this.sidebar.querySelectorAll('nav button, #nav-settings');

        if (!collapsed) {
            // Expand
            this.sidebar.classList.remove('w-16');
            this.sidebar.classList.add('w-64');
            this.sidebarTexts.forEach(el => el.classList.remove('hidden'));
            if (logoContainer) logoContainer.classList.remove('hidden');
            if (header) header.classList.remove('justify-center');
            navButtons.forEach(btn => btn.classList.remove('justify-center'));
        } else {
            // Collapse
            this.sidebar.classList.remove('w-64');
            this.sidebar.classList.add('w-16');
            this.sidebarTexts.forEach(el => el.classList.add('hidden'));
            if (logoContainer) logoContainer.classList.add('hidden');
            if (header) header.classList.add('justify-center');
            navButtons.forEach(btn => btn.classList.add('justify-center'));
        }
    }
}
