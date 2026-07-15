<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<title>Treasure Seeker | 伊勢のお宝探し</title>
<meta name="description" content="伊勢のまちに落ちているゴミを「宝物」として発見・記録するゲーミフィケーションアプリ">
<link rel="manifest" href="./manifest.json">
<meta name="theme-color" content="#4E6B4A">
<link rel="apple-touch-icon" href="./icons/icon-192.png">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Yusei+Magic&family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">

<style>
/* ============================================================
   Treasure Seeker - デザイントークン
   ============================================================ */
:root{
  --bg-cream: #F3EEDF;
  --card: #FFFDF7;
  --green-deep: #4E6B4A;
  --green-soft: #7C9A72;
  --terracotta: #C97B4A;
  --gold: #C9962E;
  --ink: #4A3B2E;
  --ink-soft: #8A7B68;
  --line: #DCD3BC;
  --danger: #B85C4A;
  --shadow: 0 6px 20px rgba(74,59,46,0.18);
  --radius-blob: 42% 58% 61% 39% / 45% 40% 60% 55%;
}

*{ box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
html,body{ height:100%; margin:0; overscroll-behavior:none; }
body{
  font-family:'Zen Maru Gothic', sans-serif;
  color:var(--ink);
  background:var(--bg-cream);
  position:fixed; inset:0; overflow:hidden;
}
h1,h2,h3,.font-hand{ font-family:'Yusei Magic', 'Zen Maru Gothic', sans-serif; }
button{ font-family:inherit; border:none; background:none; cursor:pointer; -webkit-appearance:none; }
.hidden{ display:none !important; }

#app{ position:fixed; inset:0; }
#map{ position:absolute; inset:0; z-index:1; background:#e5e0d0; }
.leaflet-control-attribution{ font-size:9px !important; background:rgba(255,253,247,0.75) !important; }

/* ---------- ヘッダー ---------- */
#header-bar{
  position:absolute; top:0; left:0; right:0; z-index:20;
  display:flex; justify-content:space-between; align-items:center;
  padding: calc(env(safe-area-inset-top,0px) + 12px) 14px 0;
  pointer-events:none;
}
.header-btn{
  pointer-events:auto;
  display:flex; align-items:center; gap:6px;
  background:var(--card); color:var(--ink);
  padding:9px 14px; border-radius:999px; box-shadow:var(--shadow);
  font-size:14px; font-weight:700; border:2px solid var(--card);
  transition:transform .15s ease;
}
.header-btn:active{ transform:scale(0.94); }
#rank-badge-btn{ font-family:'Yusei Magic', sans-serif; color:var(--green-deep); }
#locate-btn{ font-size:18px; padding:9px 11px; }

/* ---------- 更新バナー ---------- */
#update-banner{
  position:absolute; top:calc(env(safe-area-inset-top,0px) + 62px); left:14px; right:14px; z-index:30;
  background:var(--green-deep); color:#fff; border-radius:16px; padding:12px 14px;
  display:flex; align-items:center; justify-content:space-between; box-shadow:var(--shadow);
  font-size:13px;
}
#update-btn{ background:#fff; color:var(--green-deep); font-weight:700; padding:6px 12px; border-radius:999px; font-size:12px; }

/* ---------- CTA ---------- */
#discover-cta{
  position:absolute; left:50%; bottom:calc(env(safe-area-inset-bottom,0px) + 28px);
  transform:translateX(-50%);
  z-index:20;
  background:var(--terracotta); color:#fff;
  font-family:'Yusei Magic', sans-serif; font-size:17px;
  padding:16px 30px; border-radius:999px;
  box-shadow:0 8px 22px rgba(201,123,74,0.5);
  display:flex; align-items:center; gap:8px;
  border:3px solid #fff;
  transition:transform .15s ease;
}
#discover-cta:active{ transform:translateX(-50%) scale(0.95); }

/* ---------- トースト ---------- */
#toast{
  position:absolute; left:50%; bottom:120px; transform:translateX(-50%);
  background:var(--ink); color:#fff; padding:10px 18px; border-radius:12px;
  font-size:13px; z-index:60; box-shadow:var(--shadow); max-width:80vw; text-align:center;
}

/* ---------- オーバーレイ共通 ---------- */
.overlay{
  position:absolute; inset:0; z-index:50;
  background:rgba(74,59,46,0.45);
  display:flex; align-items:flex-end; justify-content:center;
  animation: fadeIn .2s ease;
}
.overlay.center{ align-items:center; padding:20px; }
@keyframes fadeIn{ from{opacity:0} to{opacity:1} }

.sheet{
  width:100%; max-width:480px;
  background:var(--card);
  border-radius:26px 26px 0 0;
  padding: 22px 22px calc(env(safe-area-inset-bottom,0px) + 22px);
  max-height:88vh; overflow-y:auto;
  box-shadow:0 -8px 30px rgba(0,0,0,0.25);
  animation: slideUp .25s cubic-bezier(.2,.8,.3,1);
  position:relative;
}
.card-center{
  width:100%; max-width:420px; background:var(--card);
  border-radius:26px; padding:26px 22px; box-shadow:var(--shadow);
  animation: popIn .25s cubic-bezier(.3,1.2,.4,1);
  position:relative;
}
@keyframes slideUp{ from{transform:translateY(40px); opacity:0} to{transform:translateY(0); opacity:1} }
@keyframes popIn{ from{transform:scale(0.85); opacity:0} to{transform:scale(1); opacity:1} }

.close-btn{
  position:absolute; top:14px; right:14px; width:32px; height:32px;
  border-radius:50%; background:var(--bg-cream); color:var(--ink-soft);
  font-size:18px; display:flex; align-items:center; justify-content:center;
  z-index:5;
}

.sheet-handle{
  width:40px; height:5px; background:var(--line); border-radius:99px;
  margin:0 auto 16px;
}

/* ---------- 発見フロー ---------- */
.flow-step{ text-align:center; padding-top:6px; }
.flow-step h2{ font-size:19px; margin:6px 0 6px; color:var(--green-deep); }
.flow-step p{ color:var(--ink-soft); font-size:13px; line-height:1.7; margin:0 0 18px; }

.spinner-blob{
  width:64px; height:64px; margin:10px auto 18px;
  border-radius:var(--radius-blob);
  background:linear-gradient(135deg, var(--green-soft), var(--green-deep));
  animation: spin 1.6s linear infinite, morph 3s ease-in-out infinite;
}
@keyframes spin{ to{ transform:rotate(360deg);} }
@keyframes morph{
  0%,100%{ border-radius:42% 58% 61% 39% / 45% 40% 60% 55%; }
  50%{ border-radius:58% 42% 39% 61% / 55% 60% 40% 45%; }
}

.gps-accuracy{ font-size:12px; color:var(--gold); font-weight:700; margin-top:-8px; margin-bottom:14px;}

.btn-primary{
  width:100%; background:var(--green-deep); color:#fff; font-weight:700;
  padding:15px; border-radius:16px; font-size:15px; margin-top:6px;
  box-shadow:0 4px 14px rgba(78,107,74,0.35);
}
.btn-primary:active{ transform:scale(0.98); }
.btn-secondary{
  width:100%; background:var(--bg-cream); color:var(--ink); font-weight:700;
  padding:14px; border-radius:16px; font-size:14px; margin-top:10px; border:2px solid var(--line);
}
.btn-danger-outline{
  width:100%; background:#fff; color:var(--danger); font-weight:700;
  padding:14px; border-radius:16px; font-size:14px; margin-top:10px; border:2px solid var(--danger);
}

/* ---------- ゴミ種別選択 ---------- */
.type-grid{
  display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:16px 0 8px;
}
.type-chip{
  display:flex; flex-direction:column; align-items:center; gap:6px;
  padding:14px 6px; border-radius:16px; border:2px solid var(--line);
  background:#fff; font-size:12px; font-weight:700; color:var(--ink-soft);
  transition:all .15s ease;
}
.type-chip .emoji{ font-size:26px; }
.type-chip.selected{
  border-color:var(--terracotta); background:#FFF3EC; color:var(--terracotta);
  transform:scale(1.04);
}
.collect-check{
  display:flex; align-items:center; gap:10px; text-align:left;
  background:var(--bg-cream); padding:12px 14px; border-radius:14px; margin-top:14px; font-size:13px;
}
.collect-check input{ width:20px; height:20px; accent-color:var(--green-deep); }

/* ---------- 発見完了演出 ---------- */
.stamp-pop{
  width:120px; height:120px; margin:6px auto 8px; position:relative;
}
.stamp-ring{
  width:120px; height:120px; border-radius:50%;
  border:6px solid var(--terracotta);
  display:flex; align-items:center; justify-content:center;
  font-size:52px;
  animation: stampDown .5s cubic-bezier(.3,1.6,.4,1);
  box-shadow:0 0 0 6px rgba(201,123,74,0.15);
  background:#fff;
}
@keyframes stampDown{
  0%{ transform:scale(2.4) rotate(-18deg); opacity:0; }
  60%{ transform:scale(0.92) rotate(3deg); opacity:1; }
  100%{ transform:scale(1) rotate(-6deg); opacity:1; }
}
.stamp-count-line{ font-size:15px; color:var(--ink-soft); margin-top:2px; }
.stamp-count-num{ font-family:'Yusei Magic', sans-serif; color:var(--terracotta); font-size:22px; }

.rankup-banner{
  margin:16px 0; padding:16px; border-radius:18px;
  background:linear-gradient(135deg,#FFF6E3,#FFE9B8);
  border:2px dashed var(--gold);
}
.rankup-banner .label{ font-size:11px; color:var(--gold); font-weight:700; letter-spacing:.05em; }
.rankup-banner .rank-name{ font-family:'Yusei Magic', sans-serif; font-size:20px; color:#8a6415; margin-top:2px; }

/* ---------- スタンプ帳 ---------- */
.rank-progress-wrap{ margin:18px 0; }
.rank-progress-bar{ height:14px; background:var(--bg-cream); border-radius:99px; overflow:hidden; border:1px solid var(--line); }
.rank-progress-fill{ height:100%; background:linear-gradient(90deg,var(--green-soft),var(--green-deep)); border-radius:99px; transition:width .5s ease; }
.rank-progress-label{ font-size:12px; color:var(--ink-soft); margin-top:6px; text-align:center; }

.badge-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-top:16px; }
.badge-item{
  aspect-ratio:1; border-radius:18px; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:4px; font-size:11px; font-weight:700;
  background:var(--bg-cream); color:var(--ink-soft); border:2px solid var(--line);
}
.badge-item .emoji{ font-size:26px; filter:grayscale(1); opacity:.4; }
.badge-item.earned{ background:#FFF6E3; border-color:var(--gold); color:#8a6415; }
.badge-item.earned .emoji{ filter:none; opacity:1; }

/* ---------- シェアモーダル ---------- */
.share-preview{
  width:100%; border-radius:18px; overflow:hidden; box-shadow:var(--shadow);
  margin-bottom:16px; background:#eee; aspect-ratio:9/16; max-height:46vh; object-fit:cover;
}
.tag-box{
  background:var(--bg-cream); border-radius:14px; padding:12px 14px; font-size:12.5px;
  color:var(--ink-soft); margin-bottom:12px; word-break:break-word; line-height:1.6;
}
.share-btn-row{ display:flex; gap:10px; }
.share-btn-row .btn-primary, .share-btn-row .btn-secondary{ margin-top:0; }

/* ---------- ピン・マーカー ---------- */
.ts-pin{
  width:34px; height:34px; display:flex; align-items:center; justify-content:center;
  background:#fff; border-radius:50% 50% 50% 4px; transform:rotate(-45deg);
  box-shadow:0 3px 8px rgba(0,0,0,0.3); border:2px solid var(--terracotta);
}
.ts-pin span{ transform:rotate(45deg); font-size:16px; }
.ts-pin.me{ border-color:var(--green-deep); }

/* レスポンシブ微調整 */
@media (max-width:340px){
  #discover-cta{ font-size:15px; padding:14px 24px; }
}
</style>
</head>
<body>

<div id="app">
  <div id="map"></div>

  <!-- ヘッダー -->
  <div id="header-bar">
    <button id="rank-badge-btn" class="header-btn" aria-label="スタンプ帳を開く">
      <span id="header-rank-icon">🔰</span><span id="header-rank-count">0</span>
    </button>
    <button id="locate-btn" class="header-btn" aria-label="現在地に移動">📍</button>
  </div>

  <!-- 更新バナー -->
  <div id="update-banner" class="hidden">
    <span>新しいバージョンがあります</span>
    <button id="update-btn">更新する</button>
  </div>

  <!-- CTA -->
  <button id="discover-cta">📷&nbsp;宝物を発見する</button>

  <!-- カメラ用の隠しinput -->
  <input type="file" id="camera-input" accept="image/*" capture="environment" style="display:none">

  <!-- トースト -->
  <div id="toast" class="hidden"></div>

  <!-- ============ 発見フロー ============ -->
  <div id="flow-overlay" class="overlay hidden">
    <div class="sheet">
      <div class="sheet-handle"></div>
      <button class="close-btn" id="flow-close">×</button>

      <!-- GPS取得中 -->
      <div id="step-gps" class="flow-step hidden">
        <div class="spinner-blob"></div>
        <h2>現在地を確認しています</h2>
        <p>GPSの精度によって少し時間がかかることがあります。</p>
      </div>

      <!-- 重複チェック中 -->
      <div id="step-dup-check" class="flow-step hidden">
        <div class="spinner-blob"></div>
        <h2>このあたりを調べています…</h2>
        <p>すでに報告された宝物がないか確認しています。</p>
      </div>

      <!-- 重複あり -->
      <div id="step-dup-found" class="flow-step hidden">
        <div style="font-size:44px; margin-bottom:6px;">🗺️</div>
        <h2>ここは発見済みのエリアです</h2>
        <p>すでに近くで報告があります。まだゴミが残っている場合は「まだあるよ」で追加報告できます。</p>
        <button class="btn-primary" id="btn-dup-continue">まだあるよ（追加報告する）</button>
        <button class="btn-secondary" id="btn-dup-cancel">やめておく</button>
      </div>

      <!-- 種別選択 -->
      <div id="step-type-select" class="flow-step hidden">
        <h2>何を見つけた？</h2>
        <p>あてはまるものをタップしてね</p>
        <div class="type-grid" id="type-grid"></div>
        <label class="collect-check">
          <input type="checkbox" id="collected-check">
          <span>今回、自分で回収した（回収は任意です）</span>
        </label>
        <button class="btn-primary" id="btn-submit-discovery" disabled>この内容で発見報告する</button>
      </div>

      <!-- アップロード中 -->
      <div id="step-uploading" class="flow-step hidden">
        <div class="spinner-blob"></div>
        <h2>宝物を記録しています…</h2>
        <p>写真をお宝マップに刻んでいます。少々お待ちください。</p>
      </div>

      <!-- 完了演出 -->
      <div id="step-complete" class="flow-step hidden">
        <div class="stamp-pop"><div class="stamp-ring">🏅</div></div>
        <h2 class="font-hand">宝物を発見しました！</h2>
        <div class="stamp-count-line">累計スタンプ <span class="stamp-count-num" id="complete-stamp-count">0</span> 個</div>

        <div id="rankup-banner" class="rankup-banner hidden">
          <div class="label">RANK UP!</div>
          <div class="rank-name" id="rankup-name"></div>
        </div>

        <button class="btn-primary" id="btn-open-share">📤&nbsp;Instagramでシェアする</button>
        <button class="btn-secondary" id="btn-back-to-map">地図に戻る</button>
      </div>
    </div>
  </div>

  <!-- ============ スタンプ帳モーダル ============ -->
  <div id="stamp-modal" class="overlay center hidden">
    <div class="card-center">
      <button class="close-btn" id="stamp-close">×</button>
      <div style="text-align:center;">
        <div style="font-size:46px;" id="stamp-modal-icon">🔰</div>
        <h2 class="font-hand" id="stamp-modal-rank" style="color:var(--green-deep); margin:6px 0 2px;">見習いシーカー</h2>
        <div style="color:var(--ink-soft); font-size:13px;">これまでの発見数 <b id="stamp-modal-count">0</b> 個</div>
      </div>
      <div class="rank-progress-wrap">
        <div class="rank-progress-bar"><div class="rank-progress-fill" id="rank-progress-fill" style="width:0%"></div></div>
        <div class="rank-progress-label" id="rank-progress-label">次のランクまであと5個</div>
      </div>
      <div class="badge-grid" id="badge-grid"></div>
    </div>
  </div>

  <!-- ============ シェアモーダル ============ -->
  <div id="share-modal" class="overlay hidden">
    <div class="sheet">
      <div class="sheet-handle"></div>
      <button class="close-btn" id="share-close">×</button>
      <h2 style="color:var(--green-deep); font-size:17px; margin-top:0;">シェア画像ができました</h2>
      <img id="share-preview-img" class="share-preview" alt="シェア用画像プレビュー">
      <div class="tag-box" id="share-tags"></div>
      <div class="share-btn-row">
        <button class="btn-secondary" id="btn-copy-tags" style="flex:1;">タグをコピー</button>
        <button class="btn-primary" id="btn-do-share" style="flex:1;">画像を共有／保存</button>
      </div>
    </div>
  </div>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>

<script type="module">
/* ============================================================
   Treasure Seeker - メインロジック
   ============================================================ */

// ---------- ★★★ Firebase設定（ここを自分のプロジェクトの値に書き換えてください） ★★★ ----------
// Firebaseコンソール → プロジェクトの設定 → 全般 → マイアプリ の SDK構成 に表示される値をコピペします。
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
// -----------------------------------------------------------------------------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, doc, setDoc, query, where, getDocs,
  GeoPoint, serverTimestamp, limit, Timestamp, getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// ★ Firebase Storageは使いません（2024年10月以降、新規プロジェクトでのバケット作成に
//   Blazeプラン＝クレジットカード登録が必須になったため）。
//   代わりに画像はJPEG圧縮＋Base64化してFirestoreのドキュメントに直接保存します。
//   これによりSparkプラン（無料・カード登録不要）のままFirestoreだけで運用できます。

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- 定数 ----------
const DEFAULT_CENTER = [34.4859, 136.7091]; // 伊勢市付近（GPS取得後に上書きされます）
const DUP_RADIUS_DEG = 4;          // グリッドID丸め桁数（小数点以下4桁 ≒ 半径11m程度）
const DUP_WINDOW_DAYS = 30;        // 重複チェックの有効期間
const MAP_FETCH_LIMIT = 300;       // 1回のFirestore取得上限（無料枠保護）
const IMAGE_MAX_BYTES = 700000;    // 圧縮後Blobの目標上限（Base64化で約1.37倍→Firestore1ドキュメント1MB制限に対して余裕を持たせる）

const WASTE_TYPES = [
  { id:'petbottle', label:'ペットボトル', emoji:'🧴' },
  { id:'can',       label:'空き缶',       emoji:'🥫' },
  { id:'bag',       label:'レジ袋・ビニール', emoji:'🛍️' },
  { id:'cigarette', label:'吸い殻',       emoji:'🚬' },
  { id:'foodpack',  label:'食品容器',     emoji:'🍱' },
  { id:'fishing',   label:'漁具・釣り糸', emoji:'🎣' },
  { id:'glass',     label:'ガラス・陶器', emoji:'🍾' },
  { id:'other',     label:'その他',       emoji:'❓' },
];

const RANKS = [
  { name:'見習いシーカー', min:0,  icon:'🔰' },
  { name:'一人前シーカー', min:5,  icon:'🥉' },
  { name:'ベテランシーカー', min:15, icon:'🥈' },
  { name:'伝説のシーカー', min:30, icon:'🥇' },
];

// ---------- 匿名ID ----------
function getAnonId(){
  let id = localStorage.getItem('ts_anon_id');
  if(!id){
    id = (crypto.randomUUID ? crypto.randomUUID() : 'ts-' + Date.now() + '-' + Math.random().toString(16).slice(2));
    localStorage.setItem('ts_anon_id', id);
  }
  return id;
}
const ANON_ID = getAnonId();

// ---------- トースト ----------
let toastTimer = null;
function showToast(msg, ms=2400){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> el.classList.add('hidden'), ms);
}

// ---------- 地図初期化 ----------
const map = L.map('map', { zoomControl:false, attributionControl:true }).setView(DEFAULT_CENTER, 15);
L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
  attribution: '地図: <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">国土地理院</a>',
  maxZoom: 18
}).addTo(map);
L.control.zoom({ position:'bottomright' }).addTo(map);

let meMarker = null;
let currentPos = null; // {lat,lng,accuracy}

function updateMeMarker(lat,lng){
  if(meMarker){ meMarker.setLatLng([lat,lng]); return; }
  const icon = L.divIcon({
    className:'', html:'<div class="ts-pin me"><span>🧭</span></div>',
    iconSize:[34,34], iconAnchor:[17,34]
  });
  meMarker = L.marker([lat,lng], {icon, zIndexOffset:1000}).addTo(map);
}

function locateMe(recenter=true){
  if(!navigator.geolocation){ showToast('この端末では位置情報が使えません'); return; }
  navigator.geolocation.getCurrentPosition(
    (pos)=>{
      currentPos = { lat:pos.coords.latitude, lng:pos.coords.longitude, accuracy:pos.coords.accuracy };
      updateMeMarker(currentPos.lat, currentPos.lng);
      if(recenter) map.setView([currentPos.lat, currentPos.lng], Math.max(map.getZoom(),16));
    },
    (err)=>{ console.warn('geolocation error', err); },
    { enableHighAccuracy:true, timeout:12000, maximumAge:15000 }
  );
}
document.getElementById('locate-btn').addEventListener('click', ()=> locateMe(true));
locateMe(true); // 起動時に一度取得（地図はすでに表示済みなので体感速度に影響しない）

// ---------- 発見ピン・ヒートマップの読み込み ----------
let markerLayer = L.layerGroup().addTo(map);
let heatLayer = null;
let lastFetchedAt = 0;

async function loadNearbyDiscoveries(){
  const now = Date.now();
  if(now - lastFetchedAt < 8000) return; // 連続呼び出し防止（moveend等の連打対策）
  lastFetchedAt = now;

  try{
    // MVPでは「直近作成順に上限件数」で取得し、無料枠を保護します。
    // 将来的に投稿数が増えたら地図の表示範囲(bounds)での絞り込みに拡張してください。
    const q = query(collection(db,'discoveries'), limit(MAP_FETCH_LIMIT));
    const snap = await getDocs(q);

    markerLayer.clearLayers();
    const heatPoints = [];

    snap.forEach(doc=>{
      const d = doc.data();
      if(!d.location) return;
      const lat = d.location.latitude, lng = d.location.longitude;
      const type = WASTE_TYPES.find(t=>t.id===d.wasteType) || WASTE_TYPES[WASTE_TYPES.length-1];

      const icon = L.divIcon({
        className:'', html:`<div class="ts-pin"><span>${type.emoji}</span></div>`,
        iconSize:[34,34], iconAnchor:[17,34]
      });
      L.marker([lat,lng], {icon}).addTo(markerLayer)
        .bindPopup(`<b>${type.label}</b><br><span style="font-size:12px;color:#8A7B68;">${d.collected ? '回収済み' : '未回収の可能性あり'}</span>`);

      heatPoints.push([lat, lng, 0.6]);
    });

    if(heatLayer) map.removeLayer(heatLayer);
    if(heatPoints.length){
      heatLayer = L.heatLayer(heatPoints, { radius:28, blur:22, maxZoom:17, minOpacity:0.25 }).addTo(map);
    }
  }catch(e){
    console.error('loadNearbyDiscoveries failed', e);
    // Firebase未設定時などはここで静かに失敗させる（地図の基本表示は継続させる）
  }
}
loadNearbyDiscoveries();
map.on('moveend', ()=> loadNearbyDiscoveries());

// ---------- グリッドID（重複チェック用） ----------
function toGridId(lat, lng){
  return lat.toFixed(DUP_RADIUS_DEG) + '_' + lng.toFixed(DUP_RADIUS_DEG);
}

async function checkDuplicate(gridId){
  const windowStart = new Date(Date.now() - DUP_WINDOW_DAYS*24*60*60*1000);
  const q = query(
    collection(db,'discoveries'),
    where('gridId','==', gridId),
    where('createdAt','>', Timestamp.fromDate(windowStart)),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0];
}

// ---------- スタンプ数・ランク ----------
function getRank(count){
  let cur = RANKS[0];
  for(const r of RANKS){ if(count >= r.min) cur = r; }
  return cur;
}
function getNextRank(count){
  return RANKS.find(r => r.min > count) || null;
}

async function getMyStampCount(){
  try{
    const q = query(collection(db,'discoveries'), where('anonId','==', ANON_ID));
    const snap = await getCountFromServer(q);
    return snap.data().count;
  }catch(e){
    console.error('count fetch failed', e);
    return 0;
  }
}

async function refreshHeaderRank(){
  const count = await getMyStampCount();
  const rank = getRank(count);
  document.getElementById('header-rank-icon').textContent = rank.icon;
  document.getElementById('header-rank-count').textContent = count;
  return { count, rank };
}
refreshHeaderRank();

// ---------- スタンプ帳モーダル ----------
const stampModal = document.getElementById('stamp-modal');
document.getElementById('rank-badge-btn').addEventListener('click', openStampModal);
document.getElementById('stamp-close').addEventListener('click', ()=> stampModal.classList.add('hidden'));

async function openStampModal(){
  stampModal.classList.remove('hidden');
  const count = await getMyStampCount();
  const rank = getRank(count);
  const next = getNextRank(count);

  document.getElementById('stamp-modal-icon').textContent = rank.icon;
  document.getElementById('stamp-modal-rank').textContent = rank.name;
  document.getElementById('stamp-modal-count').textContent = count;

  const fill = document.getElementById('rank-progress-fill');
  const label = document.getElementById('rank-progress-label');
  if(next){
    const prevMin = rank.min;
    const pct = Math.min(100, Math.round(((count - prevMin) / (next.min - prevMin)) * 100));
    fill.style.width = pct + '%';
    label.textContent = `次の「${next.name}」まであと${next.min - count}個`;
  }else{
    fill.style.width = '100%';
    label.textContent = '最高ランクに到達しました！';
  }

  const grid = document.getElementById('badge-grid');
  grid.innerHTML = '';
  RANKS.forEach(r=>{
    const earned = count >= r.min;
    const el = document.createElement('div');
    el.className = 'badge-item' + (earned ? ' earned' : '');
    el.innerHTML = `<span class="emoji">${r.icon}</span><span>${r.name}</span>`;
    grid.appendChild(el);
  });
}

// ---------- 発見フロー state ----------
const flowOverlay = document.getElementById('flow-overlay');
const steps = ['step-gps','step-dup-check','step-dup-found','step-type-select','step-uploading','step-complete']
  .reduce((o,id)=>{ o[id]=document.getElementById(id); return o; }, {});

let flowState = {
  photoDataUrl:null, lat:null, lng:null, gridId:null,
  wasteType:null, collected:false, dupDocSnap:null
};

function showStep(id){
  Object.values(steps).forEach(el=> el.classList.add('hidden'));
  steps[id].classList.remove('hidden');
}
function openFlow(){ flowOverlay.classList.remove('hidden'); }
function closeFlow(){
  flowOverlay.classList.add('hidden');
  flowState = { photoDataUrl:null, lat:null, lng:null, gridId:null, wasteType:null, collected:false, dupDocSnap:null };
  document.getElementById('collected-check').checked = false;
  document.getElementById('btn-submit-discovery').disabled = true;
  document.querySelectorAll('.type-chip.selected').forEach(el=>el.classList.remove('selected'));
}
document.getElementById('flow-close').addEventListener('click', closeFlow);

// カメラ起動 → フロー開始
document.getElementById('discover-cta').addEventListener('click', ()=>{
  document.getElementById('camera-input').click();
});
document.getElementById('camera-input').addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  e.target.value = ''; // 同じ写真を選び直せるようリセット
  if(!file) return;

  openFlow();
  showStep('step-gps');

  try{
    const [dataUrl, pos] = await Promise.all([
      compressImageToDataUrl(file, 1000, 0.68),
      getPositionPromise()
    ]);
    flowState.photoDataUrl = dataUrl;
    flowState.lat = pos.lat; flowState.lng = pos.lng;
    flowState.gridId = toGridId(pos.lat, pos.lng);

    showStep('step-dup-check');
    const dup = await checkDuplicate(flowState.gridId);
    if(dup){
      flowState.dupDocSnap = dup;
      showStep('step-dup-found');
    }else{
      showStep('step-type-select');
    }
  }catch(err){
    console.error(err);
    showToast('位置情報の取得に失敗しました。設定を確認してください。');
    closeFlow();
  }
});

function getPositionPromise(){
  return new Promise((resolve, reject)=>{
    if(!navigator.geolocation){ reject(new Error('no geolocation')); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat:pos.coords.latitude, lng:pos.coords.longitude, accuracy:pos.coords.accuracy }),
      err => reject(err),
      { enableHighAccuracy:true, timeout:15000, maximumAge:5000 }
    );
  });
}

// 画像を読み込んでCanvasに描画するところまでを共通化
function loadImageFromFile(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('file read error'));
    reader.onload = (e)=>{
      const img = new Image();
      img.onerror = () => reject(new Error('image decode error'));
      img.onload = () => resolve(img);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas, quality){
  return new Promise((resolve, reject)=>{
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/jpeg', quality);
  });
}

function blobToDataUrl(blob){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('blob read error'));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// 撮影した写真を圧縮し、Firestoreに直接保存できるBase64 DataURLに変換します。
// Firestoreの1ドキュメント1MB制限に収まるよう、サイズが大きい場合は
// 画質→解像度の順に段階的に下げて再試行します（Storageを使わないための工夫）。
async function compressImageToDataUrl(file, maxWidth=1000, startQuality=0.68){
  const img = await loadImageFromFile(file);

  const attempts = [
    { width: maxWidth,       quality: startQuality },
    { width: maxWidth,       quality: 0.5 },
    { width: Math.round(maxWidth*0.75), quality: 0.5 },
    { width: Math.round(maxWidth*0.6),  quality: 0.4 },
  ];

  let lastBlob = null;
  for(const attempt of attempts){
    let w = img.width, h = img.height;
    if(w > attempt.width){ h = Math.round(h * (attempt.width / w)); w = attempt.width; }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    const blob = await canvasToBlob(canvas, attempt.quality);
    lastBlob = blob;
    if(blob.size <= IMAGE_MAX_BYTES) break;
  }

  return await blobToDataUrl(lastBlob); // "data:image/jpeg;base64,...."
}

// 重複あり画面のボタン
document.getElementById('btn-dup-continue').addEventListener('click', ()=> showStep('step-type-select'));
document.getElementById('btn-dup-cancel').addEventListener('click', closeFlow);

// 種別選択グリッド生成
const typeGrid = document.getElementById('type-grid');
WASTE_TYPES.forEach(t=>{
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'type-chip';
  chip.innerHTML = `<span class="emoji">${t.emoji}</span><span>${t.label}</span>`;
  chip.addEventListener('click', ()=>{
    document.querySelectorAll('.type-chip.selected').forEach(el=>el.classList.remove('selected'));
    chip.classList.add('selected');
    flowState.wasteType = t.id;
    document.getElementById('btn-submit-discovery').disabled = false;
  });
  typeGrid.appendChild(chip);
});
document.getElementById('collected-check').addEventListener('change', (e)=>{
  flowState.collected = e.target.checked;
});

// 発見報告の送信
document.getElementById('btn-submit-discovery').addEventListener('click', async ()=>{
  if(!flowState.wasteType || !flowState.photoDataUrl) return;
  showStep('step-uploading');

  try{
    const countBefore = await getMyStampCount();

    // ★ discoveries（座標・種別など軽量な情報のみ）と
    //   discoveryPhotos（Base64画像のみ、docIdをdiscoveriesと揃える）を分けて保存します。
    //   こうすることで、地図のピン一覧を取得するときに毎回画像データまで
    //   ダウンロードしてしまうのを防ぎ、Firestoreの無料枠（読み取り件数・転送量）を守ります。
    const discoveryRef = await addDoc(collection(db,'discoveries'), {
      anonId: ANON_ID,
      location: new GeoPoint(flowState.lat, flowState.lng),
      gridId: flowState.gridId,
      wasteType: flowState.wasteType,
      hasImage: true,
      collected: !!flowState.collected,
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, 'discoveryPhotos', discoveryRef.id), {
      imageDataUrl: flowState.photoDataUrl
    });

    const countAfter = countBefore + 1;
    const prevRank = getRank(countBefore);
    const newRank = getRank(countAfter);
    const rankedUp = newRank.name !== prevRank.name;

    document.getElementById('complete-stamp-count').textContent = countAfter;
    const banner = document.getElementById('rankup-banner');
    if(rankedUp){
      banner.classList.remove('hidden');
      document.getElementById('rankup-name').textContent = `${newRank.icon} ${newRank.name}`;
      confetti({ particleCount:120, spread:90, origin:{ y:0.6 } });
    }else{
      banner.classList.add('hidden');
    }

    showStep('step-complete');
    refreshHeaderRank();
    loadNearbyDiscoveries();

  }catch(err){
    console.error('submit failed', err);
    showToast('送信に失敗しました。通信環境を確認してもう一度お試しください。');
    showStep('step-type-select');
  }
});

document.getElementById('btn-back-to-map').addEventListener('click', closeFlow);

// ---------- シェア機能 ----------
const shareModal = document.getElementById('share-modal');
document.getElementById('share-close').addEventListener('click', ()=> shareModal.classList.add('hidden'));

let lastShareDataUrl = null;
const SHARE_TAGS = '#TreasureSeeker #伊勢のお宝探し #伊勢志摩 #海ごみゼロ #環境保全';

document.getElementById('btn-open-share').addEventListener('click', async ()=>{
  try{
    await document.fonts.load('60px "Yusei Magic"');
    await document.fonts.load('36px "Zen Maru Gothic"');
  }catch(e){ /* フォント未ロードでも続行 */ }

  const type = WASTE_TYPES.find(t=>t.id===flowState.wasteType) || WASTE_TYPES[WASTE_TYPES.length-1];
  const count = document.getElementById('complete-stamp-count').textContent;
  const dataUrl = await generateShareCard(flowState.photoDataUrl, count, type.label);
  lastShareDataUrl = dataUrl;

  document.getElementById('share-preview-img').src = dataUrl;
  document.getElementById('share-tags').textContent = SHARE_TAGS;
  shareModal.classList.remove('hidden');
});

function loadImageEl(src){
  return new Promise((resolve,reject)=>{
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function generateShareCard(photoDataUrl, stampCount, wasteLabel){
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 背景
  const grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, '#F3EEDF');
  grad.addColorStop(1, '#E9E0C8');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);

  // 写真（正方形クロップで中央に配置）
  try{
    const img = await loadImageEl(photoDataUrl);
    const size = W - 160;
    const sx = 80, sy = 260;
    const minSide = Math.min(img.width, img.height);
    const cropX = (img.width - minSide) / 2;
    const cropY = (img.height - minSide) / 2;

    ctx.save();
    roundRectPath(ctx, sx, sy, size, size, 40);
    ctx.clip();
    ctx.drawImage(img, cropX, cropY, minSide, minSide, sx, sy, size, size);
    ctx.restore();

    ctx.strokeStyle = '#FFFDF7';
    ctx.lineWidth = 10;
    roundRectPath(ctx, sx, sy, size, size, 40);
    ctx.stroke();
  }catch(e){ console.warn('image draw failed', e); }

  // タイトル
  ctx.fillStyle = '#4E6B4A';
  ctx.font = '64px "Yusei Magic"';
  ctx.textAlign = 'center';
  ctx.fillText('宝物、発見！', W/2, 170);

  // 判子風スタンプマーク
  ctx.save();
  ctx.translate(W - 150, 1230);
  ctx.rotate(-0.18);
  ctx.strokeStyle = '#C97B4A';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0,0,80,0,Math.PI*2);
  ctx.stroke();
  ctx.fillStyle = '#C97B4A';
  ctx.font = '38px "Yusei Magic"';
  ctx.fillText('発見', 0, 15);
  ctx.restore();

  // 情報テキスト
  ctx.textAlign = 'left';
  ctx.fillStyle = '#4A3B2E';
  ctx.font = '44px "Zen Maru Gothic"';
  ctx.fillText(`種別： ${wasteLabel}`, 80, 1370);
  ctx.fillStyle = '#C97B4A';
  ctx.font = '700 44px "Zen Maru Gothic"';
  ctx.fillText(`累計スタンプ ${stampCount} 個`, 80, 1440);

  // フッター
  ctx.fillStyle = '#8A7B68';
  ctx.font = '32px "Zen Maru Gothic"';
  ctx.fillText('Treasure Seeker — 伊勢のお宝探し', 80, 1800);

  return canvas.toDataURL('image/jpeg', 0.92);
}

function roundRectPath(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
}

document.getElementById('btn-copy-tags').addEventListener('click', async ()=>{
  try{
    await navigator.clipboard.writeText(SHARE_TAGS);
    showToast('タグをコピーしました');
  }catch(e){
    showToast('コピーに失敗しました。長押しで選択してコピーしてください。');
  }
});

document.getElementById('btn-do-share').addEventListener('click', async ()=>{
  if(!lastShareDataUrl) return;
  try{
    const blob = await (await fetch(lastShareDataUrl)).blob();
    const file = new File([blob], 'treasure-seeker.jpg', { type:'image/jpeg' });
    if(navigator.canShare && navigator.canShare({ files:[file] })){
      await navigator.share({ files:[file], title:'Treasure Seeker', text:'宝物を発見しました！ ' + SHARE_TAGS });
      return;
    }
  }catch(e){
    console.warn('share failed, falling back to download', e);
  }
  // フォールバック：ダウンロード
  const a = document.createElement('a');
  a.href = lastShareDataUrl;
  a.download = 'treasure-seeker.jpg';
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast('画像を保存しました');
});

// ---------- Service Worker登録＆更新バナー（強制リロードループを避ける設計） ----------
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js').then(reg=>{
      reg.addEventListener('updatefound', ()=>{
        const newWorker = reg.installing;
        if(!newWorker) return;
        newWorker.addEventListener('statechange', ()=>{
          if(newWorker.state === 'installed' && navigator.serviceWorker.controller){
            document.getElementById('update-banner').classList.remove('hidden');
            document.getElementById('update-btn').onclick = ()=>{
              newWorker.postMessage('SKIP_WAITING');
            };
          }
        });
      });
    }).catch(e => console.warn('SW registration failed', e));

    // controllerchangeでのリロードは「ユーザーが更新ボタンを押した後」の一度きりに限定する
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', ()=>{
      if(reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  });
}
</script>
</body>
</html>
