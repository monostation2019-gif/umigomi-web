# Treasure Seeker セットアップ手順

このフォルダには以下が入っています。

```
treasure-seeker/
├─ index.html      … アプリ本体（これ1ファイルでほぼ全機能が動きます）
├─ manifest.json   … PWA設定
├─ sw.js           … Service Worker（オフラインキャッシュ・更新制御）
├─ icons/          … アプリアイコン置き場（★自分で用意する必要あり）
└─ README.md       … このファイル
```

まちみっけとは別のFirebaseプロジェクトとして立ち上げる前提の手順です。

### ★重要：Firebase Storageは使いません

2024年10月以降、Firebaseは新規プロジェクトで Cloud Storage を使う場合に **Blazeプラン（従量課金プラン・クレジットカード登録）への切り替えを必須**にしました。無料枠自体は維持されるものの、カード登録を避けたい場合はStorageを使わない設計にする必要があります。

そこでTreasure Seekerでは、撮影した写真をその場でJPEG圧縮＋Base64化し、Firestoreのドキュメントに直接保存する方式にしています（まちみっけの初期構築と同じ考え方です）。これにより **Sparkプラン（無料・カード登録不要）のまま、Firestoreだけで運用できます**。

- 地図表示・重複チェック・スタンプ集計に使う `discoveries` コレクションには画像を含めません（軽量に保つため）
- 画像本体は `discoveryPhotos` コレクション（idは`discoveries`と同じ）に分けて保存します
- 1件あたりの画像は圧縮後おおよそ数百KB程度に収まるよう自動調整されます（Firestoreの1ドキュメント1MB制限に対応）

---

## 1. Firebaseプロジェクトを新規作成する

1. https://console.firebase.google.com/ を開き、「プロジェクトを追加」
2. プロジェクト名は例えば `treasure-seeker` など、まちみっけと区別できる名前にする
3. Googleアナリティクスは任意（不要ならOFFでよい）

## 2. Firestore Database を有効化する（Storageは触らない）

1. 左メニュー「構築」→「Firestore Database」→「データベースの作成」
2. ロケーションは `asia-northeast1`（東京）を推奨
3. 開始時は「テストモードで開始」でOK（後で下記のルールに置き換えます）
4. **「Storage」のメニューには入らないでください**。Storageの初期設定（バケット作成）に触れると、その時点でBlazeプランへのアップグレードを求められることがあります。Treasure SeekerはStorageを一切使わないので、そのままでOKです。

もしFirestoreデータベースの作成自体で同様のBilling要求が出た場合は、一度プロジェクトを作り直す（Analyticsをオフにする、リージョンを変える等）か、時間を置いて再試行してみてください。それでも解消しない場合は教えてください。

## 3. Webアプリを登録し、SDK設定値を取得する

1. プロジェクト概要の「</> (Web)」アイコンをクリックしてWebアプリを追加
2. アプリのニックネームは任意（例: treasure-seeker-web）
3. 表示された `firebaseConfig` の中身（apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId）をコピー
   - `storageBucket` の値は使いませんが、コピーしておいて問題ありません
4. `index.html` を開き、`firebaseConfig` の該当箇所（`YOUR_API_KEY` など）を実際の値に書き換えて保存

## 4. Firestoreセキュリティルールを設定する

Firebaseコンソール → Firestore Database → 「ルール」タブで、以下に置き換えてください。`discoveries`（軽量データ）と `discoveryPhotos`（画像データ）の2コレクション分のルールです。

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /discoveries/{docId} {
      allow read: if true;

      allow create: if
        request.resource.data.keys().hasAll(['anonId','location','gridId','wasteType','createdAt'])
        && request.resource.data.anonId is string
        && request.resource.data.wasteType is string
        && request.resource.data.gridId is string;

      // MVPでは投稿の編集・削除は許可しない（Phase2で検討）
      allow update, delete: if false;
    }

    match /discoveryPhotos/{docId} {
      allow read: if true;

      allow create: if
        request.resource.data.keys().hasAll(['imageDataUrl'])
        && request.resource.data.imageDataUrl is string
        && request.resource.data.imageDataUrl.size() < 900000; // 約900KBまで

      allow update, delete: if false;
    }
  }
}
```

## 5. Firestoreの複合インデックスを作成する（初回投稿テスト時）

重複チェック機能は `gridId`（等価）と `createdAt`（範囲）の両方で検索するため、複合インデックスが必要です。

- 初めてアプリで発見報告を試したとき、ブラウザのコンソール（開発者ツール）にFirestoreからのエラーメッセージと一緒に「インデックスを作成」というリンクが表示されます。
- そのリンクをクリックするだけで自動的に必要なインデックスが作成されます（数分で反映）。
- リンクが出てから投稿がうまくいくまで少し時間がかかることがあるので、慌てず数分待ってから再テストしてください。

## 6. アイコン画像を用意する

`icons/` フォルダに以下のファイルを置いてください（PNG形式）。

- `icon-192.png`（192×192px）
- `icon-512.png`（512×512px）
- `icon-maskable-512.png`（512×512px、周囲に余白を持たせたセーフゾーン対応版）

まだ用意がなければ、レーザー彫刻用に作った親方キャラの素材を流用したり、Canvaなどで仮アイコンを作ってひとまず動作確認を優先してもOKです。

## 7. GitHub + Vercelでデプロイする

1. このフォルダの中身をGitHubの新規リポジトリ（例: `treasure-seeker`）にpush
2. Vercelで「Add New Project」→ そのリポジトリをImport
3. Framework Presetは「Other」でOK（静的ファイルのみのため、ビルドコマンドは空欄）
4. Deployするとサブドメイン（例: `treasure-seeker.vercel.app`）が発行されます

## 8. 動作確認チェックリスト

- [ ] スマホ実機でアクセスし、地図が3秒以内に表示されるか
- [ ] 「📷 宝物を発見する」からカメラが起動するか
- [ ] 位置情報の許可ダイアログが出て、GPSが取得できるか
- [ ] 発見報告後、地図にピンが追加され、スタンプ数が増えるか
- [ ] 同じ場所で連続投稿すると「発見済みのエリア」表示になるか
- [ ] ランクアップ時に紙吹雪演出が出るか（5個到達で「一人前シーカー」になります）
- [ ] Instagramシェア画像が生成され、共有 or 保存できるか
- [ ] ホーム画面に追加してPWAとして起動できるか（Safariの「共有」→「ホーム画面に追加」）

## 9. 今後の拡張候補（Phase 2以降・今回は未実装）

- 発見履歴のマイページ表示（自分の投稿一覧）
- オフライン時の投稿キュー（電波復帰後の自動送信）
- 地図表示範囲(bounds)に応じたクエリの絞り込み（投稿数が増えてきたら対応）
- 学区別・町別ランキング（まちみっけの`GAKKU_MAP`資産を流用可能）
- 投稿数が増えて無料枠（Firestore: 読み取り5万回/日・書き込み2万回/日・ストレージ1GiB）が気になってきたら、その時点でBlazeプランへの切り替え＋予算アラート設定を検討する

## 補足：それでもBillingを求められる場合

Firestoreのデータベース作成自体でもBilling要求が出るケースが稀に報告されています。その場合は以下を試してください。

1. 数分〜半日ほど時間を置いて再試行する（一時的なシステム側の反映遅延であることがあります）
2. 別リージョン（例: `us-central1`）で試してみる
3. どうしても解消しない場合は、Firebase以外の無料BaaS（Supabase等）への切り替えも選択肢に入りますが、その場合はアプリ側のデータ層をまるごと作り直す必要があるため、まずは1〜2を試すのがおすすめです
