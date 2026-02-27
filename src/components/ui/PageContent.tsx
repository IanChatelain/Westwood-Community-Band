'use client';

import React, { useState } from 'react';
import { PageConfig, SidebarBlock, PageSection, SectionStyle, BuilderBlock } from '@/types';
import { DEFAULT_SIDEBAR_BLOCKS } from '@/constants';
import { Calendar, ArrowRight, Mail, MapPin, Clock, Send } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function sectionWrapperClasses(style?: SectionStyle): string {
  if (!style) return '';
  const p = style.padding === 'none' ? 'p-0' : style.padding === 'small' ? 'p-4' : style.padding === 'large' ? 'p-8' : 'p-6';
  const b = style.border === 'none' ? '' : style.border === 'thin' ? 'border border-slate-200' : style.border === 'thick' ? 'border-2 border-slate-300' : 'border border-slate-300';
  const r = style.borderRadius === 'none' ? 'rounded-none' : style.borderRadius === 'small' ? 'rounded-lg' : style.borderRadius === 'round' ? 'rounded-2xl' : 'rounded-xl';
  return [p, b, r].filter(Boolean).join(' ');
}

function imageLayoutClasses(style?: SectionStyle): { wrapper: string; image: string } {
  const pos = style?.imagePosition ?? 'left';
  const size = style?.imageSize === 'small' ? 'max-w-xs' : style?.imageSize === 'large' ? 'max-w-2xl' : 'max-w-lg';
  if (pos === 'top') return { wrapper: 'grid grid-cols-1 gap-6', image: `w-full ${size} mx-auto aspect-[4/3]` };
  if (pos === 'full') return { wrapper: 'grid grid-cols-1 gap-6', image: 'w-full aspect-[21/9]' };
  if (pos === 'right') return { wrapper: 'grid grid-cols-1 md:grid-cols-2 gap-12 items-start', image: `md:order-2 ${size}` };
  return { wrapper: 'grid grid-cols-1 md:grid-cols-2 gap-12 items-start', image: size };
}

function SidebarBlockContent({ block }: { block: SidebarBlock }) {
  if (block.type === 'rehearsals') {
    return (
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
        <a href="https://maps.google.ca/maps?q=470+Hamilton+Avenue,+Winnipeg,+MB" target="_blank" rel="noopener noreferrer" className="mt-4 block w-full py-2.5 rounded-lg font-medium text-sm transition-colors text-center border-2 border-[var(--westwood-red)] text-[var(--westwood-red)] hover:bg-[var(--westwood-red)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--westwood-red)] focus:ring-offset-2">Get Directions</a>
      </div>
    );
  }
  if (block.type === 'fees') {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-slate-900/5">
        <h4 className="text-base font-bold mb-4 text-slate-900">{block.title || 'Membership Fees'}</h4>
        <ul className="space-y-3 text-sm">
          <li className="flex justify-between text-slate-700"><span>Annual Fee</span><span className="font-bold text-slate-900">$100.00</span></li>
          <li className="flex justify-between text-slate-700"><span>Students</span><span className="font-bold text-slate-900">$50.00</span></li>
          <li className="flex justify-between text-slate-700"><span>Polo Shirt</span><span className="font-bold text-slate-900">$15.00</span></li>
        </ul>
        <p className="text-xs text-slate-500 mt-4">Band Season: September to June</p>
      </div>
    );
  }
  if (block.type === 'contact') {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-slate-900/5">
        <h4 className="text-base font-bold mb-4 text-slate-900 flex items-center gap-2"><Mail size={16}/> {block.title || 'Contact'}</h4>
        <Link href="/contact" className="block w-full border-2 border-red-800 text-red-800 hover:bg-red-800 hover:text-white py-2.5 rounded-lg font-medium text-sm transition-colors text-center">Get in Touch</Link>
      </div>
    );
  }
  if (block.type === 'custom') {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-slate-900/5">
        {block.title && <h4 className="text-base font-bold mb-3 text-slate-900">{block.title}</h4>}
        <div className="text-sm text-slate-700 whitespace-pre-line">{block.content || ''}</div>
      </div>
    );
  }
  return null;
}

function ContactSection({ section }: { section: PageSection }) {
  const recipients = section.contactRecipients ?? [];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientId, setRecipientId] = useState(recipients[0]?.id ?? '');
  const [mathAnswer, setMathAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    const parsed = parseInt(mathAnswer.trim(), 10);
    if (Number.isNaN(parsed) || parsed !== 20) {
      setSubmitError('Please answer the anti-spam question correctly.');
      return;
    }
    if (!recipientId) {
      setSubmitError('Please select who you would like to contact.');
      return;
    }

    try {
      setIsSubmitting(true);
      const supabase = createClient();
      const selected = recipients.find((r) => r.id === recipientId);
      await supabase.from('contact_messages').insert({
        sender_name: name.trim(),
        sender_email: email.trim(),
        subject: subject.trim() || null,
        message: message.trim(),
        recipient_label: selected?.label ?? recipientId,
        recipient_id: recipientId,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });

      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setMathAnswer('');
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting contact form', error);
      setSubmitError('Something went wrong while sending your message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm ring-1 ring-slate-900/5">
      <h3 className="text-2xl font-bold text-slate-900 text-center mb-4">{section.title}</h3>
      <p className="text-slate-600 text-center mb-10">{section.content}</p>
      <form className="max-w-xl mx-auto space-y-5" onSubmit={handleSubmit}>
        {recipients.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Send to <span className="text-red-800">*</span>
            </label>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none text-slate-900 bg-white"
              required
            >
              <option value="" disabled>
                Select who you would like to contact
              </option>
              {recipients.map((recipient) => (
                <option key={recipient.id} value={recipient.id}>
                  {recipient.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Your Name <span className="text-red-800">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400 text-slate-900 transition-colors"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Your Email <span className="text-red-800">*</span>
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400 text-slate-900 transition-colors"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400 text-slate-900 transition-colors"
            placeholder="How can we help?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Message</label>
          <textarea
            rows={5}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400 text-slate-900 resize-none transition-colors"
            placeholder="Write your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            What is four times five? <span className="text-red-800">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400 text-slate-900 transition-colors"
            placeholder="Answer"
            value={mathAnswer}
            onChange={(e) => setMathAnswer(e.target.value)}
          />
        </div>
        {submitError && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {submitError}
          </p>
        )}
        {submitSuccess && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
            Thank you for your message. We will get back to you soon.
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-red-800 hover:bg-red-900 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Send size={18} />
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}

function BuilderBlockView({ block }: { block: BuilderBlock }) {
  if (block.type === 'richText') {
    return (
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="max-w-3xl">
          <div className="text-lg text-slate-600 leading-relaxed whitespace-pre-line">
            {block.content}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === 'image') {
    const radius = block.borderRadius ?? 12;
    const padding = block.padding ?? 8;
    return (
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <figure
          className="bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden max-w-3xl"
          style={{ borderRadius: radius, padding }}
        >
          {block.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.src}
              alt={block.alt}
              className="w-full h-auto object-cover rounded-md"
            />
          )}
          {(block.caption || block.alt) && (
            <figcaption className="mt-2 text-xs text-slate-500">
              {block.caption || block.alt}
            </figcaption>
          )}
        </figure>
      </section>
    );
  }

  if (block.type === 'separator') {
    const thickness = block.thickness ?? 1;
    const style =
      block.style === 'dashed'
        ? 'border-dashed'
        : block.style === 'dotted'
          ? 'border-dotted'
          : 'border-solid';
    const widthClass =
      block.width === 'narrow'
        ? 'max-w-xs mx-auto'
        : block.width === 'content'
          ? 'max-w-2xl mx-auto'
          : 'w-full';
    return (
      <section className="py-6" aria-hidden="true">
        <hr
          className={`${widthClass} border-0 border-t ${style}`}
          style={{ borderTopWidth: thickness, borderColor: block.color ?? '#CBD5E1' }}
        />
      </section>
    );
  }

  if (block.type === 'spacer') {
    return (
      <div
        style={{ height: block.height }}
        aria-hidden="true"
      />
    );
  }

  if (block.type === 'button') {
    const variant = block.variant ?? 'primary';
    const base = 'inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    const classes =
      variant === 'secondary'
        ? `${base} bg-white text-red-800 border border-red-800 hover:bg-red-50 focus:ring-red-800`
        : variant === 'ghost'
          ? `${base} bg-transparent text-red-800 border border-transparent hover:bg-red-50 focus:ring-red-800`
          : `${base} bg-red-800 text-white hover:bg-red-900 focus:ring-red-800`;
    const radius = block.borderRadius ?? 999;
    const paddingX = block.paddingX ?? 20;
    const paddingY = block.paddingY ?? 10;
    return (
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <a
          href={block.href || '#'}
          className={classes}
          style={{ borderRadius: radius, paddingLeft: paddingX, paddingRight: paddingX, paddingTop: paddingY, paddingBottom: paddingY }}
        >
          {block.label}
        </a>
      </section>
    );
  }

  return null;
}

interface PageContentProps {
  page: PageConfig;
}

export default function PageContent({ page }: PageContentProps) {
  const hasBlocks = page.blocks && page.blocks.length > 0;

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-12`}>
      {/* Main Content Area */}
      <div 
        className="flex-grow space-y-16"
        style={{ width: page.layout === 'full' ? '100%' : `${100 - page.sidebarWidth}%` }}
      >
        {hasBlocks && page.blocks!.map((block) => (
          <BuilderBlockView key={block.id} block={block} />
        ))}

        {!hasBlocks && page.sections.map((section) => (
          <section key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={sectionWrapperClasses(section.style)}>
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

            {section.type === 'image-text' && (() => {
              const { wrapper, image } = imageLayoutClasses(section.style);
              return (
                <div className={wrapper}>
                  {section.imageUrl && (
                    <div className={`rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-900/10 bg-slate-100 aspect-[4/3] ${image}`}>
                      <img src={section.imageUrl} className="w-full h-full object-cover" alt={section.title} />
                    </div>
                  )}
                  <div className="space-y-5">
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900">{section.title}</h3>
                    <div className="text-base text-slate-600 leading-relaxed whitespace-pre-line">{section.content}</div>
                  </div>
                </div>
              );
            })()}

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

            {section.type === 'contact' && <ContactSection section={section} />}

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

            {section.type === 'table' && section.tableData && (
              <div className="overflow-x-auto">
                {section.title && <h3 className="text-2xl font-bold text-slate-900 mb-4 border-l-4 border-red-800 pl-6">{section.title}</h3>}
                <table className="w-full border border-slate-300 text-left">
                  <thead>
                    <tr className="bg-slate-100">
                      {(section.tableData.headers || []).map((h, i) => (
                        <th key={i} className="border border-slate-300 px-4 py-3 font-bold text-slate-900">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(section.tableData.rows || []).map((row, ri) => (
                      <tr key={ri} className="hover:bg-slate-50">
                        {row.map((cell, ci) => (
                          <td key={ci} className="border border-slate-300 px-4 py-3 text-slate-700">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {section.type === 'separator' && (() => {
              const spacing = section.separatorSpacing === 'small' ? 'py-4' : section.separatorSpacing === 'large' ? 'py-12' : 'py-8';
              const style = section.separatorStyle ?? 'line';
              if (style === 'space') return <div className={spacing} aria-hidden="true" />;
              if (style === 'dotted') return <hr className={`border-0 border-t-2 border-dotted border-slate-300 ${spacing}`} />;
              return <hr className={`border-0 border-t border-slate-200 ${spacing}`} />;
            })()}
            </div>
          </section>
        ))}
      </div>

      {/* Sidebar Area */}
      {page.layout !== 'full' && (() => {
        const blocks = (page.sidebarBlocks && page.sidebarBlocks.length > 0)
          ? [...page.sidebarBlocks].sort((a, b) => a.order - b.order)
          : DEFAULT_SIDEBAR_BLOCKS;
        return (
          <aside
            className={`space-y-6 ${page.layout === 'sidebar-left' ? '-order-1' : ''}`}
            style={{ width: `${page.sidebarWidth}%`, minWidth: '280px' }}
          >
            {blocks.map((block) => (
              <SidebarBlockContent key={block.id} block={block} />
            ))}
          </aside>
        );
      })()}
    </div>
  );
}
