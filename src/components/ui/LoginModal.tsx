'use client';

import React from 'react';
import { UserRole } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { Lock, ShieldCheck, ArrowRight, X } from 'lucide-react';

export default function LoginModal() {
  const { isLoginModalOpen, setIsLoginModalOpen, login } = useAppContext();

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-10 relative overflow-hidden ring-1 ring-slate-900/5">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-red-600 to-red-600"></div>
        <button 
          onClick={() => setIsLoginModalOpen(false)}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 rounded-lg p-1"
          aria-label="Close login modal"
        >
          <X size={24}/>
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/10">
            <Lock size={32} className="text-red-600"/>
          </div>
          <h3 className="text-3xl font-black text-slate-900">Admin Portal</h3>
          <p className="text-slate-600 mt-2">Access the CMS management engine.</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => login(UserRole.ADMIN)}
            className="w-full group bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 shadow-lg shadow-slate-900/25"
          >
            <ShieldCheck className="text-red-400"/>
            Login as Administrator
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16}/>
          </button>
          <button 
            onClick={() => login(UserRole.EDITOR)}
            className="w-full group bg-slate-100 hover:bg-slate-200 text-slate-900 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
          >
            Login as Content Editor
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16}/>
          </button>
          <p className="text-center text-xs text-slate-500 mt-8">
            Authorized access only. Security logs active.
          </p>
        </div>
      </div>
    </div>
  );
}
