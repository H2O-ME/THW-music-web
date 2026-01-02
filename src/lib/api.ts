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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export const API_BASE = 'https://163api.qijieya.cn';
export const METING_API = 'https://meting.tianhw.top/api';

export const api = {
  getHotSearch: (signal?: AbortSignal) => fetchWithTimeout(`${API_BASE}/search/hot/detail`, { signal }),
  getTopPlaylists: (signal?: AbortSignal) => fetchWithTimeout(`${API_BASE}/top/playlist`, { signal }),
  getTopArtists: (limit = 30, signal?: AbortSignal) => fetchWithTimeout(`${API_BASE}/top/artists?limit=${limit}`, { signal }),
  getNewSongs: (signal?: AbortSignal) => fetchWithTimeout(`${API_BASE}/personalized/newsong`, { signal }),
  
  search: async (keyword: string, signal?: AbortSignal) => {
    const data = await fetchWithTimeout(`${METING_API}?server=netease&type=search&id=${encodeURIComponent(keyword)}`, { signal });
    return (data || []).map((song: any) => ({
      ...song,
      id: song.id || (song.url ? song.url.match(/[?&]id=(\d+)/)?.[1] : null) || Math.random().toString(36).substr(2, 9),
      name: song.title || song.name,
      artist: song.author || song.artist,
      album: song.album || ''
    }));
  },
  
  getPlaylistTracks: async (id: string, signal?: AbortSignal) => {
    const data = await fetchWithTimeout(`${METING_API}?server=netease&type=playlist&id=${id}`, { signal });
    return (data || []).map((song: any) => ({
      ...song,
      id: song.id || (song.url ? song.url.match(/[?&]id=(\d+)/)?.[1] : null) || Math.random().toString(36).substr(2, 9),
      name: song.title || song.name,
      artist: song.author || song.artist,
      album: song.album || ''
    }));
  },
};
