import React from 'react';

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

interface ResponsiveStockTableProps {
  stocks: Stock[];
  currentPrice: Record<string, number>;
  editingId: number | null;
  editStock: {
    shares: string;
    cost: string;
  };
  setEditStock: (stock: { shares: string; cost: string }) => void;
  startEditing: (stock: Stock) => void;
  saveEdit: (id: number) => void;
  cancelEdit: () => void;
  removeStock: (id: number) => void;
  getClassNamesFor: (key: string) => string;
  requestSort: (key: string) => void;
}

export default function ResponsiveStockTable({
  stocks,
  currentPrice,
  editingId,
  editStock,
  setEditStock,
  startEditing,
  saveEdit,
  cancelEdit,
  removeStock,
  getClassNamesFor,
  requestSort
}: ResponsiveStockTableProps) {
  // 在桌面版顯示完整表格
  const renderDesktopTable = () => (
    <div className="hidden md:block overflow-x-auto">
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
          {stocks.map((stock) => (
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
  );

  // 在手機版顯示卡片式布局
  const renderMobileCards = () => (
    <div className="md:hidden space-y-4">
      {stocks.map((stock) => (
        <div key={stock.id} className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="card-title text-lg">
                <span className="stock-symbol">{stock.symbol}</span>
                {stock.name && <span className="text-sm text-base-content/70 ml-2">({stock.name})</span>}
              </h3>
              <div className="flex space-x-1">
                {editingId === stock.id ? (
                  <>
                    <button
                      className="btn btn-xs btn-success"
                      onClick={() => stock.id && saveEdit(stock.id)}
                      title="儲存"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </button>
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={cancelEdit}
                      title="取消"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={() => startEditing(stock)}
                      title="編輯"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button
                      className="btn btn-xs btn-error"
                      onClick={() => stock.id && removeStock(stock.id)}
                      title="刪除"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-base-content/70">股數:</span>
                {editingId === stock.id ? (
                  <input
                    type="number"
                    className="edit-input ml-1 w-20"
                    value={editStock.shares}
                    onChange={e => setEditStock({...editStock, shares: e.target.value})}
                    min={1}
                  />
                ) : (
                  <span className="font-medium ml-1">{stock.shares}</span>
                )}
              </div>
              <div>
                <span className="text-base-content/70">成本:</span>
                {editingId === stock.id ? (
                  <input
                    type="number"
                    className="edit-input ml-1 w-20"
                    value={editStock.cost}
                    onChange={e => setEditStock({...editStock, cost: e.target.value})}
                    min={0}
                    step={0.01}
                  />
                ) : (
                  <span className="font-medium ml-1">${stock.cost}</span>
                )}
              </div>
              <div>
                <span className="text-base-content/70">成本總值:</span>
                <span className="font-medium ml-1">${stock.totalValue ? stock.totalValue.toFixed(2) : (stock.shares * stock.cost).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-base-content/70">目前股價:</span>
                <span className="font-medium ml-1">{currentPrice[stock.symbol] ? `$${currentPrice[stock.symbol].toFixed(2)}` : '-'}</span>
              </div>
              <div>
                <span className="text-base-content/70">目前總市值:</span>
                <span className="font-medium ml-1">{currentPrice[stock.symbol] ? `$${(stock.shares * currentPrice[stock.symbol]).toFixed(2)}` : '-'}</span>
              </div>
              <div>
                <span className="text-base-content/70">除息日:</span>
                <span className="font-medium ml-1">{stock.exDividendDate || '-'}</span>
              </div>
              <div>
                <span className="text-base-content/70">每股配息:</span>
                <span className="font-medium ml-1">{stock.cashDividendPerShare || '-'}</span>
              </div>
              <div>
                <span className="text-base-content/70">每股配股:</span>
                <span className="font-medium ml-1">{stock.stockDividendPerShare || '-'}</span>
              </div>
              <div>
                <span className="text-base-content/70">現金殖利率:</span>
                <span className="font-medium ml-1 text-success">{stock.cashYield ? `${stock.cashYield}%` : '-'}</span>
              </div>
              <div>
                <span className="text-base-content/70">總殖利率:</span>
                <span className="font-medium ml-1 text-success">{stock.totalYield ? `${stock.totalYield}%` : '-'}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {renderDesktopTable()}
      {renderMobileCards()}
    </>
  );
}
