/* ========================================================================
   Firebase設定
   Firebaseコンソール（https://console.firebase.google.com）でプロジェクトを作成し、
   「プロジェクトの設定」→「マイアプリ」からWebアプリを追加して、
   表示される firebaseConfig の値をここに貼り付けてください。
   また Authentication で「Google」「匿名」の2つのログイン方法を有効にし、
   Firestore Database を（本番モードで）作成してください。
   このファイルは login.html と index.html の両方から読み込まれます。
========================================================================= */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* ---------- ゲストの重複しない連番発行 ----------
   Firestoreのトランザクションでカウンターをアトミックにインクリメントする。
   同時に複数人がゲストログインしても、必ず一意な番号が払い出される。
------------------------------------------------- */
async function issueUniqueGuestName(uid){
  const counterRef = db.collection("counters").doc("guestCounter");
  const userRef = db.collection("users").doc(uid);

  return db.runTransaction(async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const current = counterSnap.exists ? (counterSnap.data().value || 0) : 0;
    const next = current + 1;
    const guestName = "ゲスト" + String(next).padStart(4, "0");

    tx.set(counterRef, { value: next }, { merge: true });
    tx.set(userRef, {
      uid: uid,
      displayName: guestName,
      isGuest: true,
      guestNumber: next,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return guestName;
  });
}

async function upsertGoogleUser(user){
  const userRef = db.collection("users").doc(user.uid);
  await userRef.set({
    uid: user.uid,
    displayName: user.displayName || "伊勢の探検家",
    photoURL: user.photoURL || null,
    email: user.email || null,
    isGuest: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

async function fetchUserProfile(uid){
  const snap = await db.collection("users").doc(uid).get();
  return snap.exists ? snap.data() : {};
}
