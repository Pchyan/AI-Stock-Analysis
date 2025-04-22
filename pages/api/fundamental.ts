import type { NextApiRequest, NextApiResponse } from 'next';

// 範例：假設從 Yahoo Finance 或其他 API 取得基本面資料
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol } = req.query;
  // TODO: 實際應用時請調整為真實 API
  try {
    // 這裡僅回傳 mock 資料
    res.status(200).json({
      pe: 15.2,
      yield: 3.8,
      roe: 11.6,
      healthScore: '良好',
      peerCompare: '略高於同業'
    });
  } catch (err) {
    res.status(500).json({ error: '基本面資料獲取失敗', detail: err });
  }
}
