import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
// 若需 K 線圖，需安裝 chartjs-chart-financial
// import 'chartjs-chart-financial';

export default function ChartPanel({ data, onTimeframeChange }) {
  // 判斷股票地區，用於設定漲跌顏色
  const getStockRegion = (symbol: string): 'asia' | 'us' => {
    // 台灣股票或以數字開頭的代碼視為亞洲地區
    if (symbol && (symbol.endsWith('.TW') || /^\d+/.test(symbol))) {
      return 'asia';
    }
    // 其他視為美國地區
    return 'us';
  };
  const chartRef = useRef(null);
  const [activeTab, setActiveTab] = useState('price');
  const [timeframe, setTimeframe] = useState(data?.timeframe || '1m');

  // 當時間週期改變時通知父組件
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  };

  // 當收到新的時間週期時更新狀態
  useEffect(() => {
    if (data?.timeframe && data.timeframe !== timeframe) {
      setTimeframe(data.timeframe);
    }
  }, [data?.timeframe]);

  useEffect(() => {
    if (!data || !chartRef.current || !data.candles || data.candles.length === 0) return;
    const ctx = chartRef.current.getContext('2d');

    // 取得技術指標數據
    const technicalIndicators = data.technicalIndicators || {};

    // 準備移動平均線數據
    // 如果 API 沒有提供移動平均線，則在前端計算
    const calculateMA = (prices, period) => {
      const result = [];
      for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
          result.push(null);
        } else {
          const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
          result.push(sum / period);
        }
      }
      return result;
    };

    const closePrices = data.candles.map(x => x.c);

    // 使用 API 提供的移動平均線或自行計算
    const ma5Values = technicalIndicators.ma5 ? Array(data.candles.length).fill(parseFloat(technicalIndicators.ma5)) : calculateMA(closePrices, 5);
    const ma10Values = technicalIndicators.ma10 ? Array(data.candles.length).fill(parseFloat(technicalIndicators.ma10)) : calculateMA(closePrices, 10);
    const ma20Values = technicalIndicators.ma20 ? Array(data.candles.length).fill(parseFloat(technicalIndicators.ma20)) : calculateMA(closePrices, 20);
    const ma60Values = technicalIndicators.ma60 ? Array(data.candles.length).fill(parseFloat(technicalIndicators.ma60)) : calculateMA(closePrices, 60);

    // 計算 RSI
    const calculateRSI = (prices, period = 14) => {
      const result = [];
      for (let i = 0; i < prices.length; i++) {
        if (i < period) {
          result.push(null);
        } else {
          let gains = 0;
          let losses = 0;

          for (let j = i - period + 1; j <= i; j++) {
            const diff = prices[j] - prices[j - 1];
            if (diff >= 0) {
              gains += diff;
            } else {
              losses -= diff;
            }
          }

          if (losses === 0) {
            result.push(100);
          } else {
            const rs = gains / losses;
            result.push(100 - (100 / (1 + rs)));
          }
        }
      }
      return result;
    };

    const rsiValues = calculateRSI(closePrices);

    // 根據選擇的圖表類型設置數據
    let chartData = {
      labels: [],
      datasets: []
    };
    let chartOptions = {};

    // 根據股票判斷地區
    const stockSymbol = data.symbol || '';
    const region = getStockRegion(stockSymbol);

    // 根據地區設定顏色
    const upColor = region === 'asia' ? 'var(--color-error)' : 'var(--color-success)';
    const downColor = region === 'asia' ? 'var(--color-success)' : 'var(--color-error)';

    if (activeTab === 'price') {
      chartData = {
        labels: data.candles.map(x => x.t),
        datasets: [
          {
            label: '收盤價',
            data: data.candles.map(x => x.c),
            borderColor: 'var(--color-primary)',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            pointRadius: 0,
            borderWidth: 2,
            fill: false
          },
          {
            label: 'MA5',
            data: ma5Values,
            borderColor: 'var(--color-secondary)',
            pointRadius: 0,
            borderWidth: 1.5,
            borderDash: []
          },
          {
            label: 'MA10',
            data: ma10Values,
            borderColor: '#9c27b0',
            pointRadius: 0,
            borderWidth: 1.5,
            borderDash: [2, 2]
          },
          {
            label: 'MA20',
            data: ma20Values,
            borderColor: 'var(--color-accent)',
            pointRadius: 0,
            borderWidth: 1.5,
            borderDash: []
          },
          {
            label: 'MA60',
            data: ma60Values,
            borderColor: 'var(--color-info)',
            pointRadius: 0,
            borderWidth: 1.5,
            borderDash: [4, 4]
          },
        ]
      };

      chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#333',
            bodyColor: '#666',
            borderColor: '#ddd',
            borderWidth: 1,
            padding: 10,
            boxPadding: 5,
            cornerRadius: 8,
            titleFont: {
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8
            }
          },
          y: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false
            },
            ticks: {
              padding: 8
            }
          }
        }
      };
    } else if (activeTab === 'indicator') {
      // 技術指標圖表設置
      chartData = {
        labels: data.candles.map(x => x.t),
        datasets: [
          {
            label: 'RSI',
            data: rsiValues,
            borderColor: 'var(--color-primary)',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            pointRadius: 0,
            borderWidth: 2,
            yAxisID: 'y'
          },
          // 交易量
          {
            label: '交易量',
            data: data.candles.map(x => x.v),
            type: 'bar',
            backgroundColor: 'rgba(76, 175, 80, 0.3)',
            borderColor: 'rgba(76, 175, 80, 0.7)',
            borderWidth: 1,
            yAxisID: 'volume'
          }
        ]
      };

      chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#333',
            bodyColor: '#666',
            borderColor: '#ddd',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8
            }
          },
          y: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false
            },
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          volume: {
            position: 'right',
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              callback: function(value) {
                if (value >= 1000000) {
                  return (value / 1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return (value / 1000).toFixed(0) + 'K';
                }
                return value;
              }
            }
          }
        }
      };
    }

    const chart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: chartOptions
    });

    return () => chart.destroy();
  }, [data, activeTab, timeframe]);

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3 className="card-title mb-0">技術分析</h3>
          <div className="d-flex">
            {/* 時間週期選擇器 */}
            <div className="btn-group mr-2">
              {['1d', '1w', '1m', '1y'].map(period => (
                <button
                  key={period}
                  className={`btn btn-sm ${timeframe === period ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleTimeframeChange(period)}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* 圖表類型選擇器 */}
            <div className="btn-group">
              <button
                className={`btn btn-sm ${activeTab === 'price' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('price')}
              >
                價格
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'indicator' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('indicator')}
              >
                指標
              </button>
            </div>
          </div>
        </div>

        {data && data.technicalIndicators && (
          <div className="technical-indicators-summary">
            <div className="indicator-item">
              <span className="indicator-label">RSI:</span>
              <span className={`indicator-value ${parseFloat(data.technicalIndicators.rsi) > 70 ? 'value-up' : parseFloat(data.technicalIndicators.rsi) < 30 ? 'value-down' : ''}`}>
                {data.technicalIndicators.rsi}
              </span>
            </div>

            <div className="indicator-item">
              <span className="indicator-label">MA5:</span>
              <span className="indicator-value">{data.technicalIndicators.ma5 || '-'}</span>
            </div>

            <div className="indicator-item">
              <span className="indicator-label">MA20:</span>
              <span className="indicator-value">{data.technicalIndicators.ma20 || '-'}</span>
            </div>

            {data.technicalIndicators.macdSignal && (
              <div className="indicator-item">
                <span className="indicator-label">交叉信號:</span>
                <span className={`indicator-value ${data.technicalIndicators.macdSignal === '黃金交叉' ? 'value-up' : data.technicalIndicators.macdSignal === '死亡交叉' ? 'value-down' : ''}`}>
                  {data.technicalIndicators.macdSignal || '-'}
                </span>
              </div>
            )}

            {data.technicalIndicators.breakoutSignal && (
              <div className="indicator-item">
                <span className="indicator-label">突破信號:</span>
                <span className={`indicator-value ${data.technicalIndicators.breakoutSignal.includes('突破') ? 'value-up' : data.technicalIndicators.breakoutSignal.includes('跌破') ? 'value-down' : ''}`}>
                  {data.technicalIndicators.breakoutSignal}
                </span>
              </div>
            )}

            <div className="indicator-item">
              <span className="indicator-label">交易量變化:</span>
              <span className={`indicator-value ${parseFloat(data.technicalIndicators.volumeChange) > 1.5 ? 'value-up' : parseFloat(data.technicalIndicators.volumeChange) < 0.5 ? 'value-down' : ''}`}>
                {parseFloat(data.technicalIndicators.volumeChange) > 1 ? '+' : ''}{((parseFloat(data.technicalIndicators.volumeChange) - 1) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="card-body chart-container">
        {!data ? (
          <div className="chart-placeholder d-flex justify-content-center align-items-center">
            <p className="text-secondary">載入中...</p>
          </div>
        ) : (
          <canvas ref={chartRef} />
        )}
      </div>

      <style jsx>{`
        .chart-container {
          height: 350px;
          position: relative;
        }

        .chart-placeholder {
          height: 100%;
          width: 100%;
          background-color: var(--color-background);
          border-radius: var(--radius-md);
        }

        .btn-group {
          display: flex;
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .btn-group .btn {
          border-radius: 0;
          margin: 0;
          padding: var(--space-xxs) var(--space-xs);
          font-size: var(--font-size-sm);
        }

        .btn-group .btn:first-child {
          border-top-left-radius: var(--radius-md);
          border-bottom-left-radius: var(--radius-md);
        }

        .btn-group .btn:last-child {
          border-top-right-radius: var(--radius-md);
          border-bottom-right-radius: var(--radius-md);
        }

        .technical-indicators-summary {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
          background-color: var(--color-background);
          padding: var(--space-sm);
          border-radius: var(--radius-md);
          margin-top: var(--space-xs);
        }

        .indicator-item {
          display: flex;
          align-items: center;
          font-size: var(--font-size-sm);
        }

        .indicator-label {
          color: var(--color-text-secondary);
          margin-right: var(--space-xxs);
        }

        .indicator-value {
          font-weight: var(--font-weight-medium);
        }
      `}</style>
    </div>
  );
}
