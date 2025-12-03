let API_BASE = 'https://meting.tianhw.top/api';
const SERVER = 'netease'; // 强制使用网易云音乐

// Helper to replace domain
const fixDomain = (str) => {
    if (typeof str === 'string') {
        let result = str.replace(/meting\.elysium-stack\.cn/g, 'meting.tianhw.top');
        // Force HTTPS for 126.net music domains (p1, p2, p3, p4, etc.)
        result = result.replace(/http:\/\/(p\d+\.music\.126\.net)/g, 'https://$1');
        return result;
    }
    return str;
};

const fixData = (data) => {
    if (Array.isArray(data)) {
        return data.map(item => fixData(item));
    } else if (typeof data === 'object' && data !== null) {
        for (const key in data) {
            data[key] = fixData(data[key]);
        }
        return data;
    } else {
        return fixDomain(data);
    }
};

// Simple in-memory cache
const apiCache = new Map();

export const api = {
    /**
     * 配置 API
     * @param {string} baseUrl 
     * @param {string} serverType (Ignored)
     */
    setConfig(baseUrl, serverType) {
        if (baseUrl) API_BASE = fixDomain(baseUrl);
        // SERVER is constant 'netease'
    },

    /**
     * 获取当前配置
     */
    getConfig() {
        return { API_BASE, SERVER };
    },

    /**
     * 搜索歌曲
     * @param {string} keyword 
     * @param {AbortSignal} signal
     */
    async search(keyword, signal = null) {
        try {
            const response = await fetch(`${API_BASE}?server=${SERVER}&type=search&id=${encodeURIComponent(keyword)}`, { signal });
            if (!response.ok) throw new Error('Network response was not ok');
            let data = await response.json();
            data = fixData(data);
            
            // Post-process to ensure ID exists
            return data.map(song => {
                if (!song.id && song.url) {
                    const match = song.url.match(/[?&]id=(\d+)/);
                    if (match) song.id = match[1];
                }
                return song;
            });
        } catch (error) {
            if (error.name === 'AbortError') {
                // console.log('Search aborted');
                return [];
            }
            console.error('Search failed:', error);
            return [];
        }
    },

    /**
     * 获取歌单列表 (Top Playlists)
     */
    async getTopPlaylists() {
        const cacheKey = 'top_playlists';
        if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);

        try {
            const response = await fetch('https://wyy.tianhw.top/top/playlist');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.code === 200) {
                apiCache.set(cacheKey, data.playlists);
                return data.playlists;
            }
            return [];
        } catch (error) {
            console.error('Get top playlists failed:', error);
            return [];
        }
    },

    /**
     * 获取歌单详情 (Playlist Tracks)
     * @param {string|number} id
     */
    async getPlaylistDetail(id) {
        // Cache playlist details by ID
        const cacheKey = `playlist_${id}`;
        if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);

        try {
            const response = await fetch(`https://wyy.tianhw.top/playlist/track/all?id=${id}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.code === 200) {
                apiCache.set(cacheKey, data.songs);
                return data.songs;
            }
            return [];
        } catch (error) {
            console.error('Get playlist detail failed:', error);
            return [];
        }
    },

    /**
     * 获取歌曲播放链接
     * @param {string|number} id 
     */
    async getSongUrl(id) {
        try {
            const response = await fetch(`${API_BASE}?server=${SERVER}&type=url&id=${id}`);
            if (!response.ok) throw new Error('Network response was not ok');
            let data = await response.json();
            return fixData(data);
        } catch (error) {
            console.error('Get song url failed:', error);
            return null;
        }
    },

    /**
     * 获取歌曲详情
     * @param {string|number} id 
     */
    async getSongDetail(id) {
        try {
            const response = await fetch(`${API_BASE}?server=${SERVER}&type=song&id=${id}`);
            if (!response.ok) throw new Error('Network response was not ok');
            let data = await response.json();
            return fixData(data);
        } catch (error) {
            console.error('Get song detail failed:', error);
            return null;
        }
    },

    /**
     * 获取歌词
     * @param {string|number} idOrUrl 
     * @param {AbortSignal} signal
     */
    async getLyric(idOrUrl, signal = null) {
        try {
            let url = idOrUrl;
            // If it's not a full URL, construct it
            if (!String(idOrUrl).startsWith('http')) {
                url = `${API_BASE}?server=${SERVER}&type=lrc&id=${idOrUrl}`;
            }

            url = fixDomain(url);

            const response = await fetch(url, { signal });
            if (!response.ok) throw new Error('Network response was not ok');
            // Meting API for lrc usually returns the lrc content directly or json
            // Let's check content type or try json first
            let text = await response.text();
            text = fixDomain(text);

            try {
                const json = JSON.parse(text);
                return json.lyric || json.lrc || text;
            } catch (e) {
                return text;
            }
        } catch (error) {
            if (error.name === 'AbortError') return '';
            console.error('Get lyric failed:', error);
            return '';
        }
    },

    /**
     * 获取封面图片链接 (直接构造 URL)
     * @param {string|number} id 
     */
    getPicUrl(id) {
        return `${API_BASE}?server=${SERVER}&type=pic&id=${id}`;
    },

    /**
     * 获取歌单列表 (Top Playlists)
     */
    async getTopPlaylists() {
        const cacheKey = 'top_playlists';
        if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);

        try {
            const response = await fetch('https://wyy.tianhw.top/top/playlist');
            if (!response.ok) throw new Error('Network response was not ok');
            let data = await response.json();
            if (data.code === 200) {
                data.playlists = fixData(data.playlists);
                apiCache.set(cacheKey, data.playlists);
                return data.playlists;
            }
            return [];
        } catch (error) {
            console.error('Get top playlists failed:', error);
            return [];
        }
    },

    /**
     * 获取歌单详情 (Playlist Tracks)
     * @param {string|number} id
     */
    async getPlaylistDetail(id) {
        const cacheKey = `playlist_${id}`;
        if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);

        try {
            const response = await fetch(`https://wyy.tianhw.top/playlist/track/all?id=${id}`);
            if (!response.ok) throw new Error('Network response was not ok');
            let data = await response.json();
            if (data.code === 200) {
                data.songs = fixData(data.songs);
                apiCache.set(cacheKey, data.songs);
                return data.songs;
            }
            return [];
        } catch (error) {
            console.error('Get playlist detail failed:', error);
            return [];
        }
    },

    /**
     * 获取热搜列表
     */
    async getHotSearch() {
        const cacheKey = 'hot_search';
        if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);

        try {
            const response = await fetch('https://wyy.tianhw.top/search/hot/detail');
            if (!response.ok) throw new Error('Network response was not ok');
            let json = await response.json();
            let data = json.data || [];
            data = fixData(data);
            apiCache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Get hot search failed:', error);
            return [];
        }
    },

    /**
     * 获取热门歌手
     */
    async getTopArtists() {
        const cacheKey = 'top_artists';
        if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);

        try {
            const response = await fetch('https://wyy.tianhw.top/top/artists?limit=30');
            if (!response.ok) throw new Error('Network response was not ok');
            let json = await response.json();
            let data = json.artists || [];
            data = fixData(data);
            apiCache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Get top artists failed:', error);
            return [];
        }
    },

    /**
     * 获取搜索建议
     * @param {string} keywords
     * @param {AbortSignal} signal
     */
    async getSearchSuggestions(keywords, signal = null) {
        if (!keywords) return null;
        try {
            const response = await fetch(`https://wyy.tianhw.top/search/suggest?keywords=${encodeURIComponent(keywords)}`, { signal });
            if (!response.ok) throw new Error('Network response was not ok');
            let json = await response.json();
            if (json.code === 200 && json.result) {
                return fixData(json.result);
            }
            return null;
        } catch (error) {
            if (error.name === 'AbortError') return null;
            console.error('Get search suggestions failed:', error);
            return null;
        }
    },

    /**
     * 获取新歌推荐
     */
    async getNewSongs() {
        const cacheKey = 'new_songs';
        if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);

        try {
            const response = await fetch('https://wyy.tianhw.top/personalized/newsong');
            if (!response.ok) throw new Error('Network response was not ok');
            let json = await response.json();
            if (json.code === 200 && json.result) {
                let result = fixData(json.result);
                apiCache.set(cacheKey, result);
                return result;
            }
            return [];
        } catch (error) {
            console.error('Get new songs failed:', error);
            return [];
        }
    }
};
