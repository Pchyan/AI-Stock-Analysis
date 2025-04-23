import React from 'react';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: {
    href: string;
    label: string;
  };
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, backLink, actions }: PageHeaderProps) {
  return (
    <div className="page-header mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          {backLink && (
            <Link 
              href={backLink.href}
              className="inline-flex items-center text-sm text-primary hover:text-primary-focus mb-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {backLink.label}
            </Link>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-base-content">{title}</h1>
          {description && (
            <p className="mt-1 text-sm md:text-base text-base-content/70">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
