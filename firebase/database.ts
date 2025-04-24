import {
  ref,
  set,
  get,
  remove,
  update,
  child,
  push,
  query,
  orderByChild,
  equalTo
} from 'firebase/database';
import { database } from './config';
import { getCurrentUser } from './auth';

// 檢查是否在瀏覽器環境中
const isBrowser = typeof window !== 'undefined';

// 獲取當前用戶的 UID，如果未登入則返回 null
const getUserId = (): string | null => {
  const user = getCurrentUser();
  return user ? user.uid : null;
};

// 將資料儲存到指定路徑
export const saveData = async <T>(path: string, data: T, useUid = true): Promise<void> => {
  if (!isBrowser) return;

  try {
    const uid = getUserId();
    if (useUid && !uid) {
      throw new Error('用戶未登入');
    }

    const dbPath = useUid ? `users/${uid}/${path}` : path;
    const dbRef = ref(database, dbPath);
    await set(dbRef, data);
  } catch (error) {
    console.error(`儲存資料到 ${path} 失敗:`, error);
    throw error;
  }
};

// 從指定路徑獲取資料
export const getData = async <T>(path: string, useUid = true): Promise<T | null> => {
  if (!isBrowser) return null;

  try {
    const uid = getUserId();
    if (useUid && !uid) {
      throw new Error('用戶未登入');
    }

    const dbPath = useUid ? `users/${uid}/${path}` : path;
    const dbRef = ref(database, dbPath);
    const snapshot = await get(dbRef);

    if (snapshot.exists()) {
      return snapshot.val() as T;
    }
    return null;
  } catch (error) {
    console.error(`獲取 ${path} 的資料失敗:`, error);
    throw error;
  }
};

// 更新指定路徑的資料
export const updateData = async <T>(path: string, data: Partial<T>, useUid = true): Promise<void> => {
  if (!isBrowser) return;

  try {
    const uid = getUserId();
    if (useUid && !uid) {
      throw new Error('用戶未登入');
    }

    const dbPath = useUid ? `users/${uid}/${path}` : path;
    const dbRef = ref(database, dbPath);
    await update(dbRef, data);
  } catch (error) {
    console.error(`更新 ${path} 的資料失敗:`, error);
    throw error;
  }
};

// 刪除指定路徑的資料
export const deleteData = async (path: string, useUid = true): Promise<void> => {
  if (!isBrowser) return;

  try {
    const uid = getUserId();
    if (useUid && !uid) {
      throw new Error('用戶未登入');
    }

    const dbPath = useUid ? `users/${uid}/${path}` : path;
    const dbRef = ref(database, dbPath);
    await remove(dbRef);
  } catch (error) {
    console.error(`刪除 ${path} 的資料失敗:`, error);
    throw error;
  }
};

// 將資料推送到列表中並獲取唯一 ID
export const pushData = async <T>(path: string, data: T, useUid = true): Promise<string> => {
  if (!isBrowser) return '';

  try {
    const uid = getUserId();
    if (useUid && !uid) {
      throw new Error('用戶未登入');
    }

    const dbPath = useUid ? `users/${uid}/${path}` : path;
    const dbRef = ref(database, dbPath);
    const newRef = push(dbRef);
    await set(newRef, data);
    return newRef.key || '';
  } catch (error) {
    console.error(`推送資料到 ${path} 失敗:`, error);
    throw error;
  }
};

// 根據特定欄位查詢資料
export const queryByField = async <T>(path: string, field: string, value: string | number | boolean, useUid = true): Promise<T[]> => {
  if (!isBrowser) return [];

  try {
    const uid = getUserId();
    if (useUid && !uid) {
      throw new Error('用戶未登入');
    }

    const dbPath = useUid ? `users/${uid}/${path}` : path;
    const dbRef = ref(database, dbPath);
    const queryRef = query(dbRef, orderByChild(field), equalTo(value));
    const snapshot = await get(queryRef);

    if (snapshot.exists()) {
      const data: T[] = [];
      snapshot.forEach((childSnapshot) => {
        data.push({ id: childSnapshot.key, ...childSnapshot.val() } as T);
      });
      return data;
    }
    return [];
  } catch (error) {
    console.error(`查詢 ${path} 中 ${field}=${value} 的資料失敗:`, error);
    throw error;
  }
};

// 匯出資料庫
export const exportDatabase = async (): Promise<Record<string, any>> => {
  if (!isBrowser) return {};

  try {
    const uid = getUserId();
    if (!uid) {
      throw new Error('用戶未登入');
    }

    const dbRef = ref(database, `users/${uid}`);
    const snapshot = await get(dbRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }
    return {};
  } catch (error) {
    console.error('匯出資料庫失敗:', error);
    throw error;
  }
};

// 匯入資料庫
export const importDatabase = async (data: Record<string, any>): Promise<void> => {
  if (!isBrowser) return;

  try {
    console.log('開始匯入資料庫...');
    const uid = getUserId();
    if (!uid) {
      console.error('匯入資料庫失敗: 用戶未登入');
      throw new Error('用戶未登入');
    }

    console.log(`匯入資料庫到用戶 ${uid}...`);
    const dbRef = ref(database, `users/${uid}`);
    await set(dbRef, data);
    console.log('資料庫匯入成功');
  } catch (error) {
    console.error('匯入資料庫失敗:', error);
    throw error;
  }
};

// 使用特定 UID 獲取資料庫
export const getDatabaseByUid = async (uid: string): Promise<Record<string, any> | null> => {
  if (!isBrowser) return null;

  try {
    console.log(`開始獲取 UID ${uid} 的資料庫...`);
    const dbRef = ref(database, `users/${uid}`);
    const snapshot = await get(dbRef);

    if (snapshot.exists()) {
      console.log(`成功獲取 UID ${uid} 的資料庫`);
      return snapshot.val();
    }
    console.log(`UID ${uid} 的資料庫不存在`);
    return null;
  } catch (error) {
    console.error(`獲取 UID ${uid} 的資料庫失敗:`, error);
    throw error;
  }
};
