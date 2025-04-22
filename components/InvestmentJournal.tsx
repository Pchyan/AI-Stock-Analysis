import React, { useState, useEffect } from 'react';

type JournalEntry = {
  id: string;
  date: string;
  content: string;
  stockSymbol?: string;
  tags?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  createdAt: string;
};

export default function InvestmentJournal({ stockSymbol }) {
  const [newLog, setNewLog] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 獲取日誌數據
  const fetchJournalEntries = async () => {
    setIsLoading(true);
    setError('');

    try {
      // 構建 API URL，如果有股票代碼則添加過濾
      let url = '/api/journal';
      if (stockSymbol) {
        url += `?stockSymbol=${encodeURIComponent(stockSymbol)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API 請求失敗: ${response.status}`);
      }

      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error('獲取日誌失敗:', err);
      setError('獲取日誌失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 組件加載時獲取日誌
  useEffect(() => {
    fetchJournalEntries();
  }, [stockSymbol]);

  // 添加新日誌
  const addLog = async () => {
    if (!newLog.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newLog,
          stockSymbol
        }),
      });

      if (!response.ok) {
        throw new Error(`API 請求失敗: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.entry) {
        // 更新本地日誌列表
        setEntries([data.entry, ...entries]);
        setNewLog('');
      } else {
        throw new Error(data.error || '添加日誌失敗');
      }
    } catch (err) {
      console.error('添加日誌失敗:', err);
      setError('添加日誌失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 刪除日誌
  const deleteEntry = async (id: string) => {
    if (!confirm('確定要刪除這條日誌嗎？')) {
      return;
    }

    setError('');

    try {
      const response = await fetch(`/api/journal?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API 請求失敗: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // 更新本地日誌列表
        setEntries(entries.filter(entry => entry.id !== id));
      } else {
        throw new Error(data.error || '刪除日誌失敗');
      }
    } catch (err) {
      console.error('刪除日誌失敗:', err);
      setError('刪除日誌失敗，請稍後再試');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addLog();
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          投資日誌
        </h3>
      </div>

      <div className="card-body">
        <div className="journal-input-container">
          <input
            type="text"
            className="journal-input"
            placeholder="記錄交易或市場觀察..."
            value={newLog}
            onChange={(e) => setNewLog(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="journal-add-btn"
            onClick={addLog}
            disabled={!newLog.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        {error && (
          <div className="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{error}</p>
          </div>
        )}

        <div className="journal-entries">
          {isLoading ? (
            <div className="loading-journal">
              <div className="spinner"></div>
              <p>載入日誌中...</p>
            </div>
          ) : entries.length > 0 ? (
            entries.map((entry) => {
              // 根據情感設定樣式類名
              const sentimentClass = entry.sentiment === 'positive' ? 'entry-positive' :
                                     entry.sentiment === 'negative' ? 'entry-negative' : '';

              return (
                <div key={entry.id} className={`journal-entry ${sentimentClass}`}>
                  <div className="entry-header">
                    <div className="entry-date">{entry.date}</div>
                    <div className="entry-actions">
                      <button
                        className="entry-delete-btn"
                        onClick={() => deleteEntry(entry.id)}
                        title="刪除日誌"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="entry-content">{entry.content}</div>

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="entry-tags">
                      {entry.tags.map(tag => (
                        <span key={tag} className="entry-tag">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="empty-journal">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              <p>尚無日誌記錄，開始記錄您的投資旅程吧！</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .journal-input-container {
          display: flex;
          margin-bottom: var(--space-md);
        }

        .journal-input {
          flex: 1;
          padding: var(--space-sm) var(--space-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--font-size-md);
          transition: border-color var(--transition-fast);
        }

        .journal-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .journal-add-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          margin-left: var(--space-xs);
          background-color: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--radius-circle);
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .journal-add-btn:hover {
          background-color: var(--color-primary-dark);
        }

        .journal-add-btn:disabled {
          background-color: var(--color-text-disabled);
          cursor: not-allowed;
        }

        .error-message {
          display: flex;
          align-items: center;
          padding: var(--space-sm);
          background-color: var(--color-error-light);
          color: var(--color-error);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-md);
          font-size: var(--font-size-sm);
        }

        .error-message svg {
          margin-right: var(--space-sm);
          flex-shrink: 0;
        }

        .error-message p {
          margin: 0;
        }

        .journal-entries {
          max-height: 300px;
          overflow-y: auto;
        }

        .loading-journal {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl) 0;
          color: var(--color-text-secondary);
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: var(--color-primary);
          animation: spin 0.8s linear infinite;
          margin-bottom: var(--space-sm);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .journal-entry {
          display: flex;
          flex-direction: column;
          padding: var(--space-sm);
          border-left: 3px solid var(--color-primary);
          background-color: var(--color-background);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-sm);
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }

        .journal-entry:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        .entry-positive {
          border-left-color: var(--color-success);
        }

        .entry-negative {
          border-left-color: var(--color-error);
        }

        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xs);
        }

        .entry-date {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .entry-actions {
          display: flex;
          gap: var(--space-xs);
        }

        .entry-delete-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: none;
          border: none;
          color: var(--color-text-secondary);
          opacity: 0.5;
          cursor: pointer;
          transition: opacity var(--transition-fast), color var(--transition-fast);
          border-radius: var(--radius-circle);
        }

        .entry-delete-btn:hover {
          opacity: 1;
          color: var(--color-error);
        }

        .entry-content {
          flex: 1;
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--space-xs);
          white-space: pre-wrap;
          word-break: break-word;
        }

        .entry-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
        }

        .entry-tag {
          font-size: var(--font-size-xs);
          color: var(--color-primary);
          background-color: var(--color-primary-light);
          padding: 2px var(--space-xs);
          border-radius: var(--radius-sm);
        }

        .empty-journal {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl) 0;
          color: var(--color-text-secondary);
          text-align: center;
        }

        .empty-journal svg {
          margin-bottom: var(--space-md);
          color: var(--color-text-disabled);
        }
      `}</style>
    </div>
  );
}
