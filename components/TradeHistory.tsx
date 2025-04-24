import React, { useState, useEffect, useRef } from 'react';
import ResponsiveTradeCard from './ResponsiveTradeCard';

interface Trade {
  id: number;
  date: string;
  symbol: string;
  type: 'buy' | 'sell' | 'dividend' | 'stockDividend' | 'capitalIncrease' | 'capitalDecrease';
  shares: number;
  price: number;
  total: number;
  fee: number; // 手續費
  tax: number; // 證交稅
  netTotal: number; // 淨收入/支出
  notes: string;
}

interface Stock {
  symbol: string;
  shares: number;
  cost: number;
  id?: number;
}

export default function TradeHistory({ portfolio, setPortfolio }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<'buy' | 'sell' | 'dividend' | 'stockDividend' | 'capitalIncrease' | 'capitalDecrease'>('buy');
  const [shares, setShares] = useState<number | string>('');
  const [price, setPrice] = useState<number | string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [fee, setFee] = useState<number | string>('');
  const [tax, setTax] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [stockOptions, setStockOptions] = useState<string[]>([]);
  const [maxSellShares, setMaxSellShares] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [newTradeIds, setNewTradeIds] = useState<number[]>([]);
  const [editingTradeId, setEditingTradeId] = useState<number | null>(null);
  const [editTrade, setEditTrade] = useState<{
    symbol: string;
    type: 'buy' | 'sell' | 'dividend' | 'stockDividend' | 'capitalIncrease' | 'capitalDecrease';
    shares: string;
    price: string;
    date: string;
    fee: string;
    tax: string;
    notes: string;
  }>({
    symbol: '',
    type: 'buy',
    shares: '',
    price: '',
    date: '',
    fee: '',
    tax: '',
    notes: ''
  });
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterSymbol, setFilterSymbol] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 載入交易記錄
  useEffect(() => {
    const storedTrades = localStorage.getItem('trades');
    if (storedTrades) {
      try {
        const parsedTrades = JSON.parse(storedTrades);
        setTrades(parsedTrades);
        setFilteredTrades(parsedTrades); // 初始化 filteredTrades
      } catch (e) {
        console.error('Failed to parse trades data', e);
      }
    }

    // 定義全局方法，用於響應持股刪除事件
    window.updateTradesAfterStockRemoval = (symbol: string) => {
      setTrades(prevTrades => prevTrades.filter(trade => trade.symbol !== symbol));
    };

    // 清理函數
    return () => {
      delete window.updateTradesAfterStockRemoval;
    };
  }, []);

  // 儲存交易記錄
  useEffect(() => {
    localStorage.setItem('trades', JSON.stringify(trades));
  }, [trades]);

  // 處理排序和篩選
  useEffect(() => {
    let result = [...trades];

    // 應用篩選
    if (filterSymbol) {
      result = result.filter(trade => trade.symbol.toUpperCase().includes(filterSymbol.toUpperCase()));
    }

    if (filterType) {
      result = result.filter(trade => trade.type === filterType);
    }

    // 應用排序
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'shares':
          comparison = a.shares - b.shares;
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
        case 'netTotal':
          comparison = a.netTotal - b.netTotal;
          break;
        default:
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredTrades(result);
  }, [trades, sortField, sortDirection, filterSymbol, filterType]);

  // 更新股票選項
  useEffect(() => {
    if (portfolio && portfolio.length > 0) {
      // 獲取所有持股的股票代碼
      const symbols = portfolio.map(stock => stock.symbol);
      setStockOptions(symbols);

      // 如果當前選擇的股票不在持股中，重置選擇
      if (symbol && !symbols.includes(symbol)) {
        setSymbol('');
      }
    } else {
      setStockOptions([]);
    }
  }, [portfolio, symbol]);

  // 當選擇股票或交易類型變更時，更新最大可賣出股數
  useEffect(() => {
    if (type === 'sell' && symbol) {
      const stock = portfolio.find(s => s.symbol === symbol);
      if (stock) {
        setMaxSellShares(stock.shares);
      } else {
        setMaxSellShares(0);
      }
    }
  }, [type, symbol, portfolio]);

  // 添加交易記錄
  const addTrade = () => {
    if (!symbol || !date) {
      setError('請填寫所有必填欄位');
      return;
    }

    if (!price) {
      setError('請填寫價格或股利金額');
      return;
    }

    if (type !== 'dividend' && !shares) {
      setError('請填寫股數');
      return;
    }

    const sharesNum = type === 'dividend' ? 0 : Number(shares);
    const priceNum = Number(price);
    const feeNum = (type === 'buy' || type === 'sell' || type === 'capitalIncrease' || type === 'capitalDecrease') && fee ? Number(fee) : 0;
    const taxNum = (type === 'sell' || type === 'capitalDecrease') && tax ? Number(tax) : 0;

    if ((type === 'buy' || type === 'sell' || type === 'stockDividend' || type === 'capitalIncrease' || type === 'capitalDecrease') && sharesNum <= 0) {
      setError('股數必須大於零');
      return;
    }

    if (priceNum <= 0) {
      setError('價格或股利金額必須大於零');
      return;
    }

    if (feeNum < 0) {
      setError('手續費不能為負數');
      return;
    }

    if (taxNum < 0) {
      setError('證交稅不能為負數');
      return;
    }

    if (type === 'sell' || type === 'capitalDecrease') {
      // 檢查是否有足夠的股票可賣或減資
      const stock = portfolio.find(s => s.symbol === symbol);
      if (!stock || stock.shares < sharesNum) {
        setError(`您沒有足夠的 ${symbol} 股票可${type === 'sell' ? '賣出' : '減資'}`);
        return;
      }
    }

    // 計算總額和淨額
    let total = 0;
    let netTotal = 0;

    if (type === 'buy' || type === 'capitalIncrease') {
      total = sharesNum * priceNum;
      netTotal = -(total + feeNum); // 買入或增資：-(總價 + 手續費)，使用負數表示資金流出
    } else if (type === 'sell' || type === 'capitalDecrease') {
      total = sharesNum * priceNum;
      netTotal = total - feeNum - taxNum; // 賣出或減資：總價 - 手續費 - 證交稅
    } else if (type === 'dividend') {
      // 現金股利：總額為持股數 * 每股股利
      const stock = portfolio.find(s => s.symbol === symbol);
      if (!stock) {
        setError(`您沒有持有 ${symbol} 的股票`);
        return;
      }
      total = stock.shares * priceNum;
      netTotal = total; // 現金股利沒有手續費和證交稅
    } else if (type === 'stockDividend') {
      // 股票股利：總額為配發股數 * 淘汗價格
      total = sharesNum * priceNum;
      netTotal = total; // 股票股利沒有手續費和證交稅
    }

    // 創建新交易記錄
    const newTrade: Trade = {
      id: Date.now(),
      date,
      symbol,
      type,
      shares: sharesNum,
      price: priceNum,
      total,
      fee: feeNum || 0,
      tax: taxNum || 0,
      netTotal,
      notes: notes.trim() || ''
    };

    // 更新交易記錄
    const updatedTrades = [newTrade, ...trades];
    setTrades(updatedTrades);
    // 不需要手動更新 filteredTrades，因為 useEffect 會自動處理

    // 更新持股
    updatePortfolio(newTrade);

    // 重置表單
    resetForm();
    setShowForm(false);
  };

  // 更新持股
  const updatePortfolio = (trade: Trade, portfolioToUpdate: Stock[] = [...portfolio]) => {
    const { symbol, shares, price, type } = trade;
    const stockIndex = portfolioToUpdate.findIndex(s => s.symbol === symbol);

    if (type === 'buy' || type === 'stockDividend' || type === 'capitalIncrease') {
      if (stockIndex >= 0) {
        // 已有該股票，更新持股
        const stock = portfolioToUpdate[stockIndex];
        const totalShares = stock.shares + shares;

        // 計算新的成本
        let totalCost = stock.shares * stock.cost;
        let newCost = stock.cost;

        if (type === 'buy') {
          // 買入時計入成本
          totalCost += shares * price;
          newCost = totalCost / totalShares;
        } else if (type === 'stockDividend') {
          // 股票股利不改變平均成本
          // 成本保持不變，只增加股數
        } else if (type === 'capitalIncrease') {
          // 增資時計入成本
          totalCost += shares * price;
          newCost = totalCost / totalShares;
        }

        portfolioToUpdate[stockIndex] = {
          ...stock,
          shares: totalShares,
          cost: newCost
        };
      } else {
        // 新增股票
        portfolioToUpdate.push({
          symbol,
          shares,
          cost: (type === 'buy' || type === 'capitalIncrease') ? price : 0, // 股票股利的成本為 0
          id: Date.now()
        });
      }
    } else if (type === 'sell' || type === 'capitalDecrease') {
      if (stockIndex >= 0) {
        const stock = portfolioToUpdate[stockIndex];
        const remainingShares = stock.shares - shares;

        if (remainingShares > 0) {
          // 還有剩餘股票
          portfolioToUpdate[stockIndex] = {
            ...stock,
            shares: remainingShares
          };
        } else {
          // 全部賣出或減資後無剩餘股票，移除該股票
          portfolioToUpdate.splice(stockIndex, 1);
        }
      }
    } else if (type === 'dividend') {
      // 現金股利不改變持股狀況
      // 不需要做任何變更
    }

    // 如果沒有提供自定義的 portfolio，則更新狀態
    if (portfolioToUpdate === portfolio) {
      setPortfolio([...portfolioToUpdate]);
    }

    return portfolioToUpdate;
  };

  // 刪除交易記錄
  const deleteTrade = (tradeId: number) => {
    if (!confirm('刪除此交易記錄將會影響您的持股狀況，確定要刪除嗎？')) {
      return;
    }

    const tradeToDelete = trades.find(t => t.id === tradeId);
    if (!tradeToDelete) return;

    // 反向更新持股
    if (tradeToDelete.type === 'buy' || tradeToDelete.type === 'capitalIncrease') {
      // 如果是買入或增資，反向操作是賣出
      const reverseTrade: Trade = {
        ...tradeToDelete,
        type: 'sell'
      };
      updatePortfolio(reverseTrade);
    } else if (tradeToDelete.type === 'sell' || tradeToDelete.type === 'capitalDecrease') {
      // 如果是賣出或減資，反向操作是買入
      const reverseTrade: Trade = {
        ...tradeToDelete,
        type: 'buy'
      };
      updatePortfolio(reverseTrade);
    } else if (tradeToDelete.type === 'stockDividend') {
      // 如果是股票股利，反向操作是賣出相同數量的股票
      const reverseTrade: Trade = {
        ...tradeToDelete,
        type: 'sell'
      };
      updatePortfolio(reverseTrade);
    } else if (tradeToDelete.type === 'dividend') {
      // 如果是現金股利，不需要反向更新持股
      // 因為現金股利不會影響持股狀況
    }

    // 移除交易記錄
    const updatedTrades = trades.filter(t => t.id !== tradeId);
    setTrades(updatedTrades);
    // 不需要手動更新 filteredTrades，因為 useEffect 會自動處理
  };

  // 開始編輯交易
  const startEditTrade = (tradeId: number) => {
    const tradeToEdit = trades.find(t => t.id === tradeId);
    if (!tradeToEdit) return;

    setEditingTradeId(tradeId);
    setEditTrade({
      symbol: tradeToEdit.symbol,
      type: tradeToEdit.type,
      shares: tradeToEdit.shares.toString(),
      price: tradeToEdit.price.toString(),
      date: tradeToEdit.date,
      fee: tradeToEdit.fee.toString(),
      tax: tradeToEdit.tax.toString(),
      notes: tradeToEdit.notes || ''
    });

    setShowForm(true);
    setError('');
  };

  // 取消編輯
  const cancelEdit = () => {
    setEditingTradeId(null);
    resetForm();
  };

  // 保存編輯
  const saveEditTrade = () => {
    if (!editingTradeId) return;

    if (!editTrade.symbol || !editTrade.date) {
      setError('請填寫所有必填欄位');
      return;
    }

    if (!editTrade.price) {
      setError('請填寫價格或股利金額');
      return;
    }

    if (editTrade.type !== 'dividend' && !editTrade.shares) {
      setError('請填寫股數');
      return;
    }

    const sharesNum = editTrade.type === 'dividend' ? 0 : Number(editTrade.shares);
    const priceNum = Number(editTrade.price);
    const feeNum = (editTrade.type === 'buy' || editTrade.type === 'sell' || editTrade.type === 'capitalIncrease' || editTrade.type === 'capitalDecrease') && editTrade.fee ? Number(editTrade.fee) : 0;
    const taxNum = (editTrade.type === 'sell' || editTrade.type === 'capitalDecrease') && editTrade.tax ? Number(editTrade.tax) : 0;

    if ((editTrade.type === 'buy' || editTrade.type === 'sell' || editTrade.type === 'stockDividend' || editTrade.type === 'capitalIncrease' || editTrade.type === 'capitalDecrease') && sharesNum <= 0) {
      setError('股數必須大於零');
      return;
    }

    if (priceNum <= 0) {
      setError('價格或股利金額必須大於零');
      return;
    }

    if (feeNum < 0) {
      setError('手續費不能為負數');
      return;
    }

    if (taxNum < 0) {
      setError('證交稅不能為負數');
      return;
    }

    // 找到原始交易
    const originalTrade = trades.find(t => t.id === editingTradeId);
    if (!originalTrade) return;

    // 計算總額和淨額
    let total = 0;
    let netTotal = 0;

    if (editTrade.type === 'buy' || editTrade.type === 'capitalIncrease') {
      total = sharesNum * priceNum;
      netTotal = -(total + feeNum); // 買入或增資：-(總價 + 手續費)，使用負數表示資金流出
    } else if (editTrade.type === 'sell' || editTrade.type === 'capitalDecrease') {
      total = sharesNum * priceNum;
      netTotal = total - feeNum - taxNum; // 賣出或減資：總價 - 手續費 - 證交稅
    } else if (editTrade.type === 'dividend') {
      // 現金股利：總額為持股數 * 每股股利
      const stock = portfolio.find(s => s.symbol === editTrade.symbol);
      if (!stock) {
        setError(`您沒有持有 ${editTrade.symbol} 的股票`);
        return;
      }
      total = stock.shares * priceNum;
      netTotal = total; // 現金股利沒有手續費和證交稅
    } else if (editTrade.type === 'stockDividend') {
      // 股票股利：總額為配發股數 * 淘汗價格
      total = sharesNum * priceNum;
      netTotal = total; // 股票股利沒有手續費和證交稅
    }

    // 先反向更新持股（撤銷原交易的影響）
    if (originalTrade.type === 'buy' || originalTrade.type === 'capitalIncrease') {
      // 如果原交易是買入或增資，反向操作是賣出
      const reverseTrade: Trade = {
        ...originalTrade,
        type: 'sell'
      };
      updatePortfolio(reverseTrade);
    } else if (originalTrade.type === 'sell' || originalTrade.type === 'capitalDecrease') {
      // 如果原交易是賣出或減資，反向操作是買入
      const reverseTrade: Trade = {
        ...originalTrade,
        type: 'buy'
      };
      updatePortfolio(reverseTrade);
    } else if (originalTrade.type === 'stockDividend') {
      // 如果原交易是股票股利，反向操作是賣出相同數量的股票
      const reverseTrade: Trade = {
        ...originalTrade,
        type: 'sell'
      };
      updatePortfolio(reverseTrade);
    }

    // 創建更新後的交易記錄
    const updatedTrade: Trade = {
      id: editingTradeId,
      date: editTrade.date,
      symbol: editTrade.symbol,
      type: editTrade.type,
      shares: sharesNum,
      price: priceNum,
      total,
      fee: feeNum || 0,
      tax: taxNum || 0,
      netTotal,
      notes: editTrade.notes.trim() || ''
    };

    // 更新交易記錄
    const updatedTrades = trades.map(t => t.id === editingTradeId ? updatedTrade : t);
    setTrades(updatedTrades);

    // 更新持股（應用新交易的影響）
    updatePortfolio(updatedTrade);

    // 重置表單
    setEditingTradeId(null);
    resetForm();
    setShowForm(false);
    setSuccess('交易記錄已成功更新');

    // 設置高亮顯示
    setNewTradeIds([editingTradeId]);
    setTimeout(() => {
      setNewTradeIds([]);
    }, 3000);
  };

  // 重置表單
  const resetForm = () => {
    setSymbol('');
    setType('buy');
    setShares('');
    setPrice('');
    setDate(new Date().toISOString().split('T')[0]);
    setFee('');
    setTax('');
    setNotes('');
    setError('');
    setEditingTradeId(null);
    setEditTrade({
      symbol: '',
      type: 'buy',
      shares: '',
      price: '',
      date: '',
      fee: '',
      tax: '',
      notes: ''
    });
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  // 解析日期字符串為 ISO 格式
  const parseDate = (dateStr: string) => {
    // 假設日期格式為 YYYY/MM/DD 或 YYYY-MM-DD
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);

      // 使用 YYYY-MM-DD 格式創建日期字符串，避免時區問題
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    return new Date().toISOString().split('T')[0]; // 預設為今天
  };

  // 解析金額字符串
  const parseAmount = (amountStr: string) => {
    if (!amountStr) return 0;
    // 移除引號、逗號和空格
    return parseFloat(amountStr.replace(/["',\s]/g, ''));
  };

  // 解析交易類別
  const parseTradeType = (typeStr: string): 'buy' | 'sell' | 'dividend' | 'stockDividend' | 'capitalIncrease' | 'capitalDecrease' => {
    if (typeStr.includes('買入') || typeStr.includes('買進') || typeStr.includes('現股買入')) {
      return 'buy';
    } else if (typeStr.includes('賣出') || typeStr.includes('賣出') || typeStr.includes('現股賣出')) {
      return 'sell';
    } else if (typeStr.includes('除權') || typeStr.includes('股票股利') || typeStr.includes('配股')) {
      return 'stockDividend';
    } else if (typeStr.includes('除息') || typeStr.includes('現金股利') || typeStr.includes('配息')) {
      return 'dividend';
    } else if (typeStr.includes('增資')) {
      return 'capitalIncrease';
    } else if (typeStr.includes('減資')) {
      return 'capitalDecrease';
    }
    return 'buy'; // 預設為買入
  };

  // 解析 CSV 文件
  const parseCSV = (text: string, symbol: string) => {
    setError('');
    setSuccess('');
    setIsImporting(true);

    try {
      // 分割行
      const lines = text.split(/\r?\n/).filter(line => line.trim());

      // 移除標題行
      if (lines.length > 0 && lines[0].includes('交易日期')) {
        lines.shift();
      }

      if (lines.length === 0) {
        setError('CSV 文件不包含任何有效數據');
        setIsImporting(false);
        return;
      }

      const newTrades: Trade[] = [];
      const updatedPortfolio = [...portfolio];

      // 解析每一行
      for (const line of lines) {
        // 分割欄位，考慮引號內的逗號
        const columns: string[] = [];
        let inQuotes = false;
        let currentColumn = '';

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            columns.push(currentColumn);
            currentColumn = '';
          } else {
            currentColumn += char;
          }
        }

        // 添加最後一個欄位
        columns.push(currentColumn);

        if (columns.length < 9) {
          console.warn('跳過無效行:', line);
          continue;
        }

        const tradeDate = parseDate(columns[0]);
        const tradeType = parseTradeType(columns[1]);
        const price = parseAmount(columns[2]);
        const buyShares = parseAmount(columns[3]);
        const sellShares = parseAmount(columns[4]);
        const fee = parseAmount(columns[5]);
        const amount = parseAmount(columns[6]);
        const tax = parseAmount(columns[7]);
        const netAmount = parseAmount(columns[8]);
        const notes = columns[9] || '';

        // 確定股數
        let shares = tradeType === 'buy' ? buyShares : sellShares;

        // 如果是現金股利，股數可以為 0，後續會使用持股數量
        if (tradeType === 'dividend') {
          shares = 0;
        }
        // 如果是股票股利（除權），使用 buyShares 欄位的股數
        else if (tradeType === 'stockDividend') {
          shares = buyShares;
          if (shares <= 0) {
            console.warn('跳過無效股票股利股數:', line);
            continue;
          }
        } else if (shares <= 0) {
          console.warn('跳過無效股數:', line);
          continue;
        }

        // 創建交易記錄
        const trade: Trade = {
          id: Date.now() + newTrades.length, // 確保 ID 唯一
          date: tradeDate,
          symbol,
          type: tradeType,
          shares: shares || 0,
          price: price || 0,
          total: amount || 0,
          fee: fee || 0,
          tax: tax || 0,
          netTotal: netAmount || 0,
          notes: notes || ''
        };

        newTrades.push(trade);

        // 更新持股
        // 使用函數返回值確保持股被正確更新
        updatePortfolio(trade, updatedPortfolio);
      }

      if (newTrades.length === 0) {
        setError('沒有發現有效的交易記錄');
        setIsImporting(false);
        return;
      }

      // 更新交易記錄和持股
      const updatedTrades = [...newTrades, ...trades];
      setTrades(updatedTrades);
      // 不需要手動更新 filteredTrades，因為 useEffect 會自動處理
      setPortfolio(updatedPortfolio);

      // 記錄新交易的 ID，用於高亮顯示
      const newIds = newTrades.map(trade => trade.id);
      setNewTradeIds(newIds);

      // 儲存更新後的交易記錄
      localStorage.setItem('trades', JSON.stringify(updatedTrades));

      setSuccess(`成功匯入 ${newTrades.length} 筆交易記錄`);

      // 5 秒後清除高亮效果
      setTimeout(() => {
        setNewTradeIds([]);
      }, 5000);
    } catch (err) {
      console.error('解析 CSV 文件失敗:', err);
      setError('解析 CSV 文件失敗，請確保文件格式正確');
    } finally {
      setIsImporting(false);
    }
  };



  // 處理文件選擇
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 從文件名取得股票代碼（移除副檔名）
    const symbol = file.name.replace(/\.csv$/i, '').toUpperCase();

    if (!symbol) {
      setError('無法從文件名取得股票代碼');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        parseCSV(text, symbol);
      }
    };
    reader.onerror = () => {
      setError('讀取文件失敗');
    };
    reader.readAsText(file);

    // 重置文件輸入，允許選擇相同的文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 觸發文件選擇對話框
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="card mt-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="card-title mb-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          交易記錄
        </h3>
        <div className="header-actions">
          <button
            className="btn btn-outline btn-sm mr-2"
            onClick={triggerFileInput}
            disabled={isImporting}
            title="匯入 CSV 檔案"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            匯入 CSV
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv"
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (showForm && editingTradeId) {
                // 如果正在編輯，點擊取消會重置編輯狀態
                cancelEdit();
                setShowForm(false);
              } else {
                // 否則切換表單顯示狀態
                setShowForm(!showForm);
                if (showForm) {
                  resetForm();
                }
              }
            }}
          >
            {showForm ? (editingTradeId ? '取消編輯' : '取消') : '新增交易'}
          </button>
        </div>
      </div>

      <div className="card-body">
        {isImporting && (
          <div className="importing-indicator">
            <div className="spinner"></div>
            <p>正在匯入交易記錄...</p>
          </div>
        )}

        {success && !error && (
          <div className="success-message mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            {success}
          </div>
        )}

        {error && (
          <div className="error-message mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        {showForm && (
          <div className="trade-form mb-4">
            <h3 className="form-title mb-3">{editingTradeId ? '編輯交易' : '新增交易'}</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tradeDate" className="form-label">交易日期 <span className="required">*</span></label>
                <input
                  id="tradeDate"
                  className="form-control"
                  type="date"
                  value={editingTradeId ? editTrade.date : date}
                  onChange={e => editingTradeId ? setEditTrade({...editTrade, date: e.target.value}) : setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label htmlFor="tradeType" className="form-label">交易類型 <span className="required">*</span></label>
                <select
                  id="tradeType"
                  className="form-control"
                  value={editingTradeId ? editTrade.type : type}
                  onChange={e => {
                    const newType = e.target.value as 'buy' | 'sell' | 'dividend' | 'stockDividend' | 'capitalIncrease' | 'capitalDecrease';
                    if (editingTradeId) {
                      setEditTrade({...editTrade, type: newType});
                    } else {
                      setType(newType);
                    }
                  }}
                >
                  <option value="buy">買入</option>
                  <option value="sell">賣出</option>
                  <option value="dividend">現金股利</option>
                  <option value="stockDividend">股票股利</option>
                  <option value="capitalIncrease">增資</option>
                  <option value="capitalDecrease">減資</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tradeSymbol" className="form-label">股票代碼 <span className="required">*</span></label>
                {type === 'sell' ? (
                  <select
                    id="tradeSymbol"
                    className="form-control"
                    value={editingTradeId ? editTrade.symbol : symbol}
                    onChange={e => editingTradeId ? setEditTrade({...editTrade, symbol: e.target.value}) : setSymbol(e.target.value)}
                  >
                    <option value="">請選擇股票</option>
                    {stockOptions.map(sym => (
                      <option key={sym} value={sym}>{sym}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="tradeSymbol"
                    className="form-control"
                    placeholder="例如: AAPL"
                    value={editingTradeId ? editTrade.symbol : symbol}
                    onChange={e => editingTradeId ? setEditTrade({...editTrade, symbol: e.target.value.toUpperCase()}) : setSymbol(e.target.value.toUpperCase())}
                    maxLength={10}
                  />
                )}
              </div>

              <div className="form-group">
                <label htmlFor="tradeShares" className="form-label">
                  {type === 'stockDividend' ? '配發股數' :
                   type === 'capitalIncrease' ? '增資股數' :
                   type === 'capitalDecrease' ? '減資股數' : '股數'}
                  <span className="required">*</span>
                </label>
                <input
                  id="tradeShares"
                  className="form-control"
                  placeholder={type === 'stockDividend' ? '例如: 10' : '例如: 100'}
                  type="number"
                  min={type === 'dividend' ? 0 : 1}
                  max={type === 'sell' ? maxSellShares : undefined}
                  value={editingTradeId ? editTrade.shares : shares}
                  onChange={e => editingTradeId ? setEditTrade({...editTrade, shares: e.target.value}) : setShares(e.target.value)}
                  disabled={type === 'dividend'}
                />
                {type === 'sell' && maxSellShares > 0 && (
                  <small className="form-text">最多可賣出: {maxSellShares} 股</small>
                )}
                {type === 'dividend' && (
                  <small className="form-text">現金股利不需要輸入股數</small>
                )}
              </div>
            </div>

            <div className="form-row mt-2">
              <div className="form-group">
                <label htmlFor="tradePrice" className="form-label">
                  {type === 'dividend' ? '每股股利' :
                   type === 'stockDividend' ? '每股淘汗價格' :
                   type === 'capitalIncrease' ? '增資價格' :
                   type === 'capitalDecrease' ? '減資價格' : '價格'}
                  <span className="required">*</span>
                </label>
                <input
                  id="tradePrice"
                  className="form-control"
                  placeholder={type === 'dividend' ? '例如: 0.5' :
                              type === 'stockDividend' ? '例如: 10' :
                              type === 'capitalIncrease' ? '例如: 25.00' :
                              type === 'capitalDecrease' ? '例如: 30.00' : '例如: 150.50'}
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={editingTradeId ? editTrade.price : price}
                  onChange={e => editingTradeId ? setEditTrade({...editTrade, price: e.target.value}) : setPrice(e.target.value)}
                />
                {type === 'dividend' && (
                  <small className="form-text">輸入每股發放的現金股利金額</small>
                )}
                {type === 'stockDividend' && (
                  <small className="form-text">輸入股票股利的淘汗價格</small>
                )}
                {type === 'capitalIncrease' && (
                  <small className="form-text">輸入增資的價格</small>
                )}
                {type === 'capitalDecrease' && (
                  <small className="form-text">輸入減資的價格</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="tradeFee" className="form-label">手續費</label>
                <input
                  id="tradeFee"
                  className="form-control"
                  placeholder="例如: 20"
                  type="number"
                  min={0}
                  step={0.01}
                  value={editingTradeId ? editTrade.fee : fee}
                  onChange={e => editingTradeId ? setEditTrade({...editTrade, fee: e.target.value}) : setFee(e.target.value)}
                  disabled={type === 'dividend' || type === 'stockDividend'}
                />
                {(type === 'dividend' || type === 'stockDividend') && (
                  <small className="form-text">股利不需要手續費</small>
                )}
                {(type === 'capitalIncrease') && (
                  <small className="form-text">輸入增資的手續費</small>
                )}
                {(type === 'capitalDecrease') && (
                  <small className="form-text">輸入減資的手續費</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="tradeTax" className="form-label">證交稅 {type === 'sell' || type === 'capitalDecrease' ? '' : '(賣出或減資時才需要)'}</label>
                <input
                  id="tradeTax"
                  className="form-control"
                  placeholder="例如: 30"
                  type="number"
                  min={0}
                  step={0.01}
                  value={editingTradeId ? editTrade.tax : tax}
                  onChange={e => editingTradeId ? setEditTrade({...editTrade, tax: e.target.value}) : setTax(e.target.value)}
                  disabled={type !== 'sell' && type !== 'capitalDecrease'}
                />
                {(type === 'dividend' || type === 'stockDividend') && (
                  <small className="form-text">股利不需要證交稅</small>
                )}
                {(type === 'capitalDecrease') && (
                  <small className="form-text">輸入減資的證交稅</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="tradeNotes" className="form-label">備註</label>
                <input
                  id="tradeNotes"
                  className="form-control"
                  placeholder="交易原因或其他備註..."
                  value={editingTradeId ? editTrade.notes : notes}
                  onChange={e => editingTradeId ? setEditTrade({...editTrade, notes: e.target.value}) : setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="form-actions mt-3">
              <button
                className="btn btn-primary"
                onClick={editingTradeId ? saveEditTrade : addTrade}
                disabled={editingTradeId ?
                  (!editTrade.symbol || (!editTrade.shares && editTrade.type !== 'dividend') || !editTrade.price) :
                  (!symbol || (!shares && type !== 'dividend') || !price)}
              >
                {editingTradeId ? '保存修改' : '確認交易'}
              </button>
              <button
                className="btn btn-outline ml-2"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {trades.length > 0 ? (
          <>
            <div className="filter-sort-container mb-3">
              <div className="filter-container">
                <div className="filter-group">
                  <label htmlFor="filterSymbol" className="filter-label">股票代碼</label>
                  <input
                    id="filterSymbol"
                    className="filter-control"
                    placeholder="輸入股票代碼篩選"
                    value={filterSymbol}
                    onChange={e => setFilterSymbol(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="filterType" className="filter-label">交易類型</label>
                  <select
                    id="filterType"
                    className="filter-control"
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                  >
                    <option value="">全部類型</option>
                    <option value="buy">買入</option>
                    <option value="sell">賣出</option>
                    <option value="dividend">現金股利</option>
                    <option value="stockDividend">股票股利</option>
                    <option value="capitalIncrease">增資</option>
                    <option value="capitalDecrease">減資</option>
                  </select>
                </div>
              </div>
              <div className="sort-container">
                <div className="sort-group">
                  <label htmlFor="sortField" className="sort-label">排序欄位</label>
                  <select
                    id="sortField"
                    className="sort-control"
                    value={sortField}
                    onChange={e => setSortField(e.target.value)}
                  >
                    <option value="date">日期</option>
                    <option value="symbol">股票代碼</option>
                    <option value="type">交易類型</option>
                    <option value="shares">股數</option>
                    <option value="price">價格</option>
                    <option value="total">總額</option>
                    <option value="netTotal">淨額</option>
                  </select>
                </div>
                <div className="sort-group">
                  <label htmlFor="sortDirection" className="sort-label">排序方向</label>
                  <select
                    id="sortDirection"
                    className="sort-control"
                    value={sortDirection}
                    onChange={e => setSortDirection(e.target.value as 'asc' | 'desc')}
                  >
                    <option value="desc">降序 (大到小)</option>
                    <option value="asc">升序 (小到大)</option>
                  </select>
                </div>
              </div>
            </div>
            {/* 桌面版表格視圖 */}
            <div className="hidden md:block table-responsive">
              <table className="trades-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>股票</th>
                  <th>類型</th>
                  <th>股數</th>
                  <th>價格</th>
                  <th>總額</th>
                  <th>手續費</th>
                  <th>證交稅</th>
                  <th>淨額</th>
                  <th>備註</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    className={`
                      ${trade.type === 'buy' ? 'trade-buy' : 'trade-sell'}
                      ${newTradeIds.includes(trade.id) ? 'highlight-new' : ''}
                    `}
                  >
                    <td>{formatDate(trade.date)}</td>
                    <td className="trade-symbol">{trade.symbol}</td>
                    <td className={`trade-type ${trade.type === 'buy' ? 'type-buy' : trade.type === 'sell' ? 'type-sell' : trade.type === 'dividend' ? 'type-dividend' : trade.type === 'stockDividend' ? 'type-stock-dividend' : trade.type === 'capitalIncrease' ? 'type-capital-increase' : 'type-capital-decrease'}`}>
                      {trade.type === 'buy' ? '買入' :
                       trade.type === 'sell' ? '賣出' :
                       trade.type === 'dividend' ? '現金股利' :
                       trade.type === 'stockDividend' ? '股票股利' :
                       trade.type === 'capitalIncrease' ? '增資' :
                       '減資'}
                    </td>
                    <td>{trade.shares}</td>
                    <td>${trade.price ? trade.price.toFixed(2) : '0.00'}</td>
                    <td className="trade-total">${trade.total ? trade.total.toFixed(2) : '0.00'}</td>
                    <td>${trade.fee ? trade.fee.toFixed(2) : '0.00'}</td>
                    <td>{trade.type === 'sell' || trade.type === 'capitalDecrease' ? (trade.tax ? `$${trade.tax.toFixed(2)}` : '$0.00') : '-'}</td>
                    <td className={`trade-net ${trade.type === 'buy' || trade.type === 'capitalIncrease' ? 'type-buy' : 'type-sell'}`}>
                      {trade.type === 'buy' || trade.type === 'capitalIncrease' ? '-' : '+'}
                      ${trade.netTotal ? Math.abs(trade.netTotal).toFixed(2) : (trade.total ? trade.total.toFixed(2) : '0.00')}
                    </td>
                    <td className="trade-notes">{trade.notes || '-'}</td>
                    <td className="trade-actions">
                      <button
                        className="btn btn-sm btn-primary mr-1"
                        onClick={() => startEditTrade(trade.id)}
                        title="編輯"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => deleteTrade(trade.id)}
                        title="刪除"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 手機版卡片視圖 */}
          <div className="md:hidden">
            {filteredTrades.map((trade) => (
              <ResponsiveTradeCard
                key={trade.id}
                trade={trade}
                onEdit={startEditTrade}
                onDelete={deleteTrade}
              />
            ))}
          </div>
          </>
        ) : (
          <div className="empty-trades">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 9l-7 7-3-3"></path>
              <path d="M2 2v20h20"></path>
            </svg>
            <p>尚無交易記錄，點擊「新增交易」按鈕開始記錄您的交易。</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .header-actions {
          display: flex;
          align-items: center;
        }

        .importing-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-md);
          margin-bottom: var(--space-md);
          background-color: var(--color-background);
          border-radius: var(--radius-md);
        }

        .importing-indicator .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: var(--color-primary);
          animation: spin 0.8s linear infinite;
          margin-bottom: var(--space-sm);
        }

        .success-message {
          display: flex;
          align-items: center;
          padding: var(--space-sm);
          background-color: rgba(76, 175, 80, 0.1);
          color: var(--color-success);
          border-radius: var(--radius-md);
        }

        .success-message svg {
          margin-right: var(--space-sm);
          flex-shrink: 0;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-md);
        }

        @media (min-width: 576px) {
          .form-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 992px) {
          .form-row {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .form-group {
          margin-bottom: var(--space-sm);
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          display: block;
          margin-bottom: var(--space-xxs);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .required {
          color: var(--color-error);
          font-size: var(--font-size-sm);
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

        .form-text {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          margin-top: var(--space-xxs);
        }

        .error-message {
          display: flex;
          align-items: center;
          padding: var(--space-xs);
          border-radius: var(--radius-md);
          background-color: rgba(211, 47, 47, 0.1);
          color: var(--color-error);
        }

        .form-actions {
          display: flex;
          justify-content: flex-start;
        }

        .trades-table {
          width: 100%;
          border-collapse: collapse;
        }

        .trades-table th {
          text-align: left;
          padding: var(--space-sm);
          background-color: var(--color-background);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-secondary);
          border-bottom: 1px solid var(--color-border);
        }

        .trades-table td {
          padding: var(--space-sm);
          border-bottom: 1px solid var(--color-divider);
        }

        .trade-buy {
          background-color: rgba(76, 175, 80, 0.05);
        }

        .trade-sell {
          background-color: rgba(211, 47, 47, 0.05);
        }

        .trade-symbol {
          font-weight: var(--font-weight-semibold);
          color: var(--color-primary);
        }

        .trade-type {
          font-weight: var(--font-weight-medium);
        }

        .type-buy {
          color: var(--color-success);
        }

        .type-sell {
          color: var(--color-error);
        }

        .type-dividend {
          color: var(--color-info);
        }

        .type-stock-dividend {
          color: var(--color-warning);
        }

        .type-capital-increase {
          color: var(--color-primary);
        }

        .type-capital-decrease {
          color: var(--color-secondary);
        }

        .filter-sort-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          padding: var(--space-sm);
          background-color: var(--color-background);
          border-radius: var(--radius-md);
        }

        .filter-container, .sort-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          width: 100%;
        }

        .filter-group, .sort-group {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .filter-label, .sort-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-xxs);
        }

        .filter-control, .sort-control {
          padding: var(--space-xs) var(--space-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          width: 100%;
        }

        .filter-control:focus, .sort-control:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        @media (min-width: 576px) {
          .filter-container, .sort-container {
            flex-direction: row;
            flex-wrap: wrap;
          }

          .filter-group, .sort-group {
            width: auto;
            min-width: 150px;
          }
        }

        @media (min-width: 768px) {
          .filter-sort-container {
            flex-direction: row;
            justify-content: space-between;
          }

          .filter-container, .sort-container {
            width: auto;
          }
        }

        .trade-total {
          font-weight: var(--font-weight-semibold);
        }

        .trade-net {
          font-weight: var(--font-weight-semibold);
        }

        @keyframes highlight {
          0% { background-color: rgba(255, 235, 59, 0.5); }
          100% { background-color: transparent; }
        }

        .highlight-new {
          animation: highlight 2s ease-out;
        }

        .trade-notes {
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--color-text-secondary);
        }

        .trade-actions {
          display: flex;
          gap: var(--space-xs);
        }

        .mr-1 {
          margin-right: var(--space-xs);
        }

        .empty-trades {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl) 0;
          color: var(--color-text-secondary);
          text-align: center;
        }

        .empty-trades svg {
          margin-bottom: var(--space-md);
          color: var(--color-text-disabled);
        }

        @media (max-width: 992px) {
          .form-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 576px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .table-responsive {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}
