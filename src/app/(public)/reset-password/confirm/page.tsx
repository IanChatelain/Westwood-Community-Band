'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetPassword } from '@/app/actions/passwordReset';
import { Lock } from 'lucide-react';

export default function ResetPasswordConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams?.get('email') ?? '';
  const token = searchParams?.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!email || !token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-10 ring-1 ring-slate-900/5 text-center">
          <p className="text-red-600 font-bold">Invalid or missing reset link.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword({ email, token, newPassword });
      if (result.error) {
        setError(result.error);
      } else {
        router.push('/?login=1&reset=1');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-10 ring-1 ring-slate-900/5">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/10">
            <Lock size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Set your new password</h1>
          <p className="text-slate-600 mt-2">Choose a strong password (at least 8 characters).</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
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
            className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 disabled:opacity-70 text-white py-4 rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 shadow-lg shadow-slate-900/25"
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}
