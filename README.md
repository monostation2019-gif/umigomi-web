/*
 * 最小限のService Worker。
 * 「アプリの外枠(index.html)」だけをキャッシュしておくことで、
 * 電波が不安定な海辺でも一度開いたことがあればアプリの起動自体はできるようにする。
 * データ(Firestoreの内容)はオンライン時のみ取得される。
 */
const CACHE_NAME = "umigomi-web-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Firebase等の外部通信はキャッシュせずそのままネットワークへ流す
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
