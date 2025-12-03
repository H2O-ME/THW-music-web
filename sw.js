const CACHE_NAME = 'thw-music-v4';
const IMAGE_CACHE_NAME = 'thw-music-images-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/main.js',
    './js/api.js',
    './js/auth.js',
    './js/favorites.js',
    './js/lyrics.js',
    './js/player.js',
    './js/playlist.js',
    './js/search.js',
    './js/state.js',
    './js/supabase.js',
    './js/ui.js',
    './js/utils.js',
    './js/importer.js',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Handle Image Caching (Cross-Origin included)
    // Cache images from Netease (126.net) or other sources
    if (event.request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        event.respondWith(
            caches.open(IMAGE_CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((response) => {
                    // Return cached response if found
                    if (response) return response;

                    // Otherwise fetch from network
                    return fetch(event.request).then((networkResponse) => {
                        // Cache the new response (clone it because response stream can only be read once)
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        // Fallback for images if offline and not cached
                        // You could return a placeholder image here if you have one cached
                    });
                });
            })
        );
        return;
    }

    // 2. Handle App Shell & Static Assets (Same Origin)
    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    // Cache hit - return response
                    if (response) {
                        return response;
                    }
                    return fetch(event.request);
                })
        );
    }
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});