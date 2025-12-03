import { api } from './api.js';
import { FavoritesManager } from './favorites.js';
import { Toast } from './utils.js';

export class ImporterManager {
    static init() {
        this.btnImport = document.getElementById('btn-import-playlist');
        this.modal = document.getElementById('import-modal');
        this.input = document.getElementById('import-playlist-id');
        this.btnConfirm = document.getElementById('btn-confirm-import');
        this.btnCancel = document.getElementById('btn-cancel-import');
        this.progressContainer = document.getElementById('import-progress');
        this.progressBar = document.getElementById('import-progress-bar');
        this.progressText = document.getElementById('import-progress-text');
        this.logContainer = document.getElementById('import-log');

        if (this.btnImport) {
            this.btnImport.addEventListener('click', () => this.showModal());
        }

        if (this.btnConfirm) {
            this.btnConfirm.addEventListener('click', () => this.handleImport());
        }

        if (this.btnCancel) {
            this.btnCancel.addEventListener('click', () => this.hideModal());
        }

        // Close on click outside
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.hideModal();
            });
        }
    }

    static showModal() {
        this.modal.classList.remove('hidden');
        this.modal.classList.remove('opacity-0');
        this.input.value = '';
        this.resetProgress();
    }

    static hideModal() {
        this.modal.classList.add('opacity-0');
        setTimeout(() => {
            this.modal.classList.add('hidden');
        }, 300);
    }

    static resetProgress() {
        this.progressContainer.classList.add('hidden');
        this.progressBar.style.width = '0%';
        this.progressText.textContent = '';
        this.logContainer.innerHTML = '';
        this.input.disabled = false;
        this.btnConfirm.disabled = false;
        this.btnConfirm.innerHTML = '开始导入';
    }

    static async handleImport() {
        const inputVal = this.input.value.trim();
        if (!inputVal) {
            Toast.show('请输入歌单ID', 'error');
            return;
        }

        // Extract ID from URL if user pasted a URL
        let playlistId = inputVal;
        const match = inputVal.match(/[?&]id=(\d+)/);
        if (match) {
            playlistId = match[1];
        }

        if (!/^\d+$/.test(playlistId)) {
            Toast.show('无效的歌单ID', 'error');
            return;
        }

        // Start Import
        this.input.disabled = true;
        this.btnConfirm.disabled = true;
        this.btnConfirm.innerHTML = '<i class="ri-loader-4-line animate-spin"></i> 导入中...';
        this.progressContainer.classList.remove('hidden');
        
        this.log('正在获取歌单信息...');

        try {
            // 1. Get Playlist Tracks
            // Using the URL provided by user: https://wyy.tianhw.top/playlist/track/all?id=...
            const response = await fetch(`https://wyy.tianhw.top/playlist/track/all?id=${playlistId}`);
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            
            if (data.code !== 200 || !data.songs) {
                throw new Error('获取歌单失败');
            }

            const songs = data.songs;
            const total = songs.length;
            this.log(`获取成功，共 ${total} 首歌曲`);

            let successCount = 0;
            let failCount = 0;
            let processedCount = 0;

            // 2. Process songs with concurrency
            const CONCURRENCY = 3; // Process 3 songs at a time to avoid rate limiting
            const queue = [...songs];
            
            const worker = async () => {
                while (queue.length > 0) {
                    const song = queue.shift();
                    
                    let skipped = false;
                    try {
                        // Check for duplicate
                        if (FavoritesManager.favorites.has(String(song.id))) {
                            this.log(`已存在: ${song.name}`, 'text-gray-500');
                            skipped = true;
                            continue;
                        }

                        // Construct search keyword: Name + First Artist
                        const artist = song.ar && song.ar.length > 0 ? song.ar[0].name : '';
                        const keyword = `${song.name} ${artist}`;
                        
                        // Search
                        const searchResults = await api.search(keyword);
                        
                        if (searchResults && searchResults.length > 0) {
                            // Take the first result
                            const targetSong = searchResults[0];
                            
                            // Add to favorites
                            await FavoritesManager.addFavorite(targetSong);
                            successCount++;
                        } else {
                            failCount++;
                            this.log(`未找到: ${song.name}`, 'text-red-500');
                        }
                    } catch (err) {
                        console.error(err);
                        failCount++;
                        this.log(`出错: ${song.name}`, 'text-red-500');
                    } finally {
                        processedCount++;
                        const progress = Math.round((processedCount / total) * 100);
                        this.progressBar.style.width = `${progress}%`;
                        this.progressText.textContent = `${processedCount}/${total}`;
                        
                        // Small random delay to be nicer to the API
                        if (!skipped) {
                            await new Promise(r => setTimeout(r, Math.random() * 300 + 100));
                        }
                    }
                }
            };

            // Start workers
            const workers = Array(CONCURRENCY).fill(null).map(() => worker());
            await Promise.all(workers);

            this.log(`导入完成! 成功: ${successCount}, 失败: ${failCount}`, 'text-green-600 font-bold');
            Toast.show(`导入完成! 成功 ${successCount} 首`, 'success');
            
            // Refresh favorites list if we are on favorites page
            FavoritesManager.showFavoritesPage();

        } catch (error) {
            console.error(error);
            this.log(`导入失败: ${error.message}`, 'text-red-600 font-bold');
            Toast.show('导入失败', 'error');
        } finally {
            this.btnConfirm.disabled = false;
            this.btnConfirm.innerHTML = '开始导入';
            this.input.disabled = false;
        }
    }

    static log(msg, classes = 'text-gray-600') {
        const div = document.createElement('div');
        div.className = `text-xs ${classes} mb-1`;
        div.textContent = msg;
        this.logContainer.appendChild(div);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }
}
