import { useEffect, useState } from 'react';
import Head from 'next/head';
import NavBar from '../components/NavBar';
import DashboardLayout from '../components/DashboardLayout';
import ChartPanel from '../components/ChartPanel';
import FundamentalPanel from '../components/FundamentalPanel';
import ChipsPanel from '../components/ChipsPanel';
import GeminiChat from '../components/GeminiChat';
import AlertSystem from '../components/AlertSystem';
import BacktestSimulator from '../components/BacktestSimulator';
import InvestmentJournal from '../components/InvestmentJournal';

interface Stock {
  symbol: string;
  shares: number;
  cost: number;
  id?: number;
  name?: string;
}

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [stockSymbol, setStockSymbol] = useState<string>('');
  const [stockName, setStockName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<Stock[]>([]);
  const [showStockSelector, setShowStockSelector] = useState(true);

  // 載入持股資料和股票資訊
  useEffect(() => {
    const stored = localStorage.getItem('portfolio');
    const stockInfoStored = localStorage.getItem('stockInfo');
    let stockInfoMap: {[key: string]: string} = {};

    // 載入股票資訊
    if (stockInfoStored) {
      try {
        const stockInfoParsed = JSON.parse(stockInfoStored);
        stockInfoMap = stockInfoParsed.reduce((acc: {[key: string]: string}, item: {symbol: string, name: string}) => {
          if (item.symbol && item.name) {
            acc[item.symbol] = item.name;
          }
          return acc;
        }, {});
      } catch (e) {
        console.error('載入股票資訊失敗', e);
      }
    }

    // 載入持股資料
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // 將股票資訊合併到持股資料中
        const parsedWithNames = parsed.map((stock: Stock) => {
          if (stockInfoMap[stock.symbol]) {
            return {
              ...stock,
              name: stockInfoMap[stock.symbol]
            };
          }
          return stock;
        });

        setPortfolio(parsedWithNames);

        // 如果有持股且沒有選擇股票，預設選擇第一個
        if (parsedWithNames.length > 0 && !stockSymbol) {
          setStockSymbol(parsedWithNames[0].symbol);

          // 如果有已存儲的名稱，直接使用
          if (parsedWithNames[0].name) {
            setStockName(parsedWithNames[0].name);
          } else {
            // 否則從 API 獲取
            getStockName(parsedWithNames[0].symbol).then(name => {
              setStockName(name);
            });
          }
        }
      } catch (e) {
        console.error('載入持股資料失敗', e);
      }
    }
  }, []);

  // 存儲當前選擇的時間週期
  const [timeframe, setTimeframe] = useState<string>('1m');

  // 當選擇股票或時間週期改變時載入資料
  useEffect(() => {
    if (!stockSymbol) return;

    setIsLoading(true);
    setShowStockSelector(false);

    // 實際向 API 請求資料
    fetchStockData(stockSymbol, timeframe);
  }, [stockSymbol, timeframe]);

  // 從 API 取得股票資料
  const fetchStockData = async (symbol: string, timeframe: string) => {
    try {
      // 從我們的 API 端點取得資料
      const response = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`);

      if (!response.ok) {
        throw new Error(`API 請求失敗: ${response.status}`);
      }

      const stockData = await response.json();
      setData(stockData);
    } catch (error) {
      console.error('取得股票資料失敗:', error);
      // 如果發生錯誤，顯示錯誤訊息或使用備用資料
      setData({
        candles: Array(30).fill(0).map((_, i) => ({
          t: new Date(2023, 0, i + 1).toISOString().split('T')[0],
          o: 100 + Math.random() * 10,
          h: 105 + Math.random() * 10,
          l: 95 + Math.random() * 10,
          c: 102 + Math.random() * 10,
        })),
        pe: 12 + Math.random() * 8,
        yield: 2 + Math.random() * 3,
        roe: 8 + Math.random() * 10,
        healthScore: ['良好', '中等', '優良'][Math.floor(Math.random() * 3)],
        peerCompare: ['高於平均', '低於平均', '近于平均'][Math.floor(Math.random() * 3)],
        institutionalBuySell: Math.random() > 0.5 ? '+' + Math.floor(Math.random() * 5000) : '-' + Math.floor(Math.random() * 3000),
        marginBalance: Math.floor(Math.random() * 2000000),
        shortBalance: Math.floor(Math.random() * 800000),
        majorHolderRatio: Math.floor(10 + Math.random() * 30) + '%',
        mainForceAlert: Math.random() > 0.5 ? '主力買超' : '主力賣超',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 判斷股票地區，用於設定漲跌顏色
  const getStockRegion = (symbol: string): 'asia' | 'us' => {
    // 台灣股票或以數字開頭的代碼視為亞洲地區
    if (symbol.endsWith('.TW') || /^\d+/.test(symbol)) {
      return 'asia';
    }
    // 其他視為美國地區
    return 'us';
  };

  // 根據地區和漲跌狀態取得顏色類名
  const getPriceColorClass = (symbol: string, isUp: boolean): string => {
    const region = getStockRegion(symbol);

    // 亞洲地區：漲為紅色，跌為綠色
    if (region === 'asia') {
      return isUp ? 'value-asia-up' : 'value-asia-down';
    }

    // 美國地區：漲為綠色，跌為紅色
    return isUp ? 'value-us-up' : 'value-us-down';
  };

  // 根據股票代碼取得公司名稱
  const getStockName = async (symbol: string) => {
    // 先嘗試從持股中取得名稱
    const stock = portfolio.find(s => s.symbol === symbol);
    if (stock && stock.name && stock.name !== '-') {
      return stock.name;
    }

    try {
      // 從 API 取得股票資訊
      const response = await fetch(`/api/stock-info?symbol=${encodeURIComponent(symbol)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.name && data.name !== '-') {
          return `${data.name} - ${getStockCategory(symbol)}`;
        }
      }
    } catch (error) {
      console.error('取得股票名稱失敗:', error);
    }

    // 如果 API 取得失敗，嘗試判斷股票類型
    return `${symbol} - ${getStockCategory(symbol)}`;
  };

  // 判斷股票類型
  const getStockCategory = (symbol: string) => {
    // 台灣股票代碼判斷
    if (symbol.endsWith('.TW')) {
      return '台灣股票';
    } else if (/^\d{4,}$/.test(symbol)) {
      // 純數字代碼為台灣股票
      return '台灣股票';
    } else if (/^[A-Z]+$/.test(symbol)) {
      // 純英文大寫代碼為美國股票
      return '美國股票';
    } else if (/^00\d+$/.test(symbol) || /^00\d+\.TW$/.test(symbol)) {
      // 00 開頭的數字代碼大多為台灣 ETF
      return '台灣ETF';
    }

    return '股票';
  };

  // 選擇股票進行分析
  const selectStock = (stock: Stock) => {
    setStockSymbol(stock.symbol);
    // 獲取股票名稱
    getStockName(stock.symbol).then(name => {
      setStockName(name);
    });
    setShowStockSelector(false);
  };

  // 顯示股票選擇器
  const toggleStockSelector = () => {
    setShowStockSelector(!showStockSelector);
  };

  return (
    <>
      <Head>
        <title>AI 股票分析 {stockSymbol ? `| ${stockSymbol}` : ''}</title>
        <meta name="description" content="使用人工智慧分析股票資訊和市場趨勢" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>

        {portfolio.length === 0 ? (
          <div className="container py-5 text-center">
            <div className="empty-portfolio-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20v-6M6 20V10M18 20V4"></path>
              </svg>
              <h2 className="mt-4 mb-3">沒有可分析的股票</h2>
              <p className="mb-4">您需要先新增股票到您的持股組合中，才能進行分析。</p>
              <a href="/portfolio" className="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                前往持股管理
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* 股票選擇器 */}
            {showStockSelector && (
              <div className="stock-selector-overlay">
                <div className="stock-selector-container">
                  <div className="stock-selector-header">
                    <h3 className="mb-0">選擇股票進行分析</h3>
                    <button className="btn-close" onClick={() => setShowStockSelector(false)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div className="stock-selector-body">
                    {portfolio.map((stock) => (
                      <div
                        key={stock.id}
                        className={`stock-item ${stock.symbol === stockSymbol ? 'active' : ''}`}
                        onClick={() => selectStock(stock)}
                      >
                        <div className="stock-item-symbol">{stock.symbol}</div>
                        <div className="stock-item-name">{stock.name || `${stock.symbol} - ${getStockCategory(stock.symbol)}`}</div>
                        <div className="stock-item-shares">持有: {stock.shares} 股</div>
                        <div className="stock-item-cost">成本: ${stock.cost}</div>
                      </div>
                    ))}
                  </div>
                  <div className="stock-selector-footer">
                    <a href="/portfolio" className="btn btn-outline">管理持股</a>
                  </div>
                </div>
              </div>
            )}

            {stockSymbol ? (
              <>
                <div className="stock-header">
                  <div className="container py-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap">
                      <div>
                        <div className="d-flex align-items-center">
                          <h1 className="stock-title mb-1">{stockSymbol}</h1>
                          <button
                            className="btn btn-sm btn-outline ml-3"
                            onClick={toggleStockSelector}
                            title="選擇其他股票"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                          </button>
                        </div>
                        <p className="stock-subtitle">{stockName}</p>
                      </div>

                      {!isLoading && data && data.candles && data.candles.length > 0 && (
                        <div className="stock-price-container">
                          {(() => {
                            // 計算價格和漲跌幅
                            const latestPrice = data.candles[data.candles.length - 1].c;
                            const previousPrice = data.candles.length > 1 ? data.candles[data.candles.length - 2].c : data.candles[0].c;
                            const priceChange = latestPrice - previousPrice;
                            const priceChangePercent = (priceChange / previousPrice) * 100;
                            const isUp = priceChange >= 0;

                            // 根據股票地區取得顏色類名
                            const colorClass = getPriceColorClass(stockSymbol, isUp);

                            return (
                              <>
                                <div className={`current-price ${colorClass}`}>
                                  ${latestPrice.toFixed(2)}
                                </div>
                                <div className="price-change">
                                  <span className={colorClass}>
                                    {isUp ? '+' : ''}{priceChange.toFixed(2)} ({isUp ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                                  </span>
                                  <span className="time-stamp">今日更新</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isLoading ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                    <p>正在載入{stockSymbol}的分析資料...</p>
                  </div>
                ) : (
                  <DashboardLayout>
                    <ChartPanel
                      data={data}
                      onTimeframeChange={(newTimeframe) => setTimeframe(newTimeframe)}
                    />
                    <FundamentalPanel data={data} />
                    <ChipsPanel data={data} />
                    <AlertSystem alerts={data?.alerts || []} />
                    <BacktestSimulator stockSymbol={stockSymbol} />
                    <InvestmentJournal stockSymbol={stockSymbol} />
                  </DashboardLayout>
                )}
              </>
            ) : (
              <div className="container py-5 text-center">
                <div className="select-stock-message">
                  <h2 className="mb-3">請選擇股票進行分析</h2>
                  <button className="btn btn-primary" onClick={toggleStockSelector}>
                    選擇股票
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <GeminiChat />
      </main>

      <style jsx>{`
        .stock-header {
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          box-shadow: var(--shadow-sm);
          margin-bottom: var(--space-md);
        }

        .stock-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          margin: 0;
        }

        .stock-subtitle {
          color: var(--color-text-secondary);
          margin: 0;
        }

        .stock-price-container {
          text-align: right;
          margin-top: var(--space-sm);
        }

        .current-price {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
        }

        .price-change {
          display: flex;
          flex-direction: column;
        }

        .time-stamp {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        /* 美國地區漲跌顏色：漲為綠色，跌為紅色 */
        .value-us-up {
          color: var(--color-success);
        }

        .value-us-down {
          color: var(--color-error);
        }

        /* 亞洲地區漲跌顏色：漲為紅色，跌為綠色 */
        .value-asia-up {
          color: var(--color-error);
        }

        .value-asia-down {
          color: var(--color-success);
        }

        /* 股票選擇器樣式 */
        .stock-selector-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: var(--z-index-modal);
          padding: var(--space-md);
        }

        .stock-selector-container {
          background-color: var(--color-surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          width: 100%;
          max-width: 600px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.3s ease-in-out;
        }

        .stock-selector-header {
          padding: var(--space-md);
          border-bottom: 1px solid var(--color-divider);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stock-selector-body {
          padding: var(--space-md);
          overflow-y: auto;
          flex: 1;
        }

        .stock-selector-footer {
          padding: var(--space-md);
          border-top: 1px solid var(--color-divider);
          display: flex;
          justify-content: flex-end;
        }

        .stock-item {
          padding: var(--space-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-sm);
          cursor: pointer;
          transition: background-color var(--transition-fast);
          display: grid;
          grid-template-columns: 1fr 2fr;
          grid-template-rows: auto auto;
          gap: var(--space-xs);
          align-items: center;
        }

        .stock-item:hover {
          background-color: var(--color-background);
        }

        .stock-item.active {
          background-color: rgba(25, 118, 210, 0.1);
          border-left: 3px solid var(--color-primary);
        }

        .stock-item-symbol {
          font-weight: var(--font-weight-bold);
          font-size: var(--font-size-lg);
          color: var(--color-primary);
          grid-column: 1;
          grid-row: 1;
        }

        .stock-item-name {
          color: var(--color-text-secondary);
          grid-column: 2;
          grid-row: 1;
        }

        .stock-item-shares {
          font-size: var(--font-size-sm);
          grid-column: 1;
          grid-row: 2;
        }

        .stock-item-cost {
          font-size: var(--font-size-sm);
          grid-column: 2;
          grid-row: 2;
        }

        .btn-close {
          background: transparent;
          border: none;
          color: var(--color-text-secondary);
          padding: var(--space-xs);
          border-radius: var(--radius-circle);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .btn-close:hover {
          background-color: var(--color-background);
          color: var(--color-text-primary);
        }

        /* 載入中動畫 */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl) 0;
          color: var(--color-text-secondary);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: var(--color-primary);
          animation: spin 1s linear infinite;
          margin-bottom: var(--space-md);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* 空持股和選擇股票提示 */
        .empty-portfolio-message,
        .select-stock-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl) 0;
          max-width: 500px;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .stock-price-container {
            margin-top: 0;
          }
        }
      `}</style>
    </>
  );
}
