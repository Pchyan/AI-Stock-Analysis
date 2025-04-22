import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ valid: false, message: '缺少 API KEY' });

  try {
    // 發送一個最簡單的 prompt 測試
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello' }] }]
        })
      }
    );
    const data = await response.json();
    if (data.candidates && Array.isArray(data.candidates)) {
      res.status(200).json({ valid: true });
    } else {
      res.status(200).json({ valid: false, message: data.error?.message || 'API 回應異常' });
    }
  } catch (err: any) {
    res.status(500).json({ valid: false, message: '驗證過程發生錯誤' });
  }
}
