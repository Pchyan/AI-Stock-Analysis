import React from 'react';
import Card from './Card';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
  toolbar?: React.ReactNode;
}

export default function ChartContainer({
  title,
  subtitle,
  children,
  className = '',
  loading = false,
  error,
  toolbar
}: ChartContainerProps) {
  return (
    <Card
      title={title}
      subtitle={subtitle}
      className={`chart-container ${className}`}
      footer={
        toolbar && (
          <div className="flex justify-end">
            {toolbar}
          </div>
        )
      }
    >
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center py-16 text-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      ) : (
        <div className="chart-wrapper min-h-[300px] w-full">
          {children}
        </div>
      )}
    </Card>
  );
}
