// ---------------------------------------------------------------
// 伊勢まちみっけ Service Worker
//
// 設計方針(重要):
// - index.html / login.html などのHTML(ナビゲーション)は
//   「network-first」。SWのキャッシュを優先してしまうと、
//   コードを更新してデプロイしても古い画面が出続け、それを
//   force-reloadで無理やり直そうとして「リロードループ」を
//   自分で作ってしまう。なのでHTMLは常にネットワークを優先し、
//   オフラインの時だけキャッシュにフォールバックする。
// - Leaflet(CDN)・Googleフォント・Firebase SDK(gstatic.com)は
//   バージョン固定URLで中身が変わらないので「cache-first」。
//   2回目以降の起動でこれらのダウンロード待ちが丸ごと無くなる。
// - 新しいSWがインストールされても self.skipWaiting() を自動では
//   呼ばない。呼ぶとタブが開きっぱなしの状態で急に制御が
//   切り替わり、予期しないリロードや状態不整合(≒ループ)の
//   原因になるため。更新はページ側からのメッセージを受けてから
//   反映する。
// ---------------------------------------------------------------

var SW_VERSION = 'v1';
var STATIC_CACHE = 'mm-static-' + SW_VERSION;
var PAGE_CACHE = 'mm-pages-' + SW_VERSION;

// バージョン固定で中身が変わらない外部アセットのみキャッシュ対象にする。
// (Firestore/Firebase Authの通信自体はここに含めない = 常にネットワーク)
var STATIC_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
];

var CACHE_FIRST_HOSTS = [
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.gstatic.com' // Firebase SDK (firebasejs/10.13.2/...)
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache){
      // 1つのアセット取得に失敗しても、install全体を失敗させない
      return Promise.all(
        STATIC_ASSETS.map(function(url){
          return cache.add(url).catch(function(){ /* 無視 */ });
        })
      );
    })
  );
});

// 「今すぐ更新」ボタンが押されてSKIP_WAITINGを受け取った時だけtrueにする。
// これがfalseのまま(=初回インストール時)にclients.claim()すると、
// 今まさに開いているページを突然乗っ取ってcontrollerchangeを発生させ、
// ページ側の自動リロード処理が意図せず発動してしまう(登録作業中の
// データが消える原因になっていた)。
var shouldClaimOnActivate = false;

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys
          .filter(function(k){ return k.indexOf('mm-') === 0 && k !== STATIC_CACHE && k !== PAGE_CACHE; })
          .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){
      // 明示的な更新の時だけクライアントを乗っ取る。
      // 初回インストール時は何もしない(次回のナビゲーションから
      // 自然にこのSWが使われるようにする。無用なリロードを起こさない)。
      if(shouldClaimOnActivate){
        return self.clients.claim();
      }
    })
  );
});

// ページ側から「SKIP_WAITING」を送られた時だけ、待機中のSWを有効化する。
// (自動では絶対にskipWaitingしない)
self.addEventListener('message', function(event){
  if(event.data === 'SKIP_WAITING'){
    shouldClaimOnActivate = true;
    self.skipWaiting();
  }
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method !== 'GET') return;

  var url;
  try{ url = new URL(req.url); }catch(e){ return; }

  // Firebase Auth/Firestoreの通信(firestore.googleapis.com等)や
  // その他ここで扱わないオリジンは一切介入せず、通常のネットワーク通信に任せる。

  // ---- HTMLナビゲーション: network-first ----
  var isHtmlRequest = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').indexOf('text/html') !== -1;
  if(isHtmlRequest){
    event.respondWith(
      fetch(req).then(function(res){
        var resClone = res.clone();
        caches.open(PAGE_CACHE).then(function(cache){ cache.put(req, resClone); }).catch(function(){});
        return res;
      }).catch(function(){
        return caches.match(req).then(function(cached){
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // ---- 固定バージョンの外部アセット: cache-first ----
  if(CACHE_FIRST_HOSTS.indexOf(url.host) !== -1){
    event.respondWith(
      caches.match(req).then(function(cached){
        if(cached) return cached;
        return fetch(req).then(function(res){
          var resClone = res.clone();
          caches.open(STATIC_CACHE).then(function(cache){ cache.put(req, resClone); }).catch(function(){});
          return res;
        }).catch(function(){
          return cached; // undefined = ブラウザ標準のエラー処理に任せる
        });
      })
    );
    return;
  }

  // それ以外(Firestore/Firebase Auth API等)は何もせず、通常通り通信させる。
});
