import React from 'react';

export default function AlertSystem({ alerts }) {
  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="card-title mb-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          警報系統
        </h3>
        <span className="alert-badge">{alerts?.length || 0}</span>
      </div>

      <div className="card-body">
        {alerts && alerts.length > 0 ? (
          <div className="alert-list">
            {alerts.map((alert, i) => (
              <div key={i} className="alert-item">
                <div className="alert-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div className="alert-content">{alert}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-alerts">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
            <p>目前沒有警報</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .alert-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background-color: ${alerts?.length > 0 ? 'var(--color-error)' : 'var(--color-text-disabled)'};
          color: white;
          border-radius: var(--radius-circle);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
        }

        .alert-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .alert-item {
          display: flex;
          align-items: center;
          padding: var(--space-sm);
          background-color: var(--color-background);
          border-radius: var(--radius-md);
          border-left: 3px solid var(--color-error);
          transition: transform var(--transition-fast);
        }

        .alert-item:hover {
          transform: translateX(3px);
        }

        .alert-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          margin-right: var(--space-sm);
          color: var(--color-error);
        }

        .alert-content {
          font-weight: var(--font-weight-medium);
        }

        .empty-alerts {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl) 0;
          color: var(--color-text-secondary);
          text-align: center;
        }

        .empty-alerts svg {
          margin-bottom: var(--space-sm);
          color: var(--color-text-disabled);
        }
      `}</style>
    </div>
  );
}
