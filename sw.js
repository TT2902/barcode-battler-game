/**
 * Service Worker for Barcode Battler Game
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'barcode-battler-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/js/main.js',
    '/js/types.js',
    '/js/barcode-processor.js',
    '/js/creature-manager.js',
    '/js/storage-manager.js',
    '/js/camera-scanner.js',
    '/js/ai-opponent.js',
    '/js/battle-engine.js',
    '/js/battle-effects.js',
    '/js/difficulty-manager.js',
    '/js/accessibility-manager.js',
    '/js/optimization-utils.js',
    'https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});