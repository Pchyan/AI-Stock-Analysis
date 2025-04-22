import type { NextApiRequest, NextApiResponse } from 'next';

// 定義回應資料類型
type BacktestResult = {
  annualReturn: string;
  totalReturn: string;
  maxDrawdown: string;
  sharpeRatio: string;
  winRate: string;
  trades: number;
  equity: number[];
  trades_data?: {
    date: string;
    type: 'buy' | 'sell';
    price: number;
    shares: number;
    profit?: number;
  }[];
  error?: string;
};

// 模擬回測計算函數
function simulateBacktest(
  symbol: string,
  strategy: string,
  period: string,
  initialCapital: number = 100000
): BacktestResult {
  // 根據策略生成不同的回測結果
  let annualReturn = 0;
  let totalReturn = 0;
  let maxDrawdown = 0;
  let sharpeRatio = 0;
  let winRate = 0;
  let trades = 0;
  let equity: number[] = [];
  let trades_data = [];

  // 根據不同策略設定不同的模擬結果
  switch (strategy) {
    case 'ma_cross':
      // 均線交叉策略
      annualReturn = 8 + Math.random() * 7; // 8-15%
      totalReturn = annualReturn * getPeriodYears(period);
      maxDrawdown = 10 + Math.random() * 15; // 10-25%
      sharpeRatio = 0.8 + Math.random() * 0.7; // 0.8-1.5
      winRate = 45 + Math.random() * 15; // 45-60%
      trades = 15 + Math.floor(Math.random() * 20); // 15-35
      break;
    
    case 'rsi':
      // RSI策略
      annualReturn = 6 + Math.random() * 10; // 6-16%
      totalReturn = annualReturn * getPeriodYears(period);
      maxDrawdown = 12 + Math.random() * 18; // 12-30%
      sharpeRatio = 0.6 + Math.random() * 0.9; // 0.6-1.5
      winRate = 40 + Math.random() * 20; // 40-60%
      trades = 25 + Math.floor(Math.random() * 30); // 25-55
      break;
    
    case 'breakout':
      // 突破策略
      annualReturn = 10 + Math.random() * 15; // 10-25%
      totalReturn = annualReturn * getPeriodYears(period);
      maxDrawdown = 15 + Math.random() * 20; // 15-35%
      sharpeRatio = 0.7 + Math.random() * 1.0; // 0.7-1.7
      winRate = 35 + Math.random() * 15; // 35-50%
      trades = 10 + Math.floor(Math.random() * 15); // 10-25
      break;
    
    case 'value':
      // 價值投資策略
      annualReturn = 7 + Math.random() * 8; // 7-15%
      totalReturn = annualReturn * getPeriodYears(period);
      maxDrawdown = 8 + Math.random() * 12; // 8-20%
      sharpeRatio = 0.9 + Math.random() * 0.6; // 0.9-1.5
      winRate = 55 + Math.random() * 20; // 55-75%
      trades = 5 + Math.floor(Math.random() * 8); // 5-13
      break;
    
    default:
      annualReturn = 5 + Math.random() * 10; // 5-15%
      totalReturn = annualReturn * getPeriodYears(period);
      maxDrawdown = 10 + Math.random() * 15; // 10-25%
      sharpeRatio = 0.7 + Math.random() * 0.8; // 0.7-1.5
      winRate = 45 + Math.random() * 15; // 45-60%
      trades = 15 + Math.floor(Math.random() * 15); // 15-30
  }

  // 生成權益曲線
  const dataPoints = getPeriodDataPoints(period);
  let currentEquity = initialCapital;
  
  for (let i = 0; i < dataPoints; i++) {
    // 模擬權益曲線，加入一些隨機波動
    const monthlyReturn = (annualReturn / 12) / 100;
    const randomFactor = 1 + (Math.random() * 0.02 - 0.01); // -1% to +1% 隨機波動
    
    currentEquity = currentEquity * (1 + monthlyReturn * randomFactor);
    
    // 模擬最大回撤
    if (Math.random() < 0.1) { // 10% 機率發生回撤
      const drawdownFactor = 1 - (Math.random() * maxDrawdown / 100);
      currentEquity = currentEquity * drawdownFactor;
    }
    
    equity.push(Math.round(currentEquity));
  }

  // 生成交易記錄
  const dates = generateDates(period);
  const prices = generatePrices(symbol, dates.length);
  
  for (let i = 0; i < trades; i++) {
    const dateIndex = Math.floor(Math.random() * dates.length);
    const date = dates[dateIndex];
    const price = prices[dateIndex];
    const shares = Math.floor(Math.random() * 100) + 10; // 10-110股
    
    // 隨機生成買入或賣出
    const type = Math.random() > 0.5 ? 'buy' : 'sell';
    
    // 如果是賣出，計算利潤
    let profit = undefined;
    if (type === 'sell' && i > 0) {
      const buyPrice = trades_data.find(t => t.type === 'buy')?.price || price * 0.9;
      profit = (price - buyPrice) * shares;
    }
    
    trades_data.push({
      date,
      type,
      price,
      shares,
      profit
    });
  }
  
  // 按日期排序交易記錄
  trades_data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    annualReturn: `${annualReturn.toFixed(2)}%`,
    totalReturn: `${totalReturn.toFixed(2)}%`,
    maxDrawdown: `${maxDrawdown.toFixed(2)}%`,
    sharpeRatio: sharpeRatio.toFixed(2),
    winRate: `${winRate.toFixed(2)}%`,
    trades,
    equity,
    trades_data
  };
}

// 根據時間週期獲取年數
function getPeriodYears(period: string): number {
  switch (period) {
    case '3m': return 0.25;
    case '6m': return 0.5;
    case '1y': return 1;
    case '3y': return 3;
    case '5y': return 5;
    default: return 1;
  }
}

// 根據時間週期獲取數據點數量
function getPeriodDataPoints(period: string): number {
  switch (period) {
    case '3m': return 90;
    case '6m': return 180;
    case '1y': return 250;
    case '3y': return 750;
    case '5y': return 1250;
    default: return 250;
  }
}

// 生成日期數組
function generateDates(period: string): string[] {
  const dates: string[] = [];
  const endDate = new Date();
  const dataPoints = getPeriodDataPoints(period);
  
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date();
    date.setDate(endDate.getDate() - (dataPoints - i));
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

// 生成價格數組
function generatePrices(symbol: string, length: number): number[] {
  const prices: number[] = [];
  let basePrice = 100; // 基礎價格
  
  // 根據股票代碼設定不同的基礎價格
  if (symbol.includes('AAPL')) basePrice = 150;
  else if (symbol.includes('MSFT')) basePrice = 300;
  else if (symbol.includes('GOOGL')) basePrice = 2500;
  else if (symbol.includes('AMZN')) basePrice = 3000;
  else if (symbol.includes('2330')) basePrice = 500;
  
  for (let i = 0; i < length; i++) {
    // 添加一些隨機波動
    const randomChange = (Math.random() - 0.48) * 2; // 稍微偏向上漲
    basePrice = basePrice * (1 + randomChange / 100);
    prices.push(Math.round(basePrice * 100) / 100);
  }
  
  return prices;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BacktestResult>
) {
  // 只接受 GET 請求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '只支援 GET 請求' });
  }

  const { symbol, strategy, period } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: '請提供有效的股票代碼' });
  }

  if (!strategy || typeof strategy !== 'string') {
    return res.status(400).json({ error: '請提供有效的策略' });
  }

  if (!period || typeof period !== 'string') {
    return res.status(400).json({ error: '請提供有效的時間週期' });
  }

  try {
    // 模擬回測計算
    const result = simulateBacktest(symbol, strategy, period);
    
    // 添加延遲模擬計算時間
    setTimeout(() => {
      res.status(200).json(result);
    }, 1000);
  } catch (error) {
    console.error('回測計算失敗:', error);
    res.status(500).json({ error: '回測計算失敗，請稍後再試' });
  }
}
