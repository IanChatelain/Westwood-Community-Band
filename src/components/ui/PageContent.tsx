'use client';

import React from 'react';
import { PageConfig } from '@/types';
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PageContentProps {
  page: PageConfig;
}

export default function PageContent({ page }: PageContentProps) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-12`}>
      {/* Main Content Area */}
      <div 
        className="flex-grow space-y-16"
        style={{ width: page.layout === 'full' ? '100%' : `${100 - page.sidebarWidth}%` }}
      >
        {page.sections.map((section) => (
          <section key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {section.type === 'hero' && (
              <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10">
                <img src={section.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt={section.title} />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent flex items-center px-8 md:px-16">
                  <div className="max-w-xl space-y-6">
                    <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">{section.title}</h2>
                    <p className="text-lg text-slate-200 leading-relaxed">{section.content}</p>
                    <button className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 group">
                      Learn More <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {section.type === 'text' && (
              <div className="max-w-3xl">
                <h3 className="text-3xl font-bold text-slate-900 mb-6 border-l-4 border-indigo-500 pl-6">{section.title}</h3>
                <p className="text-lg text-slate-600 leading-relaxed">{section.content}</p>
              </div>
            )}

            {section.type === 'image-text' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-900/10 transform hover:scale-[1.02] transition-transform duration-500">
                  <img src={section.imageUrl} className="w-full h-auto" alt={section.title} />
                </div>
                <div className="space-y-5">
                  <h3 className="text-3xl font-bold text-slate-900">{section.title}</h3>
                  <p className="text-lg text-slate-600 leading-relaxed">{section.content}</p>
                </div>
              </div>
            )}

            {section.type === 'schedule' && (
              <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm ring-1 ring-slate-900/5">
                <h3 className="text-2xl font-bold text-slate-900 text-center mb-10 flex items-center justify-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Calendar className="text-indigo-600" size={24}/>
                  </div>
                  {section.title}
                </h3>
                <div className="space-y-3">
                  {[
                    { date: 'Dec 15, 2024', time: '7:30 PM', event: 'Winter Gala Concert', venue: 'Westwood Civic Hall' },
                    { date: 'Jan 12, 2025', time: '2:00 PM', event: 'New Year Workshop', venue: 'Band Room' },
                    { date: 'Mar 20, 2025', time: '8:00 PM', event: 'Spring Equinox Performance', venue: 'Main Square' },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-50 p-5 rounded-xl flex flex-wrap items-center justify-between hover:bg-slate-100 transition-colors group">
                      <div className="flex gap-5 items-center">
                        <div className="text-center min-w-[70px]">
                          <p className="text-[10px] font-bold uppercase text-indigo-600 tracking-wide">{item.date.split(',')[1]}</p>
                          <p className="text-lg font-bold text-slate-900">{item.date.split(',')[0]}</p>
                        </div>
                        <div className="h-10 w-px bg-slate-200 hidden sm:block" aria-hidden="true"></div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{item.event}</h4>
                          <p className="text-sm text-slate-500">{item.venue}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-500">{item.time}</p>
                        <button className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded">RSVP & TICKETS</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Sidebar Area */}
      {page.layout !== 'full' && (
        <aside 
          className={`space-y-6 ${page.layout === 'sidebar-left' ? '-order-1' : ''}`}
          style={{ width: `${page.sidebarWidth}%` }}
        >
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-7 rounded-2xl shadow-xl shadow-indigo-500/20">
            <h4 className="text-lg font-bold mb-3">Join The Band!</h4>
            <p className="text-sm text-indigo-100 mb-5 leading-relaxed">We are currently looking for percussionists and low brass players, but all are welcome!</p>
            <Link 
              href="/join"
              className="block w-full bg-white text-indigo-700 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            >
              Inquire Now
            </Link>
          </div>
          
          <div className="bg-white p-7 rounded-2xl shadow-sm ring-1 ring-slate-900/5">
            <h4 className="text-lg font-bold mb-5 text-slate-900">Latest Updates</h4>
            <ul className="space-y-4">
              <li className="group cursor-pointer">
                <p className="text-xs text-indigo-600 font-semibold mb-1">NOV 24</p>
                <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">Winter Rehearsals Moved to Tuesdays</p>
              </li>
              <li aria-hidden="true"><div className="h-px bg-slate-100"></div></li>
              <li className="group cursor-pointer">
                <p className="text-xs text-indigo-600 font-semibold mb-1">NOV 10</p>
                <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">Band Attends Provincial Festival</p>
              </li>
            </ul>
          </div>
        </aside>
      )}
    </div>
  );
}
