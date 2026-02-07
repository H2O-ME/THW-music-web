export async function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 10000, signal: userSignal, ...rest } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  // 如果用户提供了 signal，监听它以便手动取消
  if (userSignal) {
    userSignal.addEventListener('abort', () => controller.abort());
  }
  
  try {
    const response = await fetch(resource, {
      ...rest,
      signal: controller.signal
    });
    clearTimeout(id);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms: ${resource}`);
    }
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Network error: Unable to fetch ${resource}. The server may be down or CORS may be blocking the request.`);
    }
    throw error;
  }
}

export function normalizeSong(song: any) {
  return {
    id: song.id?.toString() || (song.url ? song.url.match(/[?&]id=(\d+)/)?.[1] : null) || Math.random().toString(36).substr(2, 9),
    name: song.title || song.name || '未知歌曲',
    artist: song.author || song.artist || (song.ar ? song.ar.map((a: any) => a.name).join('/') : '未知歌手'),
    album: song.album || song.al?.name || '',
    pic: song.pic || song.cover || song.al?.picUrl || '/default-album.png',
    url: song.url || `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`,
    lrc: song.lrc || ''
  };
}

export const API_BASE = 'https://163api.qijieya.cn';
export const METING_API = 'https://meting.elysium-stack.cn/api';

export const api = {
  getHotSearch: async (signal?: AbortSignal) => {
    try {
      // First try hot/detail for more info
      return await fetchWithTimeout(`${API_BASE}/search/hot/detail`, { signal });
    } catch (e) {
      console.warn('hot/detail failed, trying /search/hot');
      // Fallback to simpler hot search
      return await fetchWithTimeout(`${API_BASE}/search/hot`, { signal });
    }
  },
  getTopPlaylists: (signal?: AbortSignal) => fetchWithTimeout(`${API_BASE}/top/playlist`, { signal }),
  getTopArtists: (limit = 30, signal?: AbortSignal) => fetchWithTimeout(`${API_BASE}/top/artists?limit=${limit}`, { signal }),
  getNewSongs: (signal?: AbortSignal) => fetchWithTimeout(`${API_BASE}/personalized/newsong`, { signal }),
  
  search: async (keyword: string, signal?: AbortSignal) => {
    try {
      const data = await fetchWithTimeout(`${METING_API}?server=netease&type=search&id=${encodeURIComponent(keyword)}`, { signal });
      if (!Array.isArray(data)) {
        console.error('Search API returned non-array data:', data);
        return [];
      }
      return data.map(normalizeSong);
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
      console.error('Search error:', err);
      return [];
    }
  },
  
  getPlaylistTracks: async (id: string, signal?: AbortSignal) => {
    try {
      const data = await fetchWithTimeout(`${METING_API}?server=netease&type=playlist&id=${id}`, { signal });
      if (!Array.isArray(data)) {
        console.error('Playlist tracks API returned non-array data:', data);
        return [];
      }
      return data.map(normalizeSong);
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
      console.error('Fetch playlist tracks error:', err);
      return [];
    }
  },
};
