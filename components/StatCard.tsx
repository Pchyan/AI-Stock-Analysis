import React from 'react';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  change,
  className = ''
}: StatCardProps) {
  return (
    <div className={`stat bg-base-100 shadow-md rounded-lg ${className}`}>
      <div className="stat-figure text-primary">
        {icon}
      </div>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      {change && (
        <div className={`stat-desc ${change.type === 'increase' ? 'text-success' : 'text-error'}`}>
          {change.type === 'increase' ? '↗' : '↘'} {Math.abs(change.value)}%
        </div>
      )}
    </div>
  );
}
