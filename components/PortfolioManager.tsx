import React, { useState, useEffect } from 'react';
import TradeHistory from './TradeHistory';

interface Stock {
  symbol: string;
  name: string;
  shares: number;
  cost: number;
  id?: number;
  exDividendDate?: string; // 除息日
  lastExDividendDate?: string; // 上次除息日
  exRightDate?: string; // 除權日
  lastExRightDate?: string; // 上次除權日
  cashDividendPerShare?: number; // 每股配息
  stockDividendPerShare?: number; // 每股配股
  cashYield?: number; // 現金殖利率(%)
  totalYield?: number; // 現金+配股殖利率(%)
  costYield?: number; // 持有成本的現金+股票殖利率(%)
  totalValue?: number; // 持有的總值
}

export default function PortfolioManager() {
  const [portfolio, setPortfolio] = useState<Stock[]>([]);
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState<number|string>('');
  const [cost, setCost] = useState<number|string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStock, setEditStock] = useState({ shares: '', cost: '' });
  const [activeTab, setActiveTab] = useState<'portfolio' | 'trades'>('portfolio');
  const [currentPrice, setCurrentPrice] = useState<{[key: string]: number}>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('portfolio');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Add IDs if they don't exist
        const withIds = parsed.map((stock: Stock, index: number) => {
          if (!stock.id) {
            return { ...stock, id: Date.now() + index };
          }
          return stock;
        });
        setPortfolio(withIds);
      } catch (e) {
        console.error('Failed to parse portfolio data', e);
      }
    }
  }, []);

  // 儲存投資組合到 localStorage
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));

    // 將股票名稱資訊存入 localStorage
    if (portfolio.length > 0) {
      localStorage.setItem('stockInfo', JSON.stringify(portfolio.map(stock => ({
        symbol: stock.symbol,
        name: stock.name || ''
      }))));
    }
  }, [portfolio]);

  // 當投資組合更新時，獲取股票資訊，但使用 portfolioRef 避免無限循環
  const portfolioRef = React.useRef(portfolio);

  useEffect(() => {
    portfolioRef.current = portfolio;
  }, [portfolio]);

  // 在組件掛載時和投資組合更新時獲取股票資訊
  useEffect(() => {
    if (portfolio.length > 0) {
      // 使用延遲確保組件已完全掛載
      const timer = setTimeout(() => {
        fetchStockInfo();
      }, 500);

      // 設定定期更新股價，每 5 分鐘更新一次
      const priceUpdateTimer = setInterval(() => {
        // 只更新股價，不更新其他資訊
        const updatePrices = async () => {
          try {
            const currentPortfolio = portfolioRef.current;
            let newCurrentPrice = {...currentPrice};
            let hasChanges = false;

            for (const stock of currentPortfolio) {
              try {
                const stockResponse = await fetch(`/api/stock?symbol=${stock.symbol}&timeframe=1d`);
                const stockData = await stockResponse.json();

                if (stockData && stockData.candles && stockData.candles.length > 0) {
                  // 取得最新的收盤價
                  const latestPrice = stockData.candles[stockData.candles.length - 1].c;
                  newCurrentPrice[stock.symbol] = latestPrice;
                  hasChanges = true;
                }
              } catch (error) {
                console.error(`更新 ${stock.symbol} 的當前價格失敗:`, error);
              }
            }

            if (hasChanges) {
              setCurrentPrice(newCurrentPrice);
            }
          } catch (error) {
            console.error('更新股價失敗:', error);
          }
        };

        updatePrices();
      }, 5 * 60 * 1000); // 5 分鐘

      return () => {
        clearTimeout(timer);
        clearInterval(priceUpdateTimer);
      };
    }
  }, [portfolio.length]); // 投資組合長度變化時重新獲取資訊

  // 獲取股票資訊和當前價格
  const fetchStockInfo = async () => {
    setLoading(true);

    try {
      // 使用 portfolioRef.current 而不是直接使用 portfolio
      const currentPortfolio = portfolioRef.current;
      const updatedPortfolio = [...currentPortfolio];
      let hasChanges = false;
      let newCurrentPrice = {...currentPrice};

      // 對每個股票獲取資訊
      for (let i = 0; i < updatedPortfolio.length; i++) {
        const stock = updatedPortfolio[i];

        // 獲取股票的當前價格
        try {
          const stockResponse = await fetch(`/api/stock?symbol=${stock.symbol}&timeframe=1d`);
          const stockData = await stockResponse.json();

          if (stockData && stockData.candles && stockData.candles.length > 0) {
            // 取得最新的收盤價
            const latestPrice = stockData.candles[stockData.candles.length - 1].c;
            newCurrentPrice[stock.symbol] = latestPrice;
            hasChanges = true;
          }
        } catch (error) {
          console.error(`獲取 ${stock.symbol} 的當前價格失敗:`, error);
        }

        // 如果已經有名稱和除息日等資訊，則跳過這部分
        // 但如果名稱是空或是符號「-」，則仍然獲取資訊
        if (!(stock.name && stock.name !== '-' && stock.name !== '' && stock.exDividendDate)) {
          try {
            // 獲取股票資訊
            const response = await fetch(`/api/stock-info?symbol=${stock.symbol}`);
            const data = await response.json();

            if (data) {
              // 更新股票資訊
              updatedPortfolio[i] = {
                ...stock,
                name: data.name || '-',
                exDividendDate: data.exDividendDate || '-',
                lastExDividendDate: data.lastExDividendDate || '-',
                exRightDate: data.exRightDate || '-',
                lastExRightDate: data.lastExRightDate || '-',
                cashDividendPerShare: data.cashDividendPerShare || 0,
                stockDividendPerShare: data.stockDividendPerShare || 0
              };

              // 計算殖利率
              if (data.cashDividendPerShare && data.cashDividendPerShare > 0) {
                // 現金殖利率 = 每股配息 / 成本 * 100%
                const cashYield = (data.cashDividendPerShare / stock.cost) * 100;
                updatedPortfolio[i].cashYield = parseFloat(cashYield.toFixed(2));

                // 取得股票的當前市場價格
                const currentStockPrice = currentPrice[stock.symbol] || stock.cost;

                // 現金殖利率 = 每股配息 / 成本 * 100%
                const cashYieldValue = (data.cashDividendPerShare / stock.cost) * 100;

                // 股票殖利率 = 每股配股 * 當前市場價格 / 成本 * 100%
                const stockYieldValue = ((data.stockDividendPerShare || 0) * currentStockPrice / stock.cost) * 100;

                // 總殖利率 = 現金殖利率 + 股票殖利率
                const totalYield = cashYieldValue + stockYieldValue;
                updatedPortfolio[i].totalYield = parseFloat(totalYield.toFixed(2));

                // 持有成本的殖利率 = 總殖利率
                updatedPortfolio[i].costYield = updatedPortfolio[i].totalYield;
              } else {
                // 確保殖利率欄位有預設值
                updatedPortfolio[i].cashYield = 0;
                updatedPortfolio[i].totalYield = 0;
                updatedPortfolio[i].costYield = 0;
              }

              hasChanges = true;
            }
          } catch (error) {
            console.error(`獲取 ${stock.symbol} 的資訊失敗:`, error);
          }
        }

        // 計算總值 (成本總值)
        updatedPortfolio[i].totalValue = stock.shares * stock.cost;
      }

      // 更新當前價格狀態
      if (Object.keys(newCurrentPrice).length > 0) {
        setCurrentPrice(newCurrentPrice);
      }

      // 只有在有變更時才更新狀態
      if (hasChanges) {
        setPortfolio(updatedPortfolio);
      }
    } catch (error) {
      console.error('獲取股票資訊失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStock = async () => {
    if (!symbol.trim() || Number(shares) <= 0 || Number(cost) <= 0) {
      setError('請正確填寫所有欄位');
      return;
    }

    setLoading(true);

    try {
      // 獲取股票資訊
      const response = await fetch(`/api/stock-info?symbol=${symbol.trim().toUpperCase()}`);
      const data = await response.json();

      const newStock: Stock = {
        symbol: symbol.trim().toUpperCase(),
        name: data && data.name ? data.name : '-',
        shares: Number(shares),
        cost: Number(cost),
        id: Date.now(),
        exDividendDate: data && data.exDividendDate ? data.exDividendDate : '-',
        lastExDividendDate: data && data.lastExDividendDate ? data.lastExDividendDate : '-',
        exRightDate: data && data.exRightDate ? data.exRightDate : '-',
        lastExRightDate: data && data.lastExRightDate ? data.lastExRightDate : '-',
        cashDividendPerShare: data && data.cashDividendPerShare ? data.cashDividendPerShare : 0,
        stockDividendPerShare: data && data.stockDividendPerShare ? data.stockDividendPerShare : 0,
        cashYield: 0,
        totalYield: 0,
        costYield: 0,
        totalValue: Number(shares) * Number(cost)
      };

      // 計算殖利率
      if (data && data.cashDividendPerShare && data.cashDividendPerShare > 0) {
        // 現金殖利率 = 每股配息 / 成本 * 100%
        const cashYield = (data.cashDividendPerShare / Number(cost)) * 100;
        newStock.cashYield = parseFloat(cashYield.toFixed(2));

        // 取得股票的當前市場價格
        const currentStockPrice = currentPrice[symbol.trim().toUpperCase()] || Number(cost);

        // 現金殖利率 = 每股配息 / 成本 * 100%
        const cashYieldValue = (data.cashDividendPerShare / Number(cost)) * 100;

        // 股票殖利率 = 每股配股 * 當前市場價格 / 成本 * 100%
        const stockYieldValue = ((data.stockDividendPerShare || 0) * currentStockPrice / Number(cost)) * 100;

        // 總殖利率 = 現金殖利率 + 股票殖利率
        const totalYield = cashYieldValue + stockYieldValue;
        newStock.totalYield = parseFloat(totalYield.toFixed(2));

        // 持有成本的殖利率 = 總殖利率
        newStock.costYield = newStock.totalYield;
      }

      // 總值已經在建立 newStock 時計算好了

      // 使用函數式更新確保使用最新的狀態
      setPortfolio(prevPortfolio => [...prevPortfolio, newStock]);
      setSymbol('');
      setShares('');
      setCost('');
      setError('');
    } catch (error) {
      console.error('獲取股票資訊失敗:', error);
      setError('獲取股票資訊失敗，請確認股票代碼是否正確');
    } finally {
      setLoading(false);
    }
  };

  const removeStock = (id: number) => {
    // 確認刪除
    if (!confirm('刪除此股票將同時刪除所有相關的交易記錄，確定要刪除嗎？')) {
      return;
    }

    // 獲取要刪除的股票代碼
    const stockToRemove = portfolio.find(stock => stock.id === id);
    if (!stockToRemove) return;

    // 使用函數式更新確保使用最新的狀態
    setPortfolio(prevPortfolio => prevPortfolio.filter(stock => stock.id !== id));

    // 如果當前在交易記錄頁面，需要同時刪除該股票的所有交易記錄
    const storedTrades = localStorage.getItem('trades');
    if (storedTrades) {
      try {
        const parsedTrades = JSON.parse(storedTrades);
        // 過濾掉該股票的所有交易記錄
        const updatedTrades = parsedTrades.filter(trade => trade.symbol !== stockToRemove.symbol);
        // 更新 localStorage
        localStorage.setItem('trades', JSON.stringify(updatedTrades));

        // 如果當前在交易記錄頁面，通知 TradeHistory 組件更新
        if (activeTab === 'trades' && window.updateTradesAfterStockRemoval) {
          window.updateTradesAfterStockRemoval(stockToRemove.symbol);
        }
      } catch (e) {
        console.error('刪除交易記錄失敗', e);
      }
    }
  };

  const startEditing = (stock: Stock) => {
    if (stock.id) {
      setEditingId(stock.id);
      setEditStock({
        shares: stock.shares.toString(),
        cost: stock.cost.toString()
      });
    }
  };

  const saveEdit = (id: number) => {
    // 使用函數式更新確保使用最新的狀態
    setPortfolio(prevPortfolio => {
      return prevPortfolio.map(stock => {
        if (stock.id === id) {
          const updatedStock = {
            ...stock,
            shares: parseFloat(editStock.shares),
            cost: parseFloat(editStock.cost)
          };

          // 重新計算殖利率
          if (stock.cashDividendPerShare) {
            // 現金殖利率 = 每股配息 / 成本 * 100%
            const cashYield = (stock.cashDividendPerShare / parseFloat(editStock.cost)) * 100;
            updatedStock.cashYield = parseFloat(cashYield.toFixed(2));

            // 取得股票的當前市場價格
            const currentStockPrice = currentPrice[stock.symbol] || parseFloat(editStock.cost);

            // 現金殖利率 = 每股配息 / 成本 * 100%
            const cashYieldValue = (stock.cashDividendPerShare / parseFloat(editStock.cost)) * 100;

            // 股票殖利率 = 每股配股 * 當前市場價格 / 成本 * 100%
            const stockYieldValue = ((stock.stockDividendPerShare || 0) * currentStockPrice / parseFloat(editStock.cost)) * 100;

            // 總殖利率 = 現金殖利率 + 股票殖利率
            const totalYield = cashYieldValue + stockYieldValue;
            updatedStock.totalYield = parseFloat(totalYield.toFixed(2));

            // 持有成本的殖利率 = 總殖利率
            updatedStock.costYield = updatedStock.totalYield;
          }

          // 計算總值
          updatedStock.totalValue = parseFloat(editStock.shares) * parseFloat(editStock.cost);

          return updatedStock;
        }
        return stock;
      });
    });

    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // 排序函數
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';

    // 如果已經按照這個鍵排序，則切換方向
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }

    setSortConfig({ key, direction });
  };

  // 獲取排序後的投資組合
  const getSortedPortfolio = () => {
    // 創建投資組合的副本，以避免直接修改原始數據
    const portfolioCopy = [...portfolio];

    if (!sortConfig) {
      return portfolioCopy;
    }

    return portfolioCopy.sort((a, b) => {
      // 根據不同的鍵進行排序
      if (sortConfig.key === 'symbol') {
        if (a.symbol < b.symbol) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a.symbol > b.symbol) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      }

      if (sortConfig.key === 'name') {
        const nameA = a.name || '';
        const nameB = b.name || '';
        if (nameA < nameB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (nameA > nameB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      }

      if (sortConfig.key === 'shares') {
        return sortConfig.direction === 'ascending' ? a.shares - b.shares : b.shares - a.shares;
      }

      if (sortConfig.key === 'cost') {
        return sortConfig.direction === 'ascending' ? a.cost - b.cost : b.cost - a.cost;
      }

      if (sortConfig.key === 'totalValue') {
        const valueA = a.totalValue !== undefined ? a.totalValue : a.shares * a.cost;
        const valueB = b.totalValue !== undefined ? b.totalValue : b.shares * b.cost;
        return sortConfig.direction === 'ascending' ? valueA - valueB : valueB - valueA;
      }

      if (sortConfig.key === 'currentPrice') {
        const priceA = currentPrice[a.symbol] || 0;
        const priceB = currentPrice[b.symbol] || 0;
        return sortConfig.direction === 'ascending' ? priceA - priceB : priceB - priceA;
      }

      if (sortConfig.key === 'currentTotalValue') {
        const valueA = currentPrice[a.symbol] ? a.shares * currentPrice[a.symbol] : 0;
        const valueB = currentPrice[b.symbol] ? b.shares * currentPrice[b.symbol] : 0;
        return sortConfig.direction === 'ascending' ? valueA - valueB : valueB - valueA;
      }

      if (sortConfig.key === 'exDividendDate') {
        const dateA = a.exDividendDate || '';
        const dateB = b.exDividendDate || '';
        if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      }

      if (sortConfig.key === 'cashDividendPerShare') {
        const dividendA = a.cashDividendPerShare || 0;
        const dividendB = b.cashDividendPerShare || 0;
        return sortConfig.direction === 'ascending' ? dividendA - dividendB : dividendB - dividendA;
      }

      if (sortConfig.key === 'stockDividendPerShare') {
        const dividendA = a.stockDividendPerShare || 0;
        const dividendB = b.stockDividendPerShare || 0;
        return sortConfig.direction === 'ascending' ? dividendA - dividendB : dividendB - dividendA;
      }

      if (sortConfig.key === 'cashYield') {
        const yieldA = a.cashYield || 0;
        const yieldB = b.cashYield || 0;
        return sortConfig.direction === 'ascending' ? yieldA - yieldB : yieldB - yieldA;
      }

      if (sortConfig.key === 'totalYield') {
        const yieldA = a.totalYield || 0;
        const yieldB = b.totalYield || 0;
        return sortConfig.direction === 'ascending' ? yieldA - yieldB : yieldB - yieldA;
      }

      return 0;
    });
  };

  // 獲取排序指示器的類名
  const getClassNamesFor = (name: string) => {
    if (!sortConfig) {
      return 'sortable';
    }
    return sortConfig.key === name ? `sortable ${sortConfig.direction}` : 'sortable';
  };

  // 計算目前總市值
  const calculateTotalValue = () => {
    // 使用 portfolioRef.current 確保使用最新的投資組合數據
    return portfolioRef.current.reduce((total, stock) => {
      // 計算目前總市值：股數 * 目前股價
      const value = currentPrice[stock.symbol] ? stock.shares * currentPrice[stock.symbol] : 0;
      return total + value;
    }, 0).toFixed(2);
  };

  // 計算總成本
  const calculateTotalCost = () => {
    // 使用 portfolioRef.current 確保使用最新的投資組合數據
    return portfolioRef.current.reduce((total, stock) => {
      // 計算總成本：股數 * 成本
      const cost = stock.totalValue !== undefined ? stock.totalValue : stock.shares * stock.cost;
      return total + cost;
    }, 0).toFixed(2);
  };

  // 計算損益
  const calculateProfit = () => {
    const totalValue = parseFloat(calculateTotalValue());
    const totalCost = parseFloat(calculateTotalCost());
    const profit = totalValue - totalCost;
    return profit.toFixed(2);
  };

  return (
    <div className="portfolio-container">
      <div className="tabs-container mb-4">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M12 20v-6M6 20V10M18 20V4"></path>
            </svg>
            持股管理
          </button>
          <button
            className={`tab ${activeTab === 'trades' ? 'active' : ''}`}
            onClick={() => setActiveTab('trades')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            交易記錄
          </button>
        </div>
      </div>

      {activeTab === 'portfolio' ? (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3 className="card-title mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M12 20v-6M6 20V10M18 20V4"></path>
              </svg>
              持股管理
              {loading && (
                <span className="loading-indicator ml-2">
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span className="sr-only">載入中...</span>
                </span>
              )}
            </h3>
            <div className="portfolio-summary">
              <div className="summary-item">
                總成本: <span className="font-bold">${calculateTotalCost()}</span>
              </div>
              <div className="summary-item">
                損益: <span className={`font-bold ${parseFloat(calculateProfit()) >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                  ${parseFloat(calculateProfit()) >= 0 ? '+' : ''}{calculateProfit()}
                </span>
              </div>
              <div className="summary-item">
                目前總市值: <span className="font-bold">${calculateTotalValue()}</span>
              </div>
            </div>
          </div>

          <div className="card-body">
        <div className="add-stock-form mb-4">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stockSymbol" className="form-label">股票代碼</label>
              <input
                id="stockSymbol"
                className="form-control"
                placeholder="例如: AAPL"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                maxLength={10}
              />
            </div>

            <div className="form-group">
              <label htmlFor="stockShares" className="form-label">股數</label>
              <input
                id="stockShares"
                className="form-control"
                placeholder="例如: 100"
                type="number"
                min={1}
                value={shares}
                onChange={e => setShares(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="stockCost" className="form-label">成本</label>
              <input
                id="stockCost"
                className="form-control"
                placeholder="例如: 150.50"
                type="number"
                min={0}
                step={0.01}
                value={cost}
                onChange={e => setCost(e.target.value)}
              />
            </div>

            <div className="form-group d-flex align-items-end">
              <button
                className="btn btn-primary"
                onClick={addStock}
                disabled={!symbol.trim() || Number(shares) <= 0 || Number(cost) <= 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                新增股票
              </button>
            </div>
          </div>
          {error && (
            <div className="error-message mt-2 text-error">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}
        </div>

        {portfolio.length > 0 ? (
          <div className="table-responsive">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th className={getClassNamesFor('symbol')} onClick={() => requestSort('symbol')}>
                    股票代碼
                    <span className="sort-indicator"></span>
                  </th>
                  <th className={getClassNamesFor('name')} onClick={() => requestSort('name')}>
                    股票名稱
                    <span className="sort-indicator"></span>
                  </th>
                  <th className={getClassNamesFor('shares')} onClick={() => requestSort('shares')}>
                    股數
                    <span className="sort-indicator"></span>
                  </th>
                  <th className={getClassNamesFor('cost')} onClick={() => requestSort('cost')}>
                    成本
                    <span className="sort-indicator"></span>
                  </th>
                  <th className={getClassNamesFor('totalValue')} onClick={() => requestSort('totalValue')}>
                    成本總值
                    <span className="sort-indicator"></span>
                  </th>
                  <th className={getClassNamesFor('currentPrice')} onClick={() => requestSort('currentPrice')}>
                    目前股價
                    <span className="sort-indicator"></span>
                  </th>
                  <th className={getClassNamesFor('currentTotalValue')} onClick={() => requestSort('currentTotalValue')}>
                    目前總市值
                    <span className="sort-indicator"></span>
                  </th>
                  <th className={getClassNamesFor('exDividendDate')} onClick={() => requestSort('exDividendDate')}>
                    除息日
                    <span className="sort-indicator"></span>
                  </th>
                  <th className={getClassNamesFor('cashDividendPerShare')} onClick={() => requestSort('cashDividendPerShare')}>
                    每股配息
                    <span className="sort-indicator"></span>
                  </th>
                  <th className={getClassNamesFor('stockDividendPerShare')} onClick={() => requestSort('stockDividendPerShare')}>
                    每股配股
                    <span className="sort-indicator"></span>
                  </th>
                  <th className={getClassNamesFor('cashYield')} onClick={() => requestSort('cashYield')}>
                    現金殖利率(%)
                    <span className="sort-indicator"></span>
                  </th>
                  <th className={getClassNamesFor('totalYield')} onClick={() => requestSort('totalYield')}>
                    總殖利率(%)
                    <span className="sort-indicator"></span>
                  </th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {getSortedPortfolio().map((stock) => (
                  <tr key={stock.id}>
                    <td className="stock-symbol">{stock.symbol}</td>
                    <td>{stock.name || '-'}</td>
                    <td>
                      {editingId === stock.id ? (
                        <input
                          type="number"
                          className="edit-input"
                          value={editStock.shares}
                          onChange={e => setEditStock({...editStock, shares: e.target.value})}
                          min={1}
                        />
                      ) : stock.shares}
                    </td>
                    <td>
                      {editingId === stock.id ? (
                        <input
                          type="number"
                          className="edit-input"
                          value={editStock.cost}
                          onChange={e => setEditStock({...editStock, cost: e.target.value})}
                          min={0}
                          step={0.01}
                        />
                      ) : stock.cost}
                    </td>
                    <td className="stock-value">${stock.totalValue ? stock.totalValue.toFixed(2) : (stock.shares * stock.cost).toFixed(2)}</td>
                    <td className="stock-price">{currentPrice[stock.symbol] ? `$${currentPrice[stock.symbol].toFixed(2)}` : '-'}</td>
                    <td className="stock-value">
                      {currentPrice[stock.symbol] ? `$${(stock.shares * currentPrice[stock.symbol]).toFixed(2)}` : '-'}
                    </td>
                    <td>{stock.exDividendDate || '-'}</td>
                    <td>{stock.cashDividendPerShare || '-'}</td>
                    <td>{stock.stockDividendPerShare || '-'}</td>
                    <td className="yield-value">{stock.cashYield ? `${stock.cashYield}%` : '-'}</td>
                    <td className="yield-value">{stock.totalYield ? `${stock.totalYield}%` : '-'}</td>
                    <td>
                      {editingId === stock.id ? (
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-success mr-1"
                            onClick={() => stock.id && saveEdit(stock.id)}
                            title="儲存"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={cancelEdit}
                            title="取消"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-outline mr-1"
                            onClick={() => startEditing(stock)}
                            title="編輯"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            className="btn btn-sm btn-error"
                            onClick={() => stock.id && removeStock(stock.id)}
                            title="刪除"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-portfolio">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <p>您的投資組合目前為空，請新增股票以開始追蹤您的投資。</p>
          </div>
        )}
      </div>
        </div>
      ) : (
        <TradeHistory portfolio={portfolio} setPortfolio={setPortfolio} />
      )}

      <style jsx>{`
        .portfolio-container {
          width: 100%;
        }

        .tabs-container {
          margin-bottom: var(--space-md);
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid var(--color-border);
        }

        .tab {
          display: flex;
          align-items: center;
          padding: var(--space-sm) var(--space-md);
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--color-text-secondary);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tab:hover {
          color: var(--color-text-primary);
        }

        .tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        .portfolio-summary {
          display: flex;
          gap: var(--space-md);
          font-size: var(--font-size-md);
          color: var(--color-text-secondary);
        }

        .summary-item {
          display: flex;
          align-items: center;
        }

        .profit-positive {
          color: var(--color-success);
        }

        .profit-negative {
          color: var(--color-error);
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-md);
        }

        .form-group {
          margin-bottom: var(--space-sm);
        }

        .form-label {
          display: block;
          margin-bottom: var(--space-xxs);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .form-control {
          width: 100%;
          padding: var(--space-xs) var(--space-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--font-size-md);
        }

        .form-control:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .error-message {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-xs);
          border-radius: var(--radius-md);
          background-color: rgba(211, 47, 47, 0.1);
        }

        .portfolio-table {
          width: 100%;
          border-collapse: collapse;
        }

        .portfolio-table th {
          text-align: left;
          padding: var(--space-sm);
          background-color: var(--color-background);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-secondary);
          border-bottom: 1px solid var(--color-border);
          position: relative;
          cursor: pointer;
          user-select: none;
        }

        .portfolio-table th:hover {
          background-color: var(--color-background-hover);
        }

        .portfolio-table th.sortable {
          padding-right: var(--space-lg);
        }

        .portfolio-table th.sortable .sort-indicator {
          position: absolute;
          right: var(--space-sm);
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
        }

        .portfolio-table th.sortable.ascending .sort-indicator {
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 5px solid var(--color-text-secondary);
        }

        .portfolio-table th.sortable.descending .sort-indicator {
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid var(--color-text-secondary);
        }

        .portfolio-table td {
          padding: var(--space-sm);
          border-bottom: 1px solid var(--color-divider);
        }

        .stock-symbol {
          font-weight: var(--font-weight-semibold);
          color: var(--color-primary);
        }

        .stock-value {
          font-weight: var(--font-weight-semibold);
        }

        .yield-value {
          font-weight: var(--font-weight-medium);
          color: var(--color-success);
        }

        .action-buttons {
          display: flex;
          gap: var(--space-xxs);
        }

        .edit-input {
          width: 80px;
          padding: var(--space-xxs) var(--space-xs);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
        }

        .empty-portfolio {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl) 0;
          color: var(--color-text-secondary);
          text-align: center;
        }

        .empty-portfolio svg {
          margin-bottom: var(--space-md);
          color: var(--color-text-disabled);
        }

        @media (max-width: 992px) {
          .form-row {
            grid-template-columns: repeat(2, 1fr);
          }

          .portfolio-summary {
            flex-direction: column;
            gap: var(--space-xs);
            align-items: flex-end;
          }
        }

        @media (max-width: 768px) {
          .card-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .portfolio-summary {
            margin-top: var(--space-sm);
            flex-direction: row;
            width: 100%;
            justify-content: space-between;
          }
        }

        @media (max-width: 576px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .table-responsive {
            overflow-x: auto;
          }

          .portfolio-summary {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        .loading-indicator {
          display: inline-flex;
          align-items: center;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .spinner-border-sm {
          width: 1rem;
          height: 1rem;
          border: 0.15em solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spinner-border .75s linear infinite;
          margin-right: 0.5rem;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        @keyframes spinner-border {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
