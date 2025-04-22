import Link from 'next/link';
import { useState } from 'react';

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="shadow-sm bg-surface">
      <div className="container d-flex justify-content-between align-items-center p-3">
        {/* Logo */}
        <div className="d-flex align-items-center">
          <Link href="/" className="font-bold text-primary" style={{ fontSize: 'var(--font-size-xl)' }}>
            <span className="d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                <line x1="6" y1="1" x2="6" y2="4"></line>
                <line x1="10" y1="1" x2="10" y2="4"></line>
                <line x1="14" y1="1" x2="14" y2="4"></line>
              </svg>
              AI Stock Analysis
            </span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="d-none d-md-flex align-items-center">
          <Link href="/" className="mr-4 font-medium">首頁</Link>
          <Link href="/portfolio" className="mr-4 font-medium">持股管理</Link>
          <Link href="/settings" className="font-medium">設定</Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="d-md-none btn-outline rounded-md p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="d-md-none bg-surface shadow-md p-3 animate-fade-in">
          <Link href="/" className="d-block p-2 font-medium" onClick={() => setMenuOpen(false)}>首頁</Link>
          <Link href="/portfolio" className="d-block p-2 font-medium" onClick={() => setMenuOpen(false)}>持股管理</Link>
          <Link href="/settings" className="d-block p-2 font-medium" onClick={() => setMenuOpen(false)}>設定</Link>
        </div>
      )}

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  );
}
