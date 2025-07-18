// service-worker.js: Service Worker for PWA capabilities (caching) (GitHub Pages Path Fix)

const CACHE_NAME = 'class-period-timer-v6'; // Increment cache version for this update
const ASSETS = [
    './', // Cache the root of the app (index.html)
    'index.html',
    'src/script.js',
    'src/storage.js',
    'src/ui.js',
    'assets/bell.mp3',
    'manifest.json',
    // PWA Icons (ensure these paths match your actual icon files)
    'assets/icons/icon-72x72.png',
    'assets/icons/icon-96x96.png',
    'assets/icons/icon-128x128.png',
    'assets/icons/icon-144x144.png',
    'assets/icons/icon-152x152.png',
    'assets/icons/icon-192x192.png',
    'assets/icons/icon-384x384.png',
    'assets/icons/icon-512x512.png'
];

// Install event: Caches all static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching assets...');
                // Ensure all asset paths are relative to the service worker's scope
                return cache.addAll(ASSETS);
            })
            .catch((error) => {
                console.error('Service Worker: Caching failed', error);
            })
    );
});

// Activate event: Cleans up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                    return null;
                })
            );
        })
    );
});

// Fetch event: Serves cached assets first, then falls back to network
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then((networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        console.log('Service Worker: Fetch failed for', event.request.url);
                        return new Response('<h1>Offline</h1>', {
                            headers: { 'Content-Type': 'text/html' }
                        });
                    });
            })
    );
});