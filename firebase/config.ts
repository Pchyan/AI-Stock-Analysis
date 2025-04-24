import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

// 檢查是否在瀏覽器環境中
const isBrowser = typeof window !== 'undefined';

// Firebase 設定
// 注意：這些值應該從環境變數中獲取，或在生產環境中使用其他安全的方式存儲
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// 初始化 Firebase
let app: FirebaseApp;
let auth: Auth;
let database: Database;

// 只在瀏覽器環境中初始化 Firebase
if (isBrowser) {
  const apps = getApps();
  if (apps.length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = apps[0];
  }

  auth = getAuth(app);
  database = getDatabase(app);
}

export { auth, database };
export default app;
