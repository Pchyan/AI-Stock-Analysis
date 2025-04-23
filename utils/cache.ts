interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class Cache {
  private storage: Storage;
  private prefix: string;
  private defaultExpiry: number;

  constructor(storage: Storage = localStorage, prefix: string = 'app_cache_', defaultExpiry: number = 3600000) {
    this.storage = storage;
    this.prefix = prefix;
    this.defaultExpiry = defaultExpiry; // 預設過期時間，單位為毫秒 (1小時)
  }

  /**
   * 設置緩存
   * @param key 緩存鍵
   * @param data 緩存數據
   * @param expiry 過期時間（毫秒），預設為 1 小時
   */
  set<T>(key: string, data: T, expiry: number = this.defaultExpiry): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now() + expiry
    };
    this.storage.setItem(this.prefix + key, JSON.stringify(item));
  }

  /**
   * 獲取緩存
   * @param key 緩存鍵
   * @returns 緩存數據，如果不存在或已過期則返回 null
   */
  get<T>(key: string): T | null {
    const item = this.storage.getItem(this.prefix + key);
    if (!item) return null;

    try {
      const parsedItem = JSON.parse(item) as CacheItem<T>;
      const now = Date.now();

      if (now > parsedItem.timestamp) {
        // 緩存已過期，刪除它
        this.remove(key);
        return null;
      }

      return parsedItem.data;
    } catch (error) {
      console.error('Failed to parse cache item:', error);
      return null;
    }
  }

  /**
   * 移除緩存
   * @param key 緩存鍵
   */
  remove(key: string): void {
    this.storage.removeItem(this.prefix + key);
  }

  /**
   * 清除所有緩存
   */
  clear(): void {
    const keys = Object.keys(this.storage);
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        this.storage.removeItem(key);
      }
    }
  }

  /**
   * 清除過期的緩存
   */
  clearExpired(): void {
    const keys = Object.keys(this.storage);
    const now = Date.now();

    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        const item = this.storage.getItem(key);
        if (item) {
          try {
            const parsedItem = JSON.parse(item) as CacheItem<any>;
            if (now > parsedItem.timestamp) {
              this.storage.removeItem(key);
            }
          } catch (error) {
            // 如果解析失敗，刪除該項
            this.storage.removeItem(key);
          }
        }
      }
    }
  }
}

// 創建一個全局緩存實例
const cache = new Cache();

export default cache;
