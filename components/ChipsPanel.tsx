import React, { useState } from 'react';

export default function ChipsPanel({ data }) {
  const [showDetails, setShowDetails] = useState(false);

  const formatNumber = (num) => {
    if (!num && num !== 0) return '-';

    if (typeof num === 'string') {
      // 如果是帶格式的字符串，直接返回
      if (num.includes(',')) return num;

      // 嘗試轉換為數字
      const parsed = parseFloat(num.replace(/[^0-9.-]+/g, ''));
      if (isNaN(parsed)) return num;
      num = parsed;
    }

    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // 判斷股票地區，用於設定漲跌顏色
  const getStockRegion = (symbol: string): 'asia' | 'us' => {
    // 台灣股票或以數字開頭的代碼視為亞洲地區
    if (symbol && (symbol.endsWith('.TW') || /^\d+/.test(symbol))) {
      return 'asia';
    }
    // 其他視為美國地區
    return 'us';
  };

  const getValueClass = (value) => {
    if (!value) return '';

    const region = getStockRegion(data?.symbol || '');
    const isAsia = region === 'asia';

    if (typeof value === 'string') {
      // 漲跌判斷
      if (value.startsWith('+')) {
        return isAsia ? 'value-asia-up' : 'value-us-up';
      }
      if (value.startsWith('-')) {
        return isAsia ? 'value-asia-down' : 'value-us-down';
      }

      // 主力動向判斷
      if (value.includes('買') || value.includes('大買') || value.includes('同買')) {
        return isAsia ? 'value-asia-up' : 'value-us-up';
      }
      if (value.includes('賣') || value.includes('大賣') || value.includes('同賣')) {
        return isAsia ? 'value-asia-down' : 'value-us-down';
      }
    }

    return '';
  };

  // 判斷是否為台灣股票
  const isTaiwanStock = () => {
    if (!data) return false;
    return data.institutionalDetails ||
           (data.marginChange !== undefined && data.shortChange !== undefined);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="card-title mb-0">籍碼面分析</h3>
        {data && (
          <button
            className="btn btn-sm btn-outline"
            onClick={toggleDetails}
            title={showDetails ? '隱藏詳情' : '顯示詳情'}
          >
            {showDetails ? '隱藏詳情' : '顯示詳情'}
          </button>
        )}
      </div>

      <div className="card-body">
        {!data ? (
          <div className="d-flex justify-content-center align-items-center p-4">
            <p className="text-secondary">載入中...</p>
          </div>
        ) : (
          <>
            <div className="chips-container">
              {/* 三大法人買賣超 */}
              <div className="chip-item">
                <div className="chip-icon institutional-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                </div>
                <div className="chip-content">
                  <div className="chip-label">
                    {isTaiwanStock() ? '三大法人買賣超' : '機構買賣超'}
                  </div>
                  <div className={`chip-value ${getValueClass(data.institutionalBuySell)}`}>
                    {data.institutionalBuySell || '-'}
                  </div>
                </div>
              </div>

              {/* 融資餘額或機構持股比例 */}
              <div className="chip-item">
                <div className="chip-icon margin-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div className="chip-content">
                  <div className="chip-label">
                    {isTaiwanStock() ? '融資餘額' : '機構持股比例'}
                  </div>
                  <div className="chip-value">
                    {isTaiwanStock()
                      ? formatNumber(data.marginBalance)
                      : data.institutionalOwnership || '-'}
                  </div>
                  {isTaiwanStock() && data.marginChange && (
                    <div className={`chip-change ${getValueClass(data.marginChange)}`}>
                      {data.marginChange}
                    </div>
                  )}
                </div>
              </div>

              {/* 融券餘額或空頭部位比例 */}
              <div className="chip-item">
                <div className="chip-icon short-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
                  </svg>
                </div>
                <div className="chip-content">
                  <div className="chip-label">
                    {isTaiwanStock() ? '融券餘額' : '空頭部位比例'}
                  </div>
                  <div className="chip-value">
                    {isTaiwanStock()
                      ? formatNumber(data.shortBalance)
                      : data.shortInterestRatio || '-'}
                  </div>
                  {isTaiwanStock() && data.shortChange && (
                    <div className={`chip-change ${getValueClass(data.shortChange)}`}>
                      {data.shortChange}
                    </div>
                  )}
                  {!isTaiwanStock() && data.shortInterestChange && (
                    <div className={`chip-change ${getValueClass(data.shortInterestChange)}`}>
                      {data.shortInterestChange}
                    </div>
                  )}
                </div>
              </div>

              {/* 大戶持股比例 */}
              <div className="chip-item">
                <div className="chip-icon holder-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className="chip-content">
                  <div className="chip-label">大戶持股比例</div>
                  <div className="chip-value">
                    {data.majorHolderRatio || '-'}
                  </div>
                </div>
              </div>

              {/* 主力動向 */}
              <div className="chip-item main-force">
                <div className="chip-icon alert-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div className="chip-content">
                  <div className="chip-label">主力動向</div>
                  <div className={`chip-value ${getValueClass(data.mainForceAlert)}`}>
                    {data.mainForceAlert || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* 詳細資訊 */}
            {showDetails && isTaiwanStock() && data.institutionalDetails && (
              <div className="institutional-details mt-3">
                <h4 className="details-title">三大法人買賣超明細</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <div className="detail-label">外資</div>
                    <div className={`detail-value ${getValueClass(data.institutionalDetails.foreignInvestors)}`}>
                      {data.institutionalDetails.foreignInvestors || '-'}
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">投信</div>
                    <div className={`detail-value ${getValueClass(data.institutionalDetails.investmentTrust)}`}>
                      {data.institutionalDetails.investmentTrust || '-'}
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">自營商</div>
                    <div className={`detail-value ${getValueClass(data.institutionalDetails.dealers)}`}>
                      {data.institutionalDetails.dealers || '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .chips-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-md);
        }

        .chip-item {
          display: flex;
          align-items: center;
          padding: var(--space-sm);
          background-color: var(--color-background);
          border-radius: var(--radius-md);
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }

        .chip-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        .chip-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-circle);
          margin-right: var(--space-sm);
          color: white;
        }

        .institutional-icon {
          background-color: var(--color-primary);
        }

        .margin-icon {
          background-color: var(--color-secondary);
        }

        .short-icon {
          background-color: var(--color-error);
        }

        .holder-icon {
          background-color: var(--color-accent);
        }

        .alert-icon {
          background-color: var(--color-info);
        }

        .chip-content {
          flex: 1;
        }

        .chip-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-xxs);
        }

        .chip-value {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
        }

        .chip-change {
          font-size: var(--font-size-xs);
          margin-top: var(--space-xxs);
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

        .institutional-details {
          background-color: var(--color-background);
          border-radius: var(--radius-md);
          padding: var(--space-md);
        }

        .details-title {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--space-sm);
          color: var(--color-text-secondary);
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-md);
        }

        .detail-item {
          text-align: center;
        }

        .detail-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-xxs);
        }

        .detail-value {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
        }

        @media (max-width: 768px) {
          .chips-container {
            grid-template-columns: repeat(2, 1fr);
          }

          .details-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 576px) {
          .chips-container {
            grid-template-columns: 1fr;
          }

          .details-grid {
            grid-template-columns: 1fr;
            gap: var(--space-sm);
          }

          .detail-item {
            text-align: left;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}
