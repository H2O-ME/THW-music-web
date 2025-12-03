import { state } from './state.js';
import { formatTime, Toast } from './utils.js';
import { LyricManager } from './lyrics.js';

export class Player {
    constructor() {
        this.audio = document.getElementById('audio-player');
        this.btnPlay = document.getElementById('btn-play');
        this.btnPrev = document.getElementById('btn-prev');
        this.btnNext = document.getElementById('btn-next');
        this.progressBar = document.getElementById('progress-bar');
        this.timeCurrent = document.getElementById('time-current');
        this.timeTotal = document.getElementById('time-total');
        // this.volumeBar = document.getElementById('volume-bar');
        // this.volumeIcon = document.getElementById('volume-icon');
        
        this.cover = document.getElementById('player-cover');
        this.title = document.getElementById('player-title');
        this.artist = document.getElementById('player-artist');

        // Mobile Immersive Controls
        this.btnPlayMobile = document.getElementById('btn-play-mobile');
        this.btnPrevMobile = document.getElementById('btn-prev-mobile');
        this.btnNextMobile = document.getElementById('btn-next-mobile');
        this.progressBarMobile = document.getElementById('mobile-progress-bar');
        this.progressFillMobile = document.getElementById('mobile-progress-fill');
        this.progressHandleMobile = document.getElementById('mobile-progress-handle');
        this.timeCurrentMobile = document.getElementById('mobile-time-current');
        this.timeTotalMobile = document.getElementById('mobile-time-total');
        this.mobileTitle = document.getElementById('mobile-lyric-title');
        this.mobileArtist = document.getElementById('mobile-lyric-artist');
        
        // Initialize ColorThief
        try {
            this.colorThief = new ColorThief();
        } catch (e) {
            console.warn('ColorThief not loaded', e);
        }
    }

    init() {
        this.retryCount = 0;
        this.maxRetries = 3;

        // Audio Events
        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
            // Reset retry count if played successfully for more than 5 seconds
            if (this.audio.currentTime > 5) {
                this.retryCount = 0;
            }
        });
        this.audio.addEventListener('loadedmetadata', () => {
            this.timeTotal.textContent = formatTime(this.audio.duration);
            this.progressBar.max = this.audio.duration;
        });
        this.audio.addEventListener('ended', () => this.playNext());
        this.audio.addEventListener('play', () => this.updatePlayState(true));
        this.audio.addEventListener('pause', () => this.updatePlayState(false));
        
        // Error Handling
        this.audio.addEventListener('error', (e) => {
            console.error('Audio Error:', e);
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`Retrying... (${this.retryCount}/${this.maxRetries})`);
                setTimeout(() => this.playNext(), 1000);
            } else {
                this.retryCount = 0;
                this.updatePlayState(false);
                import('./utils.js').then(({ Toast }) => {
                    Toast.show('连续播放失败，已停止播放', 'error');
                });
            }
        });

        // Image Load Event for Theming
        this.cover.addEventListener('load', () => {
            if (this.cover.src && !this.cover.src.includes('data:image')) {
                this.extractThemeColor();
            }
        });
        this.cover.addEventListener('error', () => {
            this.cover.src = 'https://ts1.tc.mm.bing.net/th/id/OIP-C.Pfgh1epEw4M9-PtJ3wxwHgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3';
            this.resetTheme();
        });

        // Controls
        this.btnPlay.addEventListener('click', () => this.togglePlay());
        this.btnPrev.addEventListener('click', () => this.playPrev());
        this.btnNext.addEventListener('click', () => this.playNext());

        // Mobile Controls
        if(this.btnPlayMobile) this.btnPlayMobile.addEventListener('click', () => this.togglePlay());
        if(this.btnPrevMobile) this.btnPrevMobile.addEventListener('click', () => this.playPrev());
        if(this.btnNextMobile) this.btnNextMobile.addEventListener('click', () => this.playNext());

        // Progress Bar
        this.progressBar.addEventListener('input', () => {
            state.isDraggingProgress = true;
            this.timeCurrent.textContent = formatTime(this.progressBar.value);
            this.updateProgressFill(this.progressBar.value, this.progressBar.max);
        });
        this.progressBar.addEventListener('change', () => {
            state.isDraggingProgress = false;
            this.audio.currentTime = this.progressBar.value;
        });

        // Mobile Progress Bar
        if(this.progressBarMobile) {
            this.progressBarMobile.addEventListener('input', () => {
                state.isDraggingProgress = true;
                if(this.timeCurrentMobile) this.timeCurrentMobile.textContent = formatTime(this.progressBarMobile.value);
                this.updateProgressFill(this.progressBarMobile.value, this.progressBarMobile.max);
            });
            this.progressBarMobile.addEventListener('change', () => {
                state.isDraggingProgress = false;
                this.audio.currentTime = this.progressBarMobile.value;
            });
        }

        // Volume
        /*
        this.volumeBar.addEventListener('input', (e) => {
            const val = e.target.value;
            this.audio.volume = val / 100;
            this.updateVolumeIcon(val);
        });
        
        // Init Volume
        this.audio.volume = this.volumeBar.value / 100;
        */
        
        // Init Progress Fill
        this.progressFill = document.getElementById('progress-fill');
        this.progressHandle = document.getElementById('progress-handle');
    }

    async playList(list, index) {
        if (!list || list.length === 0) return;
        state.playlist = list;
        this.playSong(index);
    }

    async playSong(index) {
        if (index < 0 || index >= state.playlist.length) return;

        const song = state.playlist[index];
        state.currentSongIndex = index;
        this.currentSong = song; // Expose current song

        // Enable controls
        this.btnPlay.disabled = false;
        this.btnPrev.disabled = false;
        this.btnNext.disabled = false;
        this.progressBar.disabled = false;

        // Update UI
        const artistName = song.author ? song.author.split(' / ')[0] : 'Unknown';
        this.title.textContent = song.title;
        this.artist.textContent = artistName;
        this.cover.src = song.pic;
        this.cover.classList.remove('opacity-0');

        // Dispatch event for FavoritesManager
        document.dispatchEvent(new CustomEvent('player:songchange', { detail: song }));

        // Reset Theme
        this.resetTheme();

        // Reset Progress
        this.progressBar.value = 0;
        this.timeCurrent.textContent = '0:00';
        this.timeTotal.textContent = 'Loading...';

        // Update Lyrics
        LyricManager.updateInfo(song.title, artistName, song.pic);
        LyricManager.load(song.lrc || song.id);

        // Play
        if (!song.url) {
            import('./utils.js').then(({ Toast }) => {
                Toast.show('无法播放：无效的音频链接', 'error');
            });
            // Trigger error handling logic manually if URL is missing
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                setTimeout(() => this.playNext(), 1000);
            }
            return;
        }
        
        this.audio.src = song.url;
        this.audio.play().catch(e => {
            console.error("Playback failed", e);
            // Don't show toast here, let the error event handle it or just log it
            // Toast.show('播放失败，可能是版权限制', 'error');
        });
    }

    togglePlay() {
        if (this.audio.paused) {
            if (this.audio.src) this.audio.play();
        } else {
            this.audio.pause();
        }
    }

    playNext() {
        if (state.playlist.length === 0) return;
        let nextIndex = state.currentSongIndex + 1;
        if (nextIndex >= state.playlist.length) nextIndex = 0;
        this.playSong(nextIndex);
    }

    playPrev() {
        if (state.playlist.length === 0) return;
        let prevIndex = state.currentSongIndex - 1;
        if (prevIndex < 0) prevIndex = state.playlist.length - 1;
        this.playSong(prevIndex);
    }

    updatePlayState(playing) {
        state.isPlaying = playing;
        const icon = this.btnPlay.querySelector('i');
        if (playing) {
            icon.className = 'ri-pause-fill text-4xl';
        } else {
            icon.className = 'ri-play-fill text-4xl ml-1';
        }

        // Mobile
        if (this.btnPlayMobile) {
            const mobileIcon = this.btnPlayMobile.querySelector('i');
            if (playing) {
                mobileIcon.className = 'ri-pause-fill text-4xl ml-0.5';
            } else {
                mobileIcon.className = 'ri-play-fill text-4xl ml-1';
            }
        }
    }

    updateProgress() {
        if (state.isDraggingProgress) return;
        const current = this.audio.currentTime;
        const duration = this.audio.duration;
        
        if (isNaN(duration)) return;

        this.progressBar.value = current;
        this.timeCurrent.textContent = formatTime(current);
        
        // Mobile
        if (this.progressBarMobile) {
            this.progressBarMobile.max = duration;
            this.progressBarMobile.value = current;
        }
        if (this.timeCurrentMobile) this.timeCurrentMobile.textContent = formatTime(current);
        if (this.timeTotalMobile) this.timeTotalMobile.textContent = formatTime(duration);

        this.updateProgressFill(current, duration);

        // Sync Lyrics
        if (state.lyrics.length > 0) {
            LyricManager.sync(current);
        }
    }

    updateProgressFill(current, duration) {
        if (!this.progressFill) return;
        const percent = (current / duration) * 100;
        this.progressFill.style.width = `${percent}%`;
        if (this.progressHandle) {
            this.progressHandle.style.left = `${percent}%`;
        }

        // Mobile
        if (this.progressFillMobile) {
            this.progressFillMobile.style.width = `${percent}%`;
        }
        if (this.progressHandleMobile) {
            this.progressHandleMobile.style.left = `${percent}%`;
        }
    }

    updateVolumeIcon(val) {
        const icon = this.volumeIcon;
        if (val == 0) icon.className = 'ri-volume-mute-line text-gray-400 text-lg';
        else if (val < 50) icon.className = 'ri-volume-down-line text-gray-400 text-lg';
        else icon.className = 'ri-volume-up-line text-gray-400 text-lg';
    }

    extractThemeColor() {
        if (!this.colorThief) return;
        try {
            // Ensure image is loaded
            if (!this.cover.complete) return;
            
            const color = this.colorThief.getColor(this.cover);
            if (color) {
                this.applyTheme(color);
            }
        } catch (e) {
            // console.warn('Failed to extract color', e);
            // Often fails with CORS if not configured right, just ignore or reset
            this.resetTheme();
        }
    }

    applyTheme(rgb) {
        this.currentThemeRgb = rgb;
        
        if (state.isLyricViewOpen) {
            this.applyImmersiveTheme(rgb);
            return;
        }

        const [r, g, b] = rgb;
        const primaryColor = `rgb(${r},${g},${b})`;
        
        // Set CSS Variable for other components (like lyrics)
        document.documentElement.style.setProperty('--theme-color', primaryColor);

        // 1. Body Background: Subtle gradient from top (light) to bottom (slightly colored)
        // Using fixed white at top to keep header clean, color at bottom
        document.body.style.background = `linear-gradient(to top, rgba(${r},${g},${b},0.2) 0%, rgba(255,255,255,1) 100%)`;
        
        // Apply stronger tint to content area specifically
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            contentArea.style.background = `linear-gradient(to bottom right, rgba(255,255,255,0.9), rgba(${r},${g},${b},0.15))`;
        }

        // 2. Sidebar: Add a very slight tint
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.backgroundColor = `rgba(${r},${g},${b},0.03)`;
            sidebar.style.borderColor = `rgba(${r},${g},${b},0.15)`;
        }

        // 3. Player Bar: Tint border
        const playerBar = document.getElementById('player-bar');
        if (playerBar) {
             playerBar.style.borderColor = `rgba(${r},${g},${b},0.15)`;
        }
        
        // 4. Progress Bar & Handle: Use the dominant color
        const progressFill = document.getElementById('progress-fill');
        const progressHandle = document.getElementById('progress-handle');
        
        if (progressFill) progressFill.style.backgroundColor = primaryColor;
        if (progressHandle) progressHandle.style.backgroundColor = primaryColor;

        // 5. Player Controls: Tint buttons
        const btns = [this.btnPrev, this.btnPlay, this.btnNext];
        btns.forEach(btn => {
            if(btn) {
                btn.style.color = primaryColor;
                // Remove hover classes that might conflict or look weird
                btn.classList.remove('hover:text-gray-900', 'hover:text-blue-600');
            }
        });
    }

    applyImmersiveTheme(rgb) {
        const [r, g, b] = rgb;
        const lyricView = document.getElementById('lyric-view');
        const lyricBg = document.getElementById('lyric-bg');
        
        if (lyricView) {
            // Use opaque gradient based on theme color
            // Darken the bottom part slightly for better text contrast if needed, 
            // but user asked for theme color. 
            // We use rgb() to ensure opacity is 1 (solid background)
            lyricView.style.background = `linear-gradient(to bottom, rgb(${r},${g},${b}), rgb(${Math.floor(r*0.7)},${Math.floor(g*0.7)},${Math.floor(b*0.7)}))`;
            lyricView.classList.remove('bg-gray-900');
        }
        
        // Ensure the background image is visible and blends with the color
        if (lyricBg) {
            lyricBg.style.opacity = '0.4'; 
            // Optional: Add mix-blend-mode for better integration
            // lyricBg.style.mixBlendMode = 'overlay'; 
        }
    }

    resetTheme() {
        this.currentThemeRgb = null;
        if (state.isLyricViewOpen) return;

        document.documentElement.style.removeProperty('--theme-color');
        document.body.style.background = ''; // Reverts to CSS
        
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            contentArea.style.background = '';
        }
        
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.backgroundColor = '';
            sidebar.style.borderColor = '';
        }
        
        const playerBar = document.getElementById('player-bar');
        if (playerBar) {
            playerBar.style.borderColor = '';
        }
        
        const progressFill = document.getElementById('progress-fill');
        const progressHandle = document.getElementById('progress-handle');
        if (progressFill) progressFill.style.backgroundColor = '';
        if (progressHandle) progressHandle.style.backgroundColor = '';

        const btns = [this.btnPrev, this.btnPlay, this.btnNext];
        btns.forEach(btn => {
            if(btn) {
                btn.style.color = '';
                // Restore hover classes
                if (btn === this.btnPlay) btn.classList.add('hover:text-blue-600');
                else btn.classList.add('hover:text-gray-900');
            }
        });
    }
    setImmersiveMode(enable) {
        const playerBar = document.getElementById('player-bar');
        const title = document.getElementById('player-title');
        const artist = document.getElementById('player-artist');
        const btns = [this.btnPrev, this.btnPlay, this.btnNext];
        const btnLyrics = document.getElementById('btn-lyrics');
        const progressTrack = document.getElementById('progress-track');
        const progressFill = document.getElementById('progress-fill');
        
        if (enable) {
            // Mobile: Hide main player bar
            if (playerBar) {
                playerBar.classList.add('hidden', 'md:flex');
                playerBar.classList.remove('flex');
            }

            // Update Mobile Header Info
            if (this.mobileTitle && this.currentSong) {
                const titleText = this.currentSong.title;
                this.mobileTitle.innerHTML = ''; // Clear previous content
                
                // Check if text is too long (simple heuristic or measurement)
                // For simplicity, if length > 15 chars, apply marquee
                if (titleText.length > 12) {
                    const marqueeWrapper = document.createElement('div');
                    marqueeWrapper.className = 'overflow-hidden w-full';
                    const marqueeContent = document.createElement('span');
                    marqueeContent.className = 'animate-marquee text-lg font-bold text-white drop-shadow-md';
                    marqueeContent.textContent = titleText + "   " + titleText; // Duplicate for seamless loop
                    marqueeWrapper.appendChild(marqueeContent);
                    this.mobileTitle.appendChild(marqueeWrapper);
                } else {
                    this.mobileTitle.textContent = titleText;
                }
            }
            if (this.mobileArtist && this.currentSong) {
                const artistName = this.currentSong.author ? this.currentSong.author.split(' / ')[0] : 'Unknown';
                this.mobileArtist.textContent = artistName;
            }

            // Force transparent background and border
            if (playerBar) {
                playerBar.style.backgroundColor = 'transparent';
                playerBar.style.borderColor = 'transparent';
                playerBar.style.boxShadow = 'none';
                playerBar.classList.remove('bg-white/90', 'backdrop-blur-2xl'); // Remove default classes
            }
            
            // Text colors
            if (title) title.style.color = 'white';
            if (artist) artist.style.color = 'rgba(255,255,255,0.8)';
            
            // Buttons
            btns.forEach(btn => {
                if(btn) {
                    btn.style.color = 'white';
                }
            });
            
            if (btnLyrics) {
                btnLyrics.style.color = 'white';
                btnLyrics.classList.add('text-white');
                btnLyrics.classList.remove('text-gray-400');
            }

            // Progress Bar Immersive
            if (progressTrack) {
                progressTrack.classList.remove('bg-gray-200/50');
                progressTrack.style.backgroundColor = 'rgba(255,255,255,0.2)';
            }
            if (progressFill) {
                // Use white for high contrast in immersive mode
                progressFill.style.backgroundColor = '#ffffff';
                progressFill.style.boxShadow = '0 0 10px rgba(255,255,255,0.5)';
            }

            // Apply Immersive Theme if color is available
            if (this.currentThemeRgb) {
                this.applyImmersiveTheme(this.currentThemeRgb);
            }
            
        } else {
            // Restore visibility
            if (playerBar) {
                playerBar.classList.remove('hidden', 'md:flex');
                playerBar.classList.add('flex');
            }

            // Restore
            if (playerBar) {
                playerBar.style.boxShadow = ''; 
                playerBar.classList.add('bg-white/90', 'backdrop-blur-2xl');
            }
            if (title) title.style.color = '';
            if (artist) artist.style.color = '';
            if (btnLyrics) {
                btnLyrics.style.color = '';
                btnLyrics.classList.remove('text-white');
                btnLyrics.classList.add('text-gray-400');
            }

            // Restore Progress Bar
            if (progressTrack) {
                progressTrack.style.backgroundColor = '';
                progressTrack.classList.add('bg-gray-200/50');
            }
            if (progressFill) {
                progressFill.style.boxShadow = '';
                // Color will be restored by extractThemeColor
            }
            
            // Re-apply theme will handle background, border, and button colors
            this.extractThemeColor();
        }
    }
}

export const player = new Player();
