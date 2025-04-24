import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export default function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName || !email || !password || !confirmPassword) {
      setError('請填寫所有欄位');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      return;
    }
    
    if (password.length < 6) {
      setError('密碼長度至少需要 6 個字元');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await register(email, password, displayName);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || '註冊失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">註冊</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">顯示名稱</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">電子郵件</span>
          </label>
          <input
            type="email"
            className="input input-bordered"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">密碼</span>
          </label>
          <input
            type="password"
            className="input input-bordered"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          <label className="label">
            <span className="label-text-alt">密碼長度至少需要 6 個字元</span>
          </label>
        </div>
        
        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text">確認密碼</span>
          </label>
          <input
            type="password"
            className="input input-bordered"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="form-control">
          <button
            type="submit"
            className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '註冊中...' : '註冊'}
          </button>
        </div>
        
        <div className="mt-4 text-center">
          <p>
            已經有帳號？{' '}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={onLoginClick}
              disabled={isLoading}
            >
              登入
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
