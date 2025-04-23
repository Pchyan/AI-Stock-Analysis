import React, { useState, useEffect } from 'react';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  breakpoints?: {
    sm?: React.ReactNode;
    md?: React.ReactNode;
    lg?: React.ReactNode;
    xl?: React.ReactNode;
  };
  className?: string;
}

export default function ResponsiveWrapper({
  children,
  breakpoints,
  className = ''
}: ResponsiveWrapperProps) {
  const [windowWidth, setWindowWidth] = useState<number>(0);

  useEffect(() => {
    // 初始化窗口寬度
    setWindowWidth(window.innerWidth);

    // 監聽窗口大小變化
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 根據窗口寬度決定顯示的內容
  const getContent = () => {
    if (!breakpoints) return children;

    if (windowWidth < 640 && breakpoints.sm) {
      return breakpoints.sm;
    } else if (windowWidth < 768 && breakpoints.md) {
      return breakpoints.md;
    } else if (windowWidth < 1024 && breakpoints.lg) {
      return breakpoints.lg;
    } else if (windowWidth < 1280 && breakpoints.xl) {
      return breakpoints.xl;
    }

    return children;
  };

  return (
    <div className={className}>
      {windowWidth === 0 ? children : getContent()}
    </div>
  );
}
