import { api } from './api.js';
import { state } from './state.js';
import { player } from './player.js';
import { UIManager } from './ui.js';
import { Toast } from './utils.js';

export class LyricManager {
    static init() {
        this.view = document.getElementById('lyric-view');
        this.container = document.getElementById('lyric-container');
        this.cover = document.getElementById('lyric-cover');
        this.title = document.getElementById('lyric-title');
        this.artist = document.getElementById('lyric-artist');
        this.btnLyrics = document.getElementById('btn-lyrics');
        this.miniCoverContainer = document.getElementById('mini-cover-container');
        this.bg = document.getElementById('lyric-bg');
        this.btnClose = document.getElementById('btn-close-lyric');
        this.btnCloseMobile = document.getElementById('btn-close-lyric-mobile');
        this.miniLyric = document.getElementById('mini-lyric');
        this.btnPiP = document.getElementById('btn-pip');
        this.pipWindow = null;

        if (this.btnLyrics) {
            this.btnLyrics.addEventListener('click', () => this.toggleView());
        }
        if (this.btnPiP) {
            this.btnPiP.addEventListener('click', () => this.togglePiP());
        }
        if (this.miniCoverContainer) {
            this.miniCoverContainer.addEventListener('click', () => this.toggleView());
        }
        if (this.miniLyric) {
            this.miniLyric.addEventListener('click', () => this.toggleView());
        }
        if (this.btnClose) {
            this.btnClose.addEventListener('click', () => this.toggleView());
        }
        if (this.btnCloseMobile) {
            this.btnCloseMobile.addEventListener('click', () => this.toggleView());
        }
    }

    static async togglePiP() {
        if (this.pipWindow) {
            this.pipWindow.close();
            this.pipWindow = null;
            return;
        }
        await this.openPiP();
    }

    static async openPiP() {
        if (!('documentPictureInPicture' in window)) {
            Toast.show('当前浏览器不支持画中画模式或未在HTTPS环境下运行', 'error');
            return;
        }

        try {
            this.pipWindow = await window.documentPictureInPicture.requestWindow({
                width: 300,
                height: 400
            });

            if (!this.pipWindow || !this.pipWindow.document) return;

            // Ensure head exists
            if (!this.pipWindow.document.head) {
                const head = this.pipWindow.document.createElement('head');
                if (this.pipWindow.document.documentElement) {
                    this.pipWindow.document.documentElement.appendChild(head);
                }
            }

            // Copy styles
            [...document.styleSheets].forEach((styleSheet) => {
                try {
                    const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
                    const style = document.createElement('style');
                    style.textContent = cssRules;
                    if (this.pipWindow.document.head) this.pipWindow.document.head.appendChild(style);
                } catch (e) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.type = styleSheet.type;
                    link.media = styleSheet.media;
                    link.href = styleSheet.href;
                    if (this.pipWindow.document.head) this.pipWindow.document.head.appendChild(link);
                }
            });
            
            // Add Tailwind script manually
            const tailwindScript = document.createElement('script');
            tailwindScript.src = 'https://cdn.tailwindcss.com';
            if (this.pipWindow.document.head) this.pipWindow.document.head.appendChild(tailwindScript);

            // Ensure body exists
            if (!this.pipWindow.document.body) {
                const body = this.pipWindow.document.createElement('body');
                if (this.pipWindow.document.documentElement) {
                    this.pipWindow.document.documentElement.appendChild(body);
                }
            }

            // Build UI
            if (this.pipWindow.document.body) {
                this.pipWindow.document.body.innerHTML = `
                <div class="h-screen w-full flex flex-col bg-gray-900 text-white overflow-hidden relative select-none">
                    <div id="pip-bg" class="absolute inset-0 bg-cover bg-center opacity-0 blur-xl transition-all duration-1000"></div>
                    <div class="absolute inset-0 bg-black/40"></div>
                    
                    <div class="relative z-10 p-4 text-center pt-6">
                        <h2 id="pip-title" class="text-lg font-bold truncate px-4">${this.title ? this.title.textContent : 'THW Music'}</h2>
                        <p id="pip-artist" class="text-sm text-gray-300 truncate px-4">${this.artist ? this.artist.textContent : ''}</p>
                    </div>

                    <div id="pip-lyric-container" class="relative z-10 flex-1 overflow-y-auto px-4 py-2 text-center space-y-6 scroll-smooth no-scrollbar mask-image-gradient">
                        <!-- Lyrics -->
                    </div>

                    <div class="relative z-10 p-4 pb-6 flex items-center justify-center gap-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                        <button id="pip-prev" class="text-gray-300 hover:text-white transition-colors"><i class="ri-skip-back-fill text-2xl"></i></button>
                        <button id="pip-play" class="text-white bg-white/20 hover:bg-white/30 rounded-full w-12 h-12 flex items-center justify-center backdrop-blur-sm transition-all active:scale-95">
                            <i class="ri-${player.audio.paused ? 'play' : 'pause'}-fill text-3xl"></i>
                        </button>
                        <button id="pip-next" class="text-gray-300 hover:text-white transition-colors"><i class="ri-skip-forward-fill text-2xl"></i></button>
                    </div>
                    
                    <style>
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                        .mask-image-gradient { mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent); -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent); }
                        .lyric-line { transition: all 0.3s ease; opacity: 0.5; transform: scale(0.95); cursor: pointer; }
                        .lyric-line.active { opacity: 1; transform: scale(1.05); font-weight: bold; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.5); }
                        .lyric-line:hover { opacity: 0.8; }
                    </style>
                </div>
            `;
            }

            // Bind Events
            const doc = this.pipWindow.document;
            doc.getElementById('pip-prev').addEventListener('click', () => player.playPrev());
            doc.getElementById('pip-next').addEventListener('click', () => player.playNext());
            doc.getElementById('pip-play').addEventListener('click', () => player.togglePlay());
            
            // Sync initial state
            this.updateInfo(this.title.textContent, this.artist.textContent, this.cover.src);
            this.render();

            // Sync Play State
            const updatePiPPlayIcon = () => {
                if (!this.pipWindow) return;
                const btn = this.pipWindow.document.getElementById('pip-play');
                if (btn) {
                    const icon = btn.querySelector('i');
                    if (icon) {
                        const isPaused = player.audio.paused;
                        icon.className = `ri-${isPaused ? 'play' : 'pause'}-fill text-3xl`;
                    }
                }
            };
            player.audio.addEventListener('play', updatePiPPlayIcon);
            player.audio.addEventListener('pause', updatePiPPlayIcon);
            
            // Handle close
            this.pipWindow.addEventListener('pagehide', () => {
                player.audio.removeEventListener('play', updatePiPPlayIcon);
                player.audio.removeEventListener('pause', updatePiPPlayIcon);
                this.pipWindow = null;
            });

        } catch (err) {
            console.error("Failed to open PiP window:", err);
        }
    }

    static updateInfo(title, artist, coverUrl) {
        if (!this.title) this.init();
        this.title.textContent = title;
        this.artist.textContent = artist;
        
        const DEFAULT_COVER = 'https://ts1.tc.mm.bing.net/th/id/OIP-C.Pfgh1epEw4M9-PtJ3wxwHgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3';
        
        this.cover.onerror = () => {
            this.cover.src = DEFAULT_COVER;
            if (this.bg) this.bg.style.backgroundImage = `url('${DEFAULT_COVER}')`;
        };
        this.cover.src = coverUrl;
        
        if (this.bg) this.bg.style.backgroundImage = `url('${coverUrl}')`;

        // Update PiP
        if (this.pipWindow) {
            const doc = this.pipWindow.document;
            const pipTitle = doc.getElementById('pip-title');
            const pipArtist = doc.getElementById('pip-artist');
            const pipBg = doc.getElementById('pip-bg');
            
            if (pipTitle) pipTitle.textContent = title;
            if (pipArtist) pipArtist.textContent = artist;
            if (pipBg) {
                const img = new Image();
                img.onload = () => {
                    // Check if it's the first load (opacity is 0 from HTML)
                    const isFirstLoad = pipBg.classList.contains('opacity-0') || pipBg.style.opacity === '0';
                    
                    if (isFirstLoad) {
                        pipBg.style.backgroundImage = `url('${coverUrl}')`;
                        pipBg.classList.remove('opacity-0');
                        pipBg.style.opacity = 0.3;
                    } else {
                        // Cross-fade for subsequent updates
                        pipBg.style.opacity = 0;
                        setTimeout(() => {
                            pipBg.style.backgroundImage = `url('${coverUrl}')`;
                            pipBg.style.opacity = 0.3;
                        }, 1000);
                    }
                };
                img.src = coverUrl;
            }
        }
    }

    static async load(idOrUrl) {
        state.lyrics = [];
        this.container.innerHTML = '<p class="text-gray-400 italic mt-10">加载歌词中...</p>';
        if (this.miniLyric) this.miniLyric.textContent = '加载歌词中...';
        
        try {
            const lrcText = await api.getLyric(idOrUrl);
            state.lyrics = this.parse(lrcText);
            this.render();
        } catch (e) {
            console.error("Lyric load failed", e);
            this.container.innerHTML = '<p class="text-gray-400 italic mt-10">暂无歌词</p>';
            if (this.miniLyric) this.miniLyric.textContent = '暂无歌词';
        }
    }

    static parse(lrc) {
        if (!lrc) return [];
        const lines = lrc.split('\n');
        const result = [];
        const timeExp = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

        for (const line of lines) {
            const match = timeExp.exec(line);
            if (match) {
                const min = parseInt(match[1]);
                const sec = parseInt(match[2]);
                const ms = parseInt(match[3]);
                const time = min * 60 + sec + (match[3].length === 3 ? ms / 1000 : ms / 100);
                const text = line.replace(timeExp, '').trim();
                if (text) {
                    result.push({ time, text });
                }
            }
        }
        return result;
    }

    static render() {
        if (!this.container) return;
        this.container.innerHTML = '';
        if (this.miniLyric) this.miniLyric.textContent = '';

        if (state.lyrics.length === 0) {
            this.container.innerHTML = '<p class="text-gray-400 italic mt-10">纯音乐 / 暂无歌词</p>';
            if (this.miniLyric) this.miniLyric.textContent = '纯音乐 / 暂无歌词';
            return;
        }

        const fragment = document.createDocumentFragment();
        state.lyrics.forEach((line, index) => {
            const p = document.createElement('p');
            // Classes are now handled mostly by CSS, just base classes here
            p.className = 'lyric-line text-lg md:text-xl py-3';
            p.textContent = line.text;
            p.dataset.index = index;
            p.dataset.time = line.time;
            
            p.addEventListener('click', () => {
                player.audio.currentTime = line.time;
                player.updatePlayState(true);
                player.audio.play();
            });

            fragment.appendChild(p);
        });
        this.container.appendChild(fragment);

        // Render to PiP
        if (this.pipWindow) {
            const pipContainer = this.pipWindow.document.getElementById('pip-lyric-container');
            if (pipContainer) {
                pipContainer.innerHTML = '';
                if (state.lyrics.length === 0) {
                    pipContainer.innerHTML = '<p class="text-gray-400 italic mt-10">纯音乐 / 暂无歌词</p>';
                } else {
                    const fragment = document.createDocumentFragment();
                    state.lyrics.forEach((line, index) => {
                        const p = document.createElement('p');
                        p.className = 'lyric-line text-lg py-3';
                        p.textContent = line.text;
                        p.dataset.index = index;
                        p.dataset.time = line.time;
                        p.addEventListener('click', () => {
                            player.audio.currentTime = line.time;
                            player.updatePlayState(true);
                            player.audio.play();
                        });
                        fragment.appendChild(p);
                    });
                    pipContainer.appendChild(fragment);
                }
            }
        }
    }

    static sync(currentTime) {
        let activeIndex = -1;
        for (let i = 0; i < state.lyrics.length; i++) {
            if (state.lyrics[i].time <= currentTime) {
                activeIndex = i;
            } else {
                break;
            }
        }

        if (activeIndex !== state.currentLyricIndex) {
            state.currentLyricIndex = activeIndex;
            
            if (this.miniLyric && activeIndex >= 0 && activeIndex < state.lyrics.length) {
                this.miniLyric.textContent = state.lyrics[activeIndex].text;
            }

            const lines = this.container.children;
            for (let i = 0; i < lines.length; i++) {
                if (i === activeIndex) {
                    lines[i].classList.add('active');
                    this.scrollToLine(lines[i]);
                } else {
                    lines[i].classList.remove('active');
                }
            }

            // Sync PiP
            if (this.pipWindow) {
                const pipContainer = this.pipWindow.document.getElementById('pip-lyric-container');
                if (pipContainer) {
                    const lines = pipContainer.children;
                    for (let i = 0; i < lines.length; i++) {
                        if (i === activeIndex) {
                            lines[i].classList.add('active');
                            // Scroll PiP
                            const containerHeight = pipContainer.clientHeight;
                            const lineHeight = lines[i].offsetHeight;
                            const lineTop = lines[i].offsetTop;
                            const targetScrollTop = lineTop + lineHeight / 2 - containerHeight * 0.35;
                            
                            pipContainer.scrollTo({
                                top: targetScrollTop,
                                behavior: 'smooth'
                            });
                        } else {
                            lines[i].classList.remove('active');
                        }
                    }
                }
            }
        }
    }

    static scrollToLine(line) {
        if (!line || !this.container) return;
        
        const containerHeight = this.container.clientHeight;
        const lineHeight = line.offsetHeight;
        const lineTop = line.offsetTop;
        
        // Calculate target scroll position to place line at 30% from top (Golden Ratio-ish)
        // Previously centered (0.5), now moving up means we show more content below
        const targetScrollTop = lineTop + lineHeight / 2 - containerHeight * 0.35;
        
        if (typeof gsap !== 'undefined') {
            gsap.to(this.container, {
                scrollTop: targetScrollTop,
                duration: 0.6,
                ease: "power2.out",
                overwrite: true
            });
        } else {
            this.container.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
        }
    }

    static toggleView() {
        state.isLyricViewOpen = !state.isLyricViewOpen;
        
        if (state.isLyricViewOpen) {
            this.view.classList.remove('hidden');
            setTimeout(() => {
                this.view.classList.remove('opacity-0');
            }, 10);
            this.btnLyrics.classList.add('text-blue-600'); // This might be overridden by setImmersiveMode
            this.btnLyrics.classList.remove('text-gray-400');
            
            player.setImmersiveMode(true);
            
            // Auto collapse sidebar
            UIManager.setSidebarState(true);
        } else {
            this.view.classList.add('opacity-0');
            setTimeout(() => {
                this.view.classList.add('hidden');
            }, 300);
            this.btnLyrics.classList.remove('text-blue-600');
            this.btnLyrics.classList.add('text-gray-400');
            
            player.setImmersiveMode(false);
            
            // Auto expand sidebar (optional, but good UX)
            UIManager.setSidebarState(false);
        }
    }
}
