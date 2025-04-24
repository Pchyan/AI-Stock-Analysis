import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, signOut, signIn, registerUser } from '../firebase/auth';
import storageBridge from '../utils/storage-bridge';

// 檢查是否在瀏覽器環境中
const isBrowser = typeof window !== 'undefined';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<boolean>;
  register: (email: string, password: string, displayName: string) => Promise<User>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isBrowser) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 當用戶登入狀態變化時，同步存儲
  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    // 只有在加載完成後才執行同步
    if (!loading && user) {
      console.log('用戶登入後，開始同步 localStorage 和 Firebase');
      // 用戶登入後，同步 localStorage 和 Firebase
      storageBridge.sync().then(() => {
        console.log('同步 localStorage 和 Firebase 成功');
      }).catch(err => {
        console.error('同步存儲失敗:', err);
      });
    }
  }, [user, loading]);

  const handleSignIn = async (email: string, password: string) => {
    try {
      setError(null);
      return await signIn(email, password);
    } catch (err: any) {
      setError(err.message || '登入失敗');
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      return await signOut();
    } catch (err: any) {
      setError(err.message || '登出失敗');
      throw err;
    }
  };

  const handleRegister = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      return await registerUser(email, password, displayName);
    } catch (err: any) {
      setError(err.message || '註冊失敗');
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    signIn: handleSignIn,
    signOut: handleSignOut,
    register: handleRegister,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
