// Para cache específico API/offline agenda
self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api/appointments')) {
        event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
    }
});
Dockerfile;
export {};
//# sourceMappingURL=install-sw.js.map