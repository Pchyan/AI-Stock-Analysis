import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar';
import ThemeProvider from '../components/ThemeProvider';
import ThemeToggle from '../components/ThemeToggle';
import Container from '../components/Container';
import PageLoader from '../components/PageLoader';
import { AuthProvider } from '../contexts/AuthContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 處理頁面加載狀態
  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen flex flex-col bg-base-100 text-base-content transition-colors duration-200">
          <NavBar />

          <PageLoader loading={loading}>
            <main className="flex-grow py-6">
              <Container>
                <Component {...pageProps} />
              </Container>
            </main>
          </PageLoader>

          <footer className="footer footer-center p-4 bg-base-200 text-base-content">
            <div>
              <p>© {new Date().getFullYear()} AI Stock Analysis - 提供智能股票分析與投資組合管理</p>
            </div>
          </footer>

          <div className="fixed bottom-6 left-6 z-50">
            <ThemeToggle />
          </div>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}
