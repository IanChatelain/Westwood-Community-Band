'use client';

import { ArrowRight, Users, Heart, Music } from 'lucide-react';

export default function JoinPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight">Join The Band</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          We welcome musicians of all skill levels! Whether you&apos;re picking up your instrument after years or you&apos;re a seasoned performer, there&apos;s a place for you here.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {[
          { icon: <Music className="text-indigo-600" size={28} />, color: 'bg-indigo-100', title: 'Weekly Rehearsals', desc: 'Join us every Tuesday evening for structured practice sessions led by experienced conductors.' },
          { icon: <Users className="text-violet-600" size={28} />, color: 'bg-violet-100', title: 'Community', desc: 'Connect with fellow musicians who share your passion for music and community engagement.' },
          { icon: <Heart className="text-rose-600" size={28} />, color: 'bg-rose-100', title: 'Give Back', desc: 'Perform at local events, nursing homes, and community gatherings to spread the joy of music.' },
        ].map((benefit, i) => (
          <div key={i} className="bg-white p-7 rounded-2xl shadow-sm ring-1 ring-slate-900/5 text-center hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 ${benefit.color} rounded-xl flex items-center justify-center mx-auto mb-5`}>
              {benefit.icon}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{benefit.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{benefit.desc}</p>
          </div>
        ))}
      </div>

      {/* Contact Form */}
      <div className="max-w-2xl mx-auto bg-white p-8 md:p-10 rounded-2xl shadow-sm ring-1 ring-slate-900/5">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Express Your Interest</h2>
        <form className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
              <input type="text" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-400 text-slate-900 transition-colors" placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
              <input type="text" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-400 text-slate-900 transition-colors" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input type="email" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-400 text-slate-900 transition-colors" placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary Instrument</label>
            <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-slate-900 transition-colors">
              <option value="" className="text-slate-400">Select your instrument...</option>
              <option value="flute">Flute</option>
              <option value="clarinet">Clarinet</option>
              <option value="saxophone">Saxophone</option>
              <option value="trumpet">Trumpet</option>
              <option value="french-horn">French Horn</option>
              <option value="trombone">Trombone</option>
              <option value="euphonium">Euphonium</option>
              <option value="tuba">Tuba</option>
              <option value="percussion">Percussion</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tell Us About Yourself</label>
            <textarea rows={4} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none placeholder:text-slate-400 text-slate-900 transition-colors" placeholder="Share your musical background and what you hope to gain from joining..." />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white py-3.5 rounded-lg font-semibold flex items-center justify-center gap-2 group transition-all shadow-lg shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Submit Application <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
