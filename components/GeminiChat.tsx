import { useState, useRef, useEffect } from 'react';

export default function GeminiChat() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 簡單的解密函數
  const decryptApiKey = (encryptedKey: string): string => {
    try {
      const decoded = atob(encryptedKey);
      return decoded.split('').reverse().join('');
    } catch (e) {
      console.error('解密失敗', e);
      return encryptedKey; // 如果解密失敗，返回原始字符串，可能是未加密的舊版本
    }
  };

  // Scroll to bottom of messages when history changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const sendPrompt = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const encryptedApiKey = localStorage.getItem('gemini_api_key');
      if (!encryptedApiKey) {
        setHistory([...history, { role: 'error', text: '請先於設定頁輸入 Gemini API KEY' }]);
        setLoading(false);
        return;
      }

      // 解密 API KEY
      const userApiKey = decryptApiKey(encryptedApiKey);

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, apiKey: userApiKey })
      });
      const data = await res.json();
      if (data.error) {
        setHistory([...history, { role: 'error', text: 'Gemini API 錯誤：' + (data.error.message || data.error) }]);
      } else {
        setHistory([
          ...history,
          { role: 'user', text: input },
          { role: 'gemini', text: data.candidates?.[0]?.content?.parts?.[0]?.text || '無回應' }
        ]);
      }
      setInput('');
    } catch (e) {
      setHistory([...history, { role: 'error', text: 'Gemini API 錯誤' }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const formatTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className={`chat-container card ${isExpanded ? 'expanded' : ''}`}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="card-title mb-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Gemini 智能助理
        </h3>
        <button className="btn-sm btn-outline rounded-full" onClick={toggleExpand}>
          {isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20"></polyline>
              <polyline points="20 10 14 10 14 4"></polyline>
              <line x1="14" y1="10" x2="21" y2="3"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          )}
        </button>
      </div>

      <div className="chat-messages">
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 15h8"></path>
                <circle cx="9" cy="9" r="1"></circle>
                <circle cx="15" cy="9" r="1"></circle>
              </svg>
            </div>
            <p>您可以向 Gemini 提問有關股票分析、投資策略或市場趨勢的問題</p>
          </div>
        ) : (
          history.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="message-content">
                <div className="message-text">{msg.text}</div>
                <div className="message-time">{formatTimestamp()}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <input
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="輸入您的問題..."
          disabled={loading}
        />
        <button
          className={`chat-send-btn ${loading ? 'loading' : ''}`}
          onClick={sendPrompt}
          disabled={loading || !input.trim()}
        >
          {loading ? (
            <div className="spinner"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </div>

      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: ${isExpanded ? '500px' : '400px'};
          transition: height var(--transition-normal);
        }

        .chat-container.expanded {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 400px;
          height: 600px;
          z-index: var(--z-index-fixed);
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-md);
          display: flex;
          flex-direction: column;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--color-text-secondary);
          text-align: center;
          padding: var(--space-lg);
        }

        .empty-icon {
          margin-bottom: var(--space-md);
          color: var(--color-text-disabled);
        }

        .message {
          margin-bottom: var(--space-md);
          max-width: 85%;
          display: flex;
        }

        .message.user {
          align-self: flex-end;
        }

        .message.gemini {
          align-self: flex-start;
        }

        .message.error {
          align-self: center;
        }

        .message-content {
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-lg);
          position: relative;
        }

        .message.user .message-content {
          background-color: var(--color-primary);
          color: white;
          border-top-right-radius: 0;
        }

        .message.gemini .message-content {
          background-color: var(--color-background);
          border-top-left-radius: 0;
        }

        .message.error .message-content {
          background-color: var(--color-error);
          color: white;
        }

        .message-text {
          margin-bottom: var(--space-xxs);
          white-space: pre-wrap;
        }

        .message-time {
          font-size: var(--font-size-xs);
          opacity: 0.7;
          text-align: right;
        }

        .chat-input-container {
          display: flex;
          padding: var(--space-md);
          border-top: 1px solid var(--color-divider);
        }

        .chat-input {
          flex: 1;
          padding: var(--space-sm) var(--space-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--font-size-md);
          transition: border-color var(--transition-fast);
        }

        .chat-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .chat-send-btn {
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

        .chat-send-btn:hover {
          background-color: var(--color-primary-dark);
        }

        .chat-send-btn:disabled {
          background-color: var(--color-text-disabled);
          cursor: not-allowed;
        }

        .chat-send-btn.loading {
          background-color: var(--color-primary-light);
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 576px) {
          .chat-container.expanded {
            width: 90%;
            left: 5%;
            right: 5%;
          }
        }
      `}</style>
    </div>
  );
}
