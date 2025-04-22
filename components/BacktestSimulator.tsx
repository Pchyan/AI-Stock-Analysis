import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function BacktestSimulator({ stockSymbol }) {
  const [strategy, setStrategy] = useState('ma_cross');
  const [period, setPeriod] = useState('1y');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // 當股票代碼變更時，清除結果
  useEffect(() => {
    setResult(null);
    setError('');

    // 清除圖表
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }
  }, [stockSymbol]);

  // 當結果變更時，更新圖表
  useEffect(() => {
    if (result && chartRef.current && !chartInstance.current) {
      const ctx = chartRef.current.getContext('2d');

      // 創建標籤（日期）
      const labels = Array.from({ length: result.equity.length }, (_, i) => i + 1);

      // 創建圖表
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: '權益曲線',
              data: result.equity,
              borderColor: 'var(--color-primary)',
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 0,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  return `權益: $${context.raw.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            x: {
              display: false
            },
            y: {
              display: true,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      });
    }

    // 組件卸載時清除圖表
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [result]);

  const handleSimulate = async () => {
    if (!stockSymbol) {
      setError('請先選擇股票');
      return;
    }

    setIsSimulating(true);
    setError('');

    try {
      // 呼叫API進行回測
      const response = await fetch(`/api/backtest?symbol=${encodeURIComponent(stockSymbol)}&strategy=${strategy}&period=${period}`);

      if (!response.ok) {
        throw new Error(`API 請求失敗: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);

      // 清除舊圖表
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    } catch (err) {
      console.error('回測失敗:', err);
      setError('回測失敗，請稍後再試');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          回測模擬器
        </h3>
      </div>

      <div className="card-body">
        <div className="simulator-controls">
          <div className="control-group">
            <label className="control-label">策略</label>
            <select
              className="control-select"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              disabled={isSimulating}
            >
              <option value="ma_cross">均線交叉</option>
              <option value="rsi">相對強弱指標</option>
              <option value="breakout">突破策略</option>
              <option value="value">價值投資</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">時間週期</label>
            <select
              className="control-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              disabled={isSimulating}
            >
              <option value="3m">3 個月</option>
              <option value="6m">6 個月</option>
              <option value="1y">1 年</option>
              <option value="3y">3 年</option>
              <option value="5y">5 年</option>
            </select>
          </div>

          <button
            className={`simulate-btn ${isSimulating ? 'loading' : ''}`}
            onClick={handleSimulate}
            disabled={isSimulating}
          >
            {isSimulating ? (
              <>
                <div className="spinner"></div>
                模擬中...
              </>
            ) : '開始模擬'}
          </button>
        </div>

        <div className="result-container">
          {error && (
            <div className="error-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>{error}</p>
            </div>
          )}

          {result ? (
            <div className="result-card">
              <div className="result-header">模擬結果</div>
              <div className="result-content">
                <div className="result-metrics">
                  <div className="metric-item">
                    <div className="metric-label">年化報酬</div>
                    <div className={`metric-value ${parseFloat(result.annualReturn) >= 0 ? 'value-up' : 'value-down'}`}>
                      {result.annualReturn}
                    </div>
                  </div>

                  <div className="metric-item">
                    <div className="metric-label">總報酬</div>
                    <div className={`metric-value ${parseFloat(result.totalReturn) >= 0 ? 'value-up' : 'value-down'}`}>
                      {result.totalReturn}
                    </div>
                  </div>

                  <div className="metric-item">
                    <div className="metric-label">最大回撤</div>
                    <div className="metric-value value-down">
                      {result.maxDrawdown}
                    </div>
                  </div>

                  <div className="metric-item">
                    <div className="metric-label">夏普比率</div>
                    <div className="metric-value">
                      {result.sharpeRatio}
                    </div>
                  </div>

                  <div className="metric-item">
                    <div className="metric-label">勝率</div>
                    <div className="metric-value">
                      {result.winRate}
                    </div>
                  </div>

                  <div className="metric-item">
                    <div className="metric-label">交易次數</div>
                    <div className="metric-value">
                      {result.trades}
                    </div>
                  </div>
                </div>

                <div className="result-chart">
                  <canvas ref={chartRef}></canvas>
                </div>

                {result.trades_data && result.trades_data.length > 0 && (
                  <div className="trades-table">
                    <h4 className="trades-title">交易記錄</h4>
                    <div className="trades-container">
                      <table className="trades-list">
                        <thead>
                          <tr>
                            <th>日期</th>
                            <th>類型</th>
                            <th>價格</th>
                            <th>數量</th>
                            <th>利潤</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.trades_data.slice(0, 5).map((trade, index) => (
                            <tr key={index}>
                              <td>{trade.date}</td>
                              <td className={trade.type === 'buy' ? 'trade-buy' : 'trade-sell'}>
                                {trade.type === 'buy' ? '買入' : '賣出'}
                              </td>
                              <td>${trade.price.toFixed(2)}</td>
                              <td>{trade.shares}</td>
                              <td className={trade.profit > 0 ? 'value-up' : trade.profit < 0 ? 'value-down' : ''}>
                                {trade.profit ? `$${trade.profit.toFixed(2)}` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-result">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
              <p>選擇策略並點擊「開始模擬」按鈕</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .simulator-controls {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }

        .control-group {
          display: flex;
          flex-direction: column;
        }

        .control-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-xxs);
        }

        .control-select {
          padding: var(--space-xs) var(--space-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background-color: var(--color-surface);
          min-width: 120px;
        }

        .control-select:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .simulate-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-xs) var(--space-md);
          background-color: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: background-color var(--transition-fast);
          margin-left: auto;
          align-self: flex-end;
        }

        .simulate-btn:hover {
          background-color: var(--color-primary-dark);
        }

        .simulate-btn:disabled {
          background-color: var(--color-text-disabled);
          cursor: not-allowed;
        }

        .simulate-btn.loading {
          background-color: var(--color-primary-light);
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
          margin-right: var(--space-xs);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .result-container {
          min-height: 200px;
        }

        .error-message {
          display: flex;
          align-items: center;
          padding: var(--space-md);
          background-color: var(--color-error-light);
          color: var(--color-error);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-md);
        }

        .error-message svg {
          margin-right: var(--space-sm);
          flex-shrink: 0;
        }

        .error-message p {
          margin: 0;
        }

        .result-card {
          background-color: var(--color-background);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .result-header {
          background-color: var(--color-primary);
          color: white;
          padding: var(--space-sm) var(--space-md);
          font-weight: var(--font-weight-medium);
        }

        .result-content {
          padding: var(--space-md);
        }

        .result-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }

        .metric-item {
          background-color: var(--color-surface);
          padding: var(--space-sm);
          border-radius: var(--radius-md);
        }

        .metric-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-xxs);
        }

        .metric-value {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
        }

        .result-chart {
          height: 200px;
          margin-bottom: var(--space-lg);
        }

        .trades-title {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--space-sm);
          color: var(--color-text-secondary);
        }

        .trades-container {
          overflow-x: auto;
        }

        .trades-list {
          width: 100%;
          border-collapse: collapse;
        }

        .trades-list th {
          text-align: left;
          padding: var(--space-xs) var(--space-sm);
          background-color: var(--color-background);
          color: var(--color-text-secondary);
          font-weight: var(--font-weight-medium);
          font-size: var(--font-size-sm);
          border-bottom: 1px solid var(--color-border);
        }

        .trades-list td {
          padding: var(--space-xs) var(--space-sm);
          border-bottom: 1px solid var(--color-border-light);
          font-size: var(--font-size-sm);
        }

        .trade-buy {
          color: var(--color-success);
        }

        .trade-sell {
          color: var(--color-error);
        }

        .empty-result {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--color-text-secondary);
          text-align: center;
        }

        .empty-result svg {
          margin-bottom: var(--space-md);
          color: var(--color-text-disabled);
        }

        @media (max-width: 576px) {
          .simulator-controls {
            flex-direction: column;
          }

          .simulate-btn {
            width: 100%;
            margin-top: var(--space-sm);
          }
        }
      `}</style>
    </div>
  );
}
