import React from 'react';

interface PageLoaderProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function PageLoader({
  loading,
  children,
  className = ''
}: PageLoaderProps) {
  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-base-100/80 flex justify-center items-center z-50">
          <div className="flex flex-col items-center">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="mt-4 text-base-content/70">載入中，請稍候...</p>
          </div>
        </div>
      )}
      <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  );
}
