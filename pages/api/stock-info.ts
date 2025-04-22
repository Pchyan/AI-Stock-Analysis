import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type StockInfo = {
  name?: string;
  exDividendDate?: string;
  lastExDividendDate?: string;
  exRightDate?: string;
  lastExRightDate?: string;
  cashDividendPerShare?: number;
  stockDividendPerShare?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: '請提供股票代碼' });
  }

  try {
    // 使用 FinMind API 獲取股票名稱
    const nameResponse = await axios.get('https://api.finmindtrade.com/api/v4/data', {
      params: {
        dataset: 'TaiwanStockInfo',
        data_id: symbol,
      }
    });

    // 使用 FinMind API 獲取除權息資訊
    const dividendResponse = await axios.get('https://api.finmindtrade.com/api/v4/data', {
      params: {
        dataset: 'TaiwanStockDividend',
        data_id: symbol,
        start_date: new Date(new Date().getFullYear() - 2, 0, 1).toISOString().split('T')[0], // 獲取最近兩年的數據
      }
    });

    // 使用 FinMind API 獲取除權息結果
    const dividendResultResponse = await axios.get('https://api.finmindtrade.com/api/v4/data', {
      params: {
        dataset: 'TaiwanStockDividendResult',
        data_id: symbol,
        start_date: new Date(new Date().getFullYear() - 2, 0, 1).toISOString().split('T')[0], // 獲取最近兩年的數據
      }
    });

    // 處理股票名稱
    let name = '';
    if (nameResponse.data && nameResponse.data.data && nameResponse.data.data.length > 0) {
      name = nameResponse.data.data[0].stock_name;
    }

    // 處理除權息資訊
    let exDividendDate = '';
    let lastExDividendDate = '';
    let exRightDate = '';
    let lastExRightDate = '';
    let cashDividendPerShare = 0;
    let stockDividendPerShare = 0;

    if (dividendResponse.data && dividendResponse.data.data && dividendResponse.data.data.length > 0) {
      // 按日期排序，最新的在前面
      const sortedDividends = dividendResponse.data.data.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // 找出最近的現金股利和股票股利
      for (const dividend of sortedDividends) {
        if (dividend.CashEarningsDistribution > 0 && !exDividendDate) {
          exDividendDate = dividend.CashExDividendTradingDate || '';
          cashDividendPerShare = dividend.CashEarningsDistribution;
        } else if (dividend.CashEarningsDistribution > 0 && !lastExDividendDate && exDividendDate) {
          lastExDividendDate = dividend.CashExDividendTradingDate || '';
        }

        if (dividend.StockEarningsDistribution > 0 && !exRightDate) {
          exRightDate = dividend.StockExDividendTradingDate || '';
          stockDividendPerShare = dividend.StockEarningsDistribution;
        } else if (dividend.StockEarningsDistribution > 0 && !lastExRightDate && exRightDate) {
          lastExRightDate = dividend.StockExDividendTradingDate || '';
        }

        // 如果都找到了，就跳出循環
        if (exDividendDate && lastExDividendDate && exRightDate && lastExRightDate) {
          break;
        }
      }
    }

    // 如果從 TaiwanStockDividend 找不到，嘗試從 TaiwanStockDividendResult 找
    if ((!exDividendDate || !exRightDate) && 
        dividendResultResponse.data && 
        dividendResultResponse.data.data && 
        dividendResultResponse.data.data.length > 0) {
      
      const sortedResults = dividendResultResponse.data.data.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      for (const result of sortedResults) {
        const isDividend = result.stock_or_cache_dividend === '息' || 
                          result.stock_or_cache_dividend.includes('息');
        const isRight = result.stock_or_cache_dividend === '權' || 
                       result.stock_or_cache_dividend.includes('權');

        if (isDividend && !exDividendDate) {
          exDividendDate = result.date;
          cashDividendPerShare = result.stock_and_cache_dividend;
        } else if (isDividend && !lastExDividendDate && exDividendDate) {
          lastExDividendDate = result.date;
        }

        if (isRight && !exRightDate) {
          exRightDate = result.date;
          stockDividendPerShare = result.stock_and_cache_dividend;
        } else if (isRight && !lastExRightDate && exRightDate) {
          lastExRightDate = result.date;
        }

        // 如果都找到了，就跳出循環
        if (exDividendDate && lastExDividendDate && exRightDate && lastExRightDate) {
          break;
        }
      }
    }

    const stockInfo: StockInfo = {
      name,
      exDividendDate,
      lastExDividendDate,
      exRightDate,
      lastExRightDate,
      cashDividendPerShare,
      stockDividendPerShare,
    };

    return res.status(200).json(stockInfo);
  } catch (error) {
    console.error('獲取股票資訊失敗:', error);
    return res.status(500).json({ error: '獲取股票資訊失敗' });
  }
}
