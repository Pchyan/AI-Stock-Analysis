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

      <div className="container py-4">

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
