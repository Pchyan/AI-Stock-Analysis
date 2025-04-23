import React, { useState, useEffect } from 'react';

interface TransitionProps {
  show: boolean;
  children: React.ReactNode;
  type?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale';
  duration?: number;
  className?: string;
}

export default function Transition({
  show,
  children,
  type = 'fade',
  duration = 300,
  className = ''
}: TransitionProps) {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) setShouldRender(true);
    let timeoutId: NodeJS.Timeout;
    
    if (!show && shouldRender) {
      timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, duration);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [show, duration, shouldRender]);

  if (!shouldRender) return null;

  const getAnimationClasses = () => {
    switch (type) {
      case 'fade':
        return show
          ? 'animate-fade-in opacity-100'
          : 'animate-fade-out opacity-0';
      case 'slide-up':
        return show
          ? 'animate-slide-up-in translate-y-0 opacity-100'
          : 'animate-slide-up-out translate-y-4 opacity-0';
      case 'slide-down':
        return show
          ? 'animate-slide-down-in translate-y-0 opacity-100'
          : 'animate-slide-down-out -translate-y-4 opacity-0';
      case 'slide-left':
        return show
          ? 'animate-slide-left-in translate-x-0 opacity-100'
          : 'animate-slide-left-out translate-x-4 opacity-0';
      case 'slide-right':
        return show
          ? 'animate-slide-right-in translate-x-0 opacity-100'
          : 'animate-slide-right-out -translate-x-4 opacity-0';
      case 'scale':
        return show
          ? 'animate-scale-in scale-100 opacity-100'
          : 'animate-scale-out scale-95 opacity-0';
      default:
        return show
          ? 'animate-fade-in opacity-100'
          : 'animate-fade-out opacity-0';
    }
  };

  return (
    <div
      className={`transition-all ${getAnimationClasses()} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}
