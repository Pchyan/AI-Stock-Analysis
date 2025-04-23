import React from 'react';

interface TransactionProps {
  date: string;
  symbol: string;
  name?: string;
  type: string;
  price: number;
  shares: number;
  amount: number;
  fees?: number;
  tax?: number;
  notes?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function TransactionCard({
  date,
  symbol,
  name,
  type,
  price,
  shares,
  amount,
  fees = 0,
  tax = 0,
  notes,
  onEdit,
  onDelete
}: TransactionProps) {
  // 根據交易類型決定顏色
  const getTypeColor = () => {
    switch (type) {
      case '買入':
        return 'text-success';
      case '賣出':
        return 'text-error';
      case '現金股利':
        return 'text-primary';
      case '股票股利':
        return 'text-secondary';
      case '除權':
        return 'text-secondary';
      case '除息':
        return 'text-primary';
      case '資本增加':
        return 'text-warning';
      case '資本減少':
        return 'text-info';
      default:
        return 'text-base-content';
    }
  };

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="card-body p-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <div className="flex items-center mb-2">
              <span className="text-sm text-base-content/70 mr-2">{date}</span>
              <span className={`badge ${getTypeColor()}`}>{type}</span>
            </div>
            <h3 className="text-lg font-semibold">
              {symbol} {name && <span className="text-base-content/70">({name})</span>}
            </h3>
          </div>
          <div className="mt-2 md:mt-0 text-right">
            <div className="text-lg font-bold">
              ${amount.toFixed(2)}
            </div>
            <div className="text-sm text-base-content/70">
              {shares} 股 @ ${price.toFixed(2)}
            </div>
          </div>
        </div>
        
        {(fees > 0 || tax > 0 || notes) && (
          <div className="mt-3 pt-3 border-t border-base-200">
            {(fees > 0 || tax > 0) && (
              <div className="flex justify-between text-sm text-base-content/70">
                <span>手續費: ${fees.toFixed(2)}</span>
                <span>交易稅: ${tax.toFixed(2)}</span>
              </div>
            )}
            {notes && (
              <div className="mt-2 text-sm">
                <span className="text-base-content/70">備註:</span> {notes}
              </div>
            )}
          </div>
        )}
        
        {(onEdit || onDelete) && (
          <div className="card-actions justify-end mt-3">
            {onEdit && (
              <button 
                onClick={onEdit} 
                className="btn btn-sm btn-ghost"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                編輯
              </button>
            )}
            {onDelete && (
              <button 
                onClick={onDelete} 
                className="btn btn-sm btn-ghost text-error"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                刪除
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
