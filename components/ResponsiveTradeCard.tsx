import React from 'react';

interface Trade {
  id: number;
  date: string;
  symbol: string;
  type: 'buy' | 'sell' | 'dividend' | 'stockDividend' | 'capitalIncrease' | 'capitalDecrease';
  shares: number;
  price: number;
  total: number;
  fee: number;
  tax: number;
  netTotal: number;
  notes: string;
}

interface ResponsiveTradeCardProps {
  trade: Trade;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function ResponsiveTradeCard({ trade, onEdit, onDelete }: ResponsiveTradeCardProps) {
  // 根據交易類型獲取顯示名稱
  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'buy': return '買入';
      case 'sell': return '賣出';
      case 'dividend': return '現金股利';
      case 'stockDividend': return '股票股利';
      case 'capitalIncrease': return '資本增加';
      case 'capitalDecrease': return '資本減少';
      default: return type;
    }
  };

  // 根據交易類型獲取顏色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'buy': return 'bg-blue-100 text-blue-800';
      case 'sell': return 'bg-green-100 text-green-800';
      case 'dividend': return 'bg-yellow-100 text-yellow-800';
      case 'stockDividend': return 'bg-purple-100 text-purple-800';
      case 'capitalIncrease': return 'bg-orange-100 text-orange-800';
      case 'capitalDecrease': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm mb-4">
      <div className="card-body p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center mb-1">
              <span className="text-sm text-base-content/70 mr-2">{trade.date}</span>
              <span className={`badge ${getTypeColor(trade.type)}`}>
                {getTypeDisplayName(trade.type)}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{trade.symbol}</h3>
          </div>
          <div className="flex space-x-1">
            <button
              className="btn btn-xs btn-outline"
              onClick={() => onEdit(trade.id)}
              title="編輯"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button
              className="btn btn-xs btn-error"
              onClick={() => onDelete(trade.id)}
              title="刪除"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          {trade.type !== 'dividend' && (
            <div>
              <span className="text-base-content/70">股數:</span> 
              <span className="font-medium ml-1">{trade.shares}</span>
            </div>
          )}
          <div>
            <span className="text-base-content/70">價格:</span> 
            <span className="font-medium ml-1">${trade.price.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-base-content/70">總額:</span> 
            <span className="font-medium ml-1">${trade.total.toFixed(2)}</span>
          </div>
          {(trade.type === 'buy' || trade.type === 'sell' || trade.type === 'capitalIncrease' || trade.type === 'capitalDecrease') && (
            <div>
              <span className="text-base-content/70">手續費:</span> 
              <span className="font-medium ml-1">${trade.fee.toFixed(2)}</span>
            </div>
          )}
          {(trade.type === 'sell' || trade.type === 'capitalDecrease') && (
            <div>
              <span className="text-base-content/70">證交稅:</span> 
              <span className="font-medium ml-1">${trade.tax.toFixed(2)}</span>
            </div>
          )}
          <div className="col-span-2">
            <span className="text-base-content/70">淨額:</span> 
            <span className={`font-semibold ml-1 ${trade.netTotal >= 0 ? 'text-success' : 'text-error'}`}>
              ${trade.netTotal.toFixed(2)}
            </span>
          </div>
        </div>
        
        {trade.notes && (
          <div className="mt-2 text-sm border-t border-base-200 pt-2">
            <span className="text-base-content/70">備註:</span> {trade.notes}
          </div>
        )}
      </div>
    </div>
  );
}
