'use client';

import React from 'react';
import { PageConfig } from '@/types';
import { Calendar, ArrowRight, Mail, MapPin, Clock, Send } from 'lucide-react';
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
              <div className="relative h-[260px] md:h-[320px] rounded-2xl overflow-hidden shadow-lg ring-1 ring-slate-200/80 bg-gradient-to-br from-red-800 to-red-700">
                {section.imageUrl && (
                  <img src={section.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-30" alt={section.title} />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-red-900/85 via-red-800/40 to-transparent flex items-center px-6 md:px-12">
                  <div className="max-w-xl space-y-3">
                    <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight tracking-tight">{section.title}</h2>
                    <p className="text-sm md:text-base text-red-100 leading-relaxed line-clamp-2">{section.content}</p>
                    <Link 
                      href="/join"
                      className="inline-flex bg-white/95 text-red-800 hover:bg-white px-5 py-2.5 rounded-lg font-semibold shadow-sm transition-all items-center gap-2 group"
                    >
                      Join Us <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {section.type === 'text' && (
              <div className="max-w-3xl">
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 border-l-4 border-red-800 pl-6">{section.title}</h3>
                <div className="text-lg text-slate-600 leading-relaxed whitespace-pre-line">{section.content}</div>
              </div>
            )}

            {section.type === 'image-text' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                {section.imageUrl && (
                  <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-900/10 transform hover:scale-[1.02] transition-transform duration-500 bg-slate-100 aspect-[4/3]">
                    <img src={section.imageUrl} className="w-full h-full object-cover" alt={section.title} />
                  </div>
                )}
                <div className="space-y-5">
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900">{section.title}</h3>
                  <div className="text-base text-slate-600 leading-relaxed whitespace-pre-line">{section.content}</div>
                </div>
              </div>
            )}

            {section.type === 'gallery' && (
              <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm ring-1 ring-slate-900/5">
                <h3 className="text-2xl font-bold text-slate-900 mb-8 border-l-4 border-red-800 pl-6">{section.title}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {section.content.split('•').filter(Boolean).map((item, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-xl hover:bg-slate-100 hover:ring-2 hover:ring-slate-200 transition-all cursor-pointer group">
                      <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{item.trim()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section.type === 'contact' && (
              <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm ring-1 ring-slate-900/5">
                <h3 className="text-2xl font-bold text-slate-900 text-center mb-4">{section.title}</h3>
                <p className="text-slate-600 text-center mb-10">{section.content}</p>
                <form className="max-w-xl mx-auto space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Name <span className="text-red-800">*</span></label>
                      <input type="text" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400 text-slate-900 transition-colors" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Email <span className="text-red-800">*</span></label>
                      <input type="email" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400 text-slate-900 transition-colors" placeholder="john@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                    <input type="text" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400 text-slate-900 transition-colors" placeholder="How can we help?" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Message</label>
                    <textarea rows={5} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400 text-slate-900 resize-none transition-colors" placeholder="Write your message here..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">What is four times five? <span className="text-red-800">*</span></label>
                    <input type="text" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400 text-slate-900 transition-colors" placeholder="Answer" />
                  </div>
                  <button type="submit" className="w-full bg-red-800 hover:bg-red-900 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition-all">
                    <Send size={18} />
                    Send Message
                  </button>
                </form>
              </div>
            )}

            {section.type === 'schedule' && (
              <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm ring-1 ring-slate-900/5">
                <h3 className="text-2xl font-bold text-slate-900 text-center mb-4 flex items-center justify-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Calendar className="text-slate-700" size={24}/>
                  </div>
                  {section.title}
                </h3>
                <p className="text-slate-600 text-center mb-10">{section.content}</p>
                <div className="space-y-3">
                  {[
                    { date: 'Dec 15, 2024', time: '7:30 PM', event: 'Winter Gala Concert', venue: 'Centennial Concert Hall' },
                    { date: 'Feb 14, 2025', time: '7:00 PM', event: 'Valentine\'s Day Performance', venue: 'Garden City Community Centre' },
                    { date: 'Apr 20, 2025', time: '2:00 PM', event: 'Spring Concert', venue: 'John Taylor Collegiate' },
                    { date: 'Jun 08, 2025', time: '1:00 PM', event: 'Year End Concert at The Forks', venue: 'The Forks, Winnipeg' },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-50 p-5 rounded-xl flex flex-wrap items-center justify-between hover:bg-slate-100 transition-colors group gap-4">
                      <div className="flex gap-5 items-center">
                        <div className="text-center min-w-[70px]">
                          <p className="text-[10px] font-bold uppercase text-red-800 tracking-wide">{item.date.split(',')[1]?.trim()}</p>
                          <p className="text-lg font-bold text-slate-900">{item.date.split(',')[0]}</p>
                        </div>
                        <div className="h-10 w-px bg-slate-200 hidden sm:block" aria-hidden="true"></div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{item.event}</h4>
                          <p className="text-sm text-slate-500 flex items-center gap-1"><MapPin size={12}/> {item.venue}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2 text-slate-500">
                        <Clock size={14}/>
                        <p className="text-sm font-medium">{item.time}</p>
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
          style={{ width: `${page.sidebarWidth}%`, minWidth: '280px' }}
        >
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm ring-1 ring-slate-900/5">
            <h4 className="text-base font-bold mb-3 flex items-center gap-2 text-slate-900" style={{ color: 'var(--westwood-red)' }}>
              <Clock size={16} className="opacity-90"/> Rehearsals
            </h4>
            <div className="space-y-2 text-sm text-slate-700">
              <p>Thursday Evenings</p>
              <p className="font-semibold text-slate-900">7:15 to 9:15 p.m.</p>
              <div className="pt-2 border-t border-slate-200">
                <p className="text-slate-700 flex items-start gap-2"><MapPin size={14} className="mt-0.5 flex-shrink-0 text-slate-500"/> The Band Room<br/>John Taylor Collegiate<br/>470 Hamilton Avenue<br/>Winnipeg, Manitoba</p>
              </div>
            </div>
            <a 
              href="https://maps.google.ca/maps?q=470+Hamilton+Avenue,+Winnipeg,+MB"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block w-full py-2.5 rounded-lg font-medium text-sm transition-colors text-center border-2 border-[var(--westwood-red)] text-[var(--westwood-red)] hover:bg-[var(--westwood-red)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--westwood-red)] focus:ring-offset-2"
            >
              Get Directions
            </a>
          </div>
          
          <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-slate-900/5">
            <h4 className="text-base font-bold mb-4 text-slate-900">Membership Fees</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between text-slate-700">
                <span>Annual Fee</span>
                <span className="font-bold text-slate-900">$100.00</span>
              </li>
              <li className="flex justify-between text-slate-700">
                <span>Students</span>
                <span className="font-bold text-slate-900">$50.00</span>
              </li>
              <li className="flex justify-between text-slate-700">
                <span>Polo Shirt</span>
                <span className="font-bold text-slate-900">$15.00</span>
              </li>
            </ul>
            <p className="text-xs text-slate-500 mt-4">Band Season: September to June</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-slate-900/5">
            <h4 className="text-base font-bold mb-4 text-slate-900 flex items-center gap-2"><Mail size={16}/> Contact</h4>
            <Link 
              href="/contact"
              className="block w-full border-2 border-red-800 text-red-800 hover:bg-red-800 hover:text-white py-2.5 rounded-lg font-medium text-sm transition-colors text-center"
            >
              Get in Touch
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
}
