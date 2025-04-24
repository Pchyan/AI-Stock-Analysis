import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md">
        <div className="bg-base-100 rounded-lg shadow-xl overflow-hidden">
          <button
            className="absolute top-2 right-2 btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
          >
            ✕
          </button>
          
          <div className="p-6">
            {mode === 'login' ? (
              <LoginForm
                onSuccess={onClose}
                onRegisterClick={() => setMode('register')}
              />
            ) : (
              <RegisterForm
                onSuccess={onClose}
                onLoginClick={() => setMode('login')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
