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
  console.log('初始化 Firebase...');
  console.log('Firebase 配置:', {
    apiKey: firebaseConfig.apiKey ? '已設置' : '未設置',
    authDomain: firebaseConfig.authDomain ? '已設置' : '未設置',
    databaseURL: firebaseConfig.databaseURL ? '已設置' : '未設置',
    projectId: firebaseConfig.projectId ? '已設置' : '未設置',
    storageBucket: firebaseConfig.storageBucket ? '已設置' : '未設置',
    messagingSenderId: firebaseConfig.messagingSenderId ? '已設置' : '未設置',
    appId: firebaseConfig.appId ? '已設置' : '未設置'
  });

  const apps = getApps();
  if (apps.length === 0) {
    console.log('沒有現有的 Firebase 應用，創建新的應用...');
    app = initializeApp(firebaseConfig);
  } else {
    console.log('使用現有的 Firebase 應用...');
    app = apps[0];
  }

  console.log('初始化 Firebase 身份驗證...');
  auth = getAuth(app);
  console.log('初始化 Firebase 資料庫...');
  database = getDatabase(app);
  console.log('Firebase 初始化完成');
}

export { auth, database };
export default app;
