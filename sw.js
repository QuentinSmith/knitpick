/* Knitpick service worker — offline-first.
   Precaches the icons + manifest; caches everything else (the page itself,
   Google Fonts, etc.) the first time it's fetched, then serves from cache. */
const CACHE = "knitpick-v3";
const CORE = ["manifest.json", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(CORE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then(hit =>
      hit ||
      fetch(req).then(res => {
        // stash a copy of successful responses for next time (incl. fonts)
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit)
    )
  );
});
