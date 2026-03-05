'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { requestPasswordReset } from '@/app/actions/passwordReset';
import { Lock, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams?.get('email') ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-10 ring-1 ring-slate-900/5">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-red-600 to-red-600 rounded-t-2xl" />

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/10">
            <Lock size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Reset your password</h1>
          <p className="text-slate-600 mt-2">
            Enter the email address associated with your admin account.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <p className="text-sm text-green-700 bg-green-50 px-4 py-3 rounded-lg">
              If an account with that email exists, we&apos;ve sent a password reset link.
              Check your inbox (and spam folder).
            </p>
            <Link
              href="/?login=1"
              className="flex items-center justify-center gap-2 w-full text-sm text-slate-700 hover:text-slate-900 font-bold py-3"
            >
              <ArrowLeft size={14} /> Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 disabled:opacity-70 text-white py-4 rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 shadow-lg shadow-slate-900/25"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <Link
              href="/?login=1"
              className="flex items-center justify-center gap-2 w-full text-sm text-slate-700 hover:text-slate-900 font-bold py-2"
            >
              <ArrowLeft size={14} /> Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
