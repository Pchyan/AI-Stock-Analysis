import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// 定義日誌條目類型
type JournalEntry = {
  id: string;
  date: string;
  content: string;
  stockSymbol?: string;
  tags?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  createdAt: string;
};

// 定義回應類型
type JournalResponse = {
  entries?: JournalEntry[];
  entry?: JournalEntry;
  success?: boolean;
  message?: string;
  error?: string;
};

// 日誌文件路徑
const DATA_DIR = path.join(process.cwd(), 'data');
const JOURNAL_FILE = path.join(DATA_DIR, 'journal.json');

// 在開發環境中確保數據目錄存在
// 在 Vercel 等部署環境中，我們會使用本地存儲代替
if (process.env.NODE_ENV === 'development' && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 讀取日誌數據
function readJournalData(): JournalEntry[] {
  // 在開發環境中使用檔案系統
  if (process.env.NODE_ENV === 'development') {
    if (!fs.existsSync(JOURNAL_FILE)) {
      return [];
    }

    try {
      const data = fs.readFileSync(JOURNAL_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('讀取日誌數據失敗:', error);
      return [];
    }
  }
  // 在部署環境中使用本地存儲
  else {
    // 在服務器端使用全局變數存儲數據
    if (typeof global.__JOURNAL_DATA === 'undefined') {
      global.__JOURNAL_DATA = [];
    }
    return global.__JOURNAL_DATA;
  }
}

// 寫入日誌數據
function writeJournalData(entries: JournalEntry[]): boolean {
  try {
    // 在開發環境中使用檔案系統
    if (process.env.NODE_ENV === 'development') {
      fs.writeFileSync(JOURNAL_FILE, JSON.stringify(entries, null, 2), 'utf8');
    }
    // 在部署環境中使用本地存儲
    else {
      global.__JOURNAL_DATA = entries;
    }
    return true;
  } catch (error) {
    console.error('寫入日誌數據失敗:', error);
    return false;
  }
}

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// 解析標籤
function parseTags(content: string): string[] {
  const tagRegex = /#(\w+)/g;
  const tags: string[] = [];
  let match;

  while ((match = tagRegex.exec(content)) !== null) {
    tags.push(match[1]);
  }

  return tags;
}

// 分析情感
function analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['買入', '看多', '看好', '上漲', '突破', '增長', '利好', '獲利', '賺', '漲'];
  const negativeWords = ['賣出', '看空', '看淡', '下跌', '跌破', '下滑', '利空', '虧損', '賠', '跌'];

  let positiveScore = 0;
  let negativeScore = 0;

  positiveWords.forEach(word => {
    if (content.includes(word)) positiveScore++;
  });

  negativeWords.forEach(word => {
    if (content.includes(word)) negativeScore++;
  });

  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<JournalResponse>
) {
  // 處理 GET 請求 - 獲取日誌
  if (req.method === 'GET') {
    const { stockSymbol, tag, limit } = req.query;
    let entries = readJournalData();

    // 根據股票代碼過濾
    if (stockSymbol && typeof stockSymbol === 'string') {
      entries = entries.filter(entry => entry.stockSymbol === stockSymbol);
    }

    // 根據標籤過濾
    if (tag && typeof tag === 'string') {
      entries = entries.filter(entry => entry.tags?.includes(tag));
    }

    // 按日期排序（最新的在前）
    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 限制返回數量
    if (limit && typeof limit === 'string') {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        entries = entries.slice(0, limitNum);
      }
    }

    return res.status(200).json({ entries });
  }

  // 處理 POST 請求 - 添加日誌
  if (req.method === 'POST') {
    const { content, stockSymbol, date } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: '內容不能為空' });
    }

    // 使用提供的日期或當前日期
    const entryDate = date || new Date().toISOString().split('T')[0].replace(/-/g, '/');

    // 解析標籤
    const tags = parseTags(content);

    // 分析情感
    const sentiment = analyzeSentiment(content);

    // 創建新日誌條目
    const newEntry: JournalEntry = {
      id: generateId(),
      date: entryDate,
      content,
      stockSymbol,
      tags,
      sentiment,
      createdAt: new Date().toISOString()
    };

    // 讀取現有日誌
    const entries = readJournalData();

    // 添加新日誌
    entries.unshift(newEntry);

    // 寫入數據
    if (writeJournalData(entries)) {
      return res.status(201).json({ entry: newEntry, success: true });
    } else {
      return res.status(500).json({ error: '保存日誌失敗' });
    }
  }

  // 處理 DELETE 請求 - 刪除日誌
  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: '缺少日誌ID' });
    }

    // 讀取現有日誌
    const entries = readJournalData();

    // 查找要刪除的日誌索引
    const index = entries.findIndex(entry => entry.id === id);

    if (index === -1) {
      return res.status(404).json({ error: '找不到指定的日誌' });
    }

    // 刪除日誌
    entries.splice(index, 1);

    // 寫入數據
    if (writeJournalData(entries)) {
      return res.status(200).json({ success: true, message: '日誌已刪除' });
    } else {
      return res.status(500).json({ error: '刪除日誌失敗' });
    }
  }

  // 處理不支持的請求方法
  return res.status(405).json({ error: '不支持的請求方法' });
}
