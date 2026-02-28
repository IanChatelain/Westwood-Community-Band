'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { login } from '@/app/actions/auth';
import { Lock, ArrowRight, X } from 'lucide-react';

export default function LoginModal() {
  const router = useRouter();
  const { isLoginModalOpen, setIsLoginModalOpen, setState } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.user) {
      setState((prev) => ({ ...prev, currentUser: result.user ?? null }));
    }
    setIsLoginModalOpen(false);
    setEmail('');
    setPassword('');
    router.push('/admin');
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-10 relative overflow-hidden ring-1 ring-slate-900/5">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-red-600 to-red-600"></div>
        <button
          onClick={() => { setIsLoginModalOpen(false); setError(null); }}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 rounded-lg p-1"
          aria-label="Close login modal"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/10">
            <Lock size={32} className="text-red-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-900">Admin Portal</h3>
          <p className="text-slate-600 mt-2">Sign in with your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg" role="alert">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full group bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 disabled:opacity-70 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 shadow-lg shadow-slate-900/25"
          >
            {loading ? 'Signing in…' : 'Sign in'}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
          </button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-6">
          Authorized access only.
        </p>
      </div>
    </div>
  );
}
