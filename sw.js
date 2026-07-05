// キャッシュ名は「日付+連番」など、更新のたびに必ず変える運用を推奨
// （変え忘れても下記のネットワーク優先戦略により自動更新は機能します）
const CACHE_NAME = 'poisute-map-v2';
const APP_SHELL = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const isAppShell = APP_SHELL.some((path) => url.endsWith(path.replace('./', '')));

  if (isAppShell) {
    // ネットワーク優先：オンラインなら常に最新のindex.html/manifest.jsonを取得し、
    // 取得できたらキャッシュも更新しておく。オフライン時のみキャッシュにフォールバック。
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
  // それ以外（タイル画像・Firestore通信等）はブラウザの通常挙動に任せる
});
