'use client';

import React, { useState } from 'react';
import { Mail, Shield, UserCircle2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import type { User } from '@/types';
import { changeOwnPassword } from '@/app/actions/auth';
import { validatePassword } from '@/lib/validation';

interface MyAccountTabProps {
  user: User;
}

export default function MyAccountTab({ user }: MyAccountTabProps) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const initials = user.username ? user.username.charAt(0).toUpperCase() : '?';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPw.trim()) {
      setError('Current password is required.');
      return;
    }

    const pwErr = validatePassword(newPw);
    if (pwErr) {
      setError(pwErr);
      return;
    }

    if (newPw !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const result = await changeOwnPassword({
      currentPassword: currentPw,
      newPassword: newPw,
    });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setSuccess('Your password has been updated.');
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-6 flex gap-4 items-start">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-red-500/25">
          {initials}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                Signed in as
              </p>
              <p className="text-xl font-black text-slate-900 leading-tight">
                {user.username}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-slate-900 text-slate-50 uppercase tracking-widest">
              <Shield size={12} />
              {user.role}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-slate-500" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.contactLabel && (
              <div className="flex items-center gap-2">
                <UserCircle2 size={16} className="text-slate-500" />
                <span className="truncate">{user.contactLabel}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Your name, email, role, and contact label can be updated by an administrator on the
            &quot;Team &amp; RBAC&quot; tab.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock size={18} className="text-red-600" />
              Change password
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Update your password at any time. This only affects your own account.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label
              htmlFor="myaccount-current"
              className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1"
            >
              Current password
            </label>
            <input
              id="myaccount-current"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="myaccount-new"
              className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1"
            >
              New password
            </label>
            <input
              id="myaccount-new"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="Minimum 8 characters"
            />
          </div>
          <div>
            <label
              htmlFor="myaccount-confirm"
              className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1"
            >
              Confirm new password
            </label>
            <input
              id="myaccount-confirm"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          {error && (
            <div
              className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              <AlertCircle size={16} className="mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div
              className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700"
              role="status"
            >
              <CheckCircle2 size={16} className="mt-0.5" />
              <p>{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
          >
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  );
}

