import React from 'react';

interface DataDisplayProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  tooltip?: string;
}

export default function DataDisplay({
  label,
  value,
  className = '',
  labelClassName = '',
  valueClassName = '',
  tooltip
}: DataDisplayProps) {
  return (
    <div className={`data-display ${className}`}>
      <div className={`text-sm text-base-content/70 mb-1 ${labelClassName}`}>
        {label}
        {tooltip && (
          <div className="tooltip tooltip-right" data-tip={tooltip}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>
      <div className={`font-medium ${valueClassName}`}>{value}</div>
    </div>
  );
}
