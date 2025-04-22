import React from 'react';
import NavBar from '../components/NavBar';
import PortfolioManager from '../components/PortfolioManager';
import Head from 'next/head';
import Link from 'next/link';

export default function PortfolioPage() {
  return (
    <>
      <Head>
        <title>AI 股票分析 | 持股管理</title>
        <meta name="description" content="管理您的投資組合，追蹤您的持股表現" />
      </Head>

      <NavBar />

      <div className="container py-4">
        <div className="back-link mb-3">
          <Link href="/" className="d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            返回首頁
          </Link>
        </div>

        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <div className="mb-4">
              <h1 className="mb-2">持股管理</h1>
              <p className="text-secondary">
                在這裡管理您的投資組合，追蹤您的持股表現。
              </p>
            </div>

            <PortfolioManager />
          </div>
        </div>
      </div>
    </>
  );
}
