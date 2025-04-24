import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from './config';

// 檢查是否在瀏覽器環境中
const isBrowser = typeof window !== 'undefined';

// 註冊新用戶
export const registerUser = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // 更新用戶顯示名稱
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }
    return userCredential.user;
  } catch (error) {
    console.error('註冊失敗:', error);
    throw error;
  }
};

// 用戶登入
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('登入失敗:', error);
    throw error;
  }
};

// 用戶登出
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return true;
  } catch (error) {
    console.error('登出失敗:', error);
    throw error;
  }
};

// 重設密碼
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('重設密碼失敗:', error);
    throw error;
  }
};

// 獲取當前用戶
export const getCurrentUser = (): User | null => {
  if (!isBrowser) return null;
  return auth.currentUser;
};

// 監聽用戶狀態變化
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!isBrowser) return () => {};
  return onAuthStateChanged(auth, callback);
};
