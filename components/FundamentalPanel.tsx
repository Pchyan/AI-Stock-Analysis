import React from 'react';

export default function FundamentalPanel({ data }) {
  const renderMetric = (label, value, suffix = '', isGood = null) => {
    let valueClass = '';
    if (isGood !== null) {
      valueClass = isGood ? 'value-up' : 'value-down';
    }

    return (
      <div className="metric-item">
        <div className="metric-label">{label}</div>
        <div className={`metric-value ${valueClass}`}>
          {value}{suffix}
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">基本面分析</h3>
      </div>

      <div className="card-body">
        {!data ? (
          <div className="d-flex justify-content-center align-items-center p-4">
            <p className="text-secondary">載入中...</p>
          </div>
        ) : (
          <div className="metrics-grid">
            {renderMetric('本益比 (PE)', data.pe, '', data.pe < 20)}
            {renderMetric('殖利率', data.yield, '%', data.yield > 3)}
            {renderMetric('ROE', data.roe, '%', data.roe > 10)}
            {renderMetric('財務健康度', data.healthScore)}
            {renderMetric('同業比較', data.peerCompare)}
          </div>
        )}
      </div>

      <style jsx>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-md);
        }

        .metric-item {
          padding: var(--space-sm);
          background-color: var(--color-background);
          border-radius: var(--radius-md);
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }

        .metric-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        .metric-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-xxs);
        }

        .metric-value {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
        }

        @media (max-width: 576px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
