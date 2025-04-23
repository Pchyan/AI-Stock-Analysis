import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export default function Card({ title, subtitle, children, footer, className = '' }: CardProps) {
  return (
    <div className={`card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {(title || subtitle) && (
        <div className="card-header p-4 border-b border-base-200">
          {title && <h2 className="card-title text-lg font-semibold">{title}</h2>}
          {subtitle && <p className="text-sm text-base-content/70 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="card-body p-4">
        {children}
      </div>
      {footer && (
        <div className="card-footer p-4 border-t border-base-200">
          {footer}
        </div>
      )}
    </div>
  );
}
