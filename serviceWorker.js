const CACHE_NAME = 'Cache-v1'
const ASSET_DIR_NAME = 'files';

const useCache = request => {
  if (request.mode === 'navigate') {
    return false;
  }
  if (request.method !== 'GET') {
    return false;
  }
  return request.url.includes(ASSET_DIR_NAME);
};

self.addEventListener('install', event => {
    console.log('install');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            var promises = [];
            keys.forEach(function(cacheName) {
                if (cacheName != CACHE_NAME) promises.push(caches.delete(cacheName));
            });
            return Promise.all(promises);
        })
    );
});

self.addEventListener('fetch', event => {
    if (!useCache(event.request)) return;
    const normalizedUrl = new URL(event.request.url);
    const pathname = normalizedUrl.pathname;

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(pathname).then(responseCache => {
                // query も完全一致していたら返却する。
                if (responseCache && responseCache.url === event.request.url) {
                    return responseCache;
                }
                return fetch(event.request.url).then(response => {
                    if (!response.ok) {
                        return response;
                    }
                    return cache.put(pathname, response.clone()).then(() => response);
                });
            });
        })
    );
});