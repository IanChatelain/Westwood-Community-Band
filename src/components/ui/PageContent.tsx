'use client';

import React, { useState } from 'react';
import { PageConfig, SidebarBlock, PageSection, SectionStyle, BuilderBlock, BlockWrapperStyle, GalleryEvent, DownloadItem, DownloadGroup, PerformanceItem } from '@/types';
import { DEFAULT_SIDEBAR_BLOCKS } from '@/constants';

/** Convert plain text (with \n) to HTML paragraphs. Pass HTML through unchanged. */
function textToHtml(text: string): string {
  if (!text) return '';
  if (/<[a-z][\s\S]*?>/i.test(text)) return text;
  return text
    .split(/\n\n+/)
    .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function blockWrapperClassesAndStyle(s?: BlockWrapperStyle): { className: string; style: React.CSSProperties } {
  if (!s) return { className: '', style: {} };
  const classes: string[] = [];
  const style: React.CSSProperties = {};
  // Width
  if (s.maxWidth === 'full') classes.push('w-full');
  else if (s.maxWidth === 'content') classes.push('max-w-4xl mx-auto w-full');
  else if (s.maxWidth === 'narrow') classes.push('max-w-2xl mx-auto w-full');
  else if (typeof s.maxWidth === 'number') {
    style.maxWidth = `${s.maxWidth}px`;
    style.marginLeft = 'auto';
    style.marginRight = 'auto';
  }
  // Height
  if (s.minHeight != null && s.minHeight > 0) style.minHeight = `${s.minHeight}px`;
  // Background
  if (s.backgroundColor) style.backgroundColor = s.backgroundColor;
  // Padding (when bg/border, content needs breathing room)
  const hasBorder = s.borderPreset === 'custom' ? (s.borderWidth ?? 0) > 0 : !!(s.borderPreset && s.borderPreset !== 'none');
  const hasBorderOrBg = s.backgroundColor || hasBorder;
  if (s.padding === 'none') classes.push('p-0');
  else if (s.padding === 'small') classes.push('p-4');
  else if (s.padding === 'medium') classes.push('p-6');
  else if (s.padding === 'large') classes.push('p-8');
  else if (!s.padding && (s.backgroundColor || hasBorderOrBg)) {
    classes.push('p-6'); // default padding when styled
  }
  // Border: preset Tailwind classes or custom inline (fallback: old borderWidth = custom)
  const preset = s.borderPreset ?? ((s.borderWidth != null && s.borderWidth > 0) ? 'custom' : 'none');
  if (preset === 'custom') {
    const bw = s.borderWidth ?? 0;
    if (bw === 0) classes.push('border-0');
    else {
      style.borderWidth = `${bw}px`;
      style.borderStyle = 'solid';
      style.borderColor = s.borderColor ?? '#e2e8f0';
    }
  } else {
    const presetMap: Record<string, string> = {
      none: 'border-0',
      subtle: 'border border-slate-200/60',
      default: 'border border-slate-300',
      muted: 'border border-slate-200',
      accent: 'border-2 border-red-800/60',
      strong: 'border-2 border-slate-400',
      ring: 'ring-1 ring-slate-900/5 ring-inset',
    };
    if (presetMap[preset]) classes.push(presetMap[preset]);
  }
  // Border radius
  if (s.borderRadius === 'none') classes.push('rounded-none');
  else if (s.borderRadius === 'sm') classes.push('rounded-lg');
  else if (s.borderRadius === 'md') classes.push('rounded-xl');
  else if (s.borderRadius === 'lg') classes.push('rounded-2xl');
  else if (!s.borderRadius && (s.backgroundColor || hasBorderOrBg)) classes.push('rounded-xl'); // default when styled
  // Shadow
  if (s.shadow === 'sm') classes.push('shadow-sm');
  else if (s.shadow === 'md') classes.push('shadow-md');
  else if (s.shadow === 'lg') classes.push('shadow-lg');
  else if (s.shadow === 'none') classes.push('shadow-none');
  return { className: classes.join(' ').trim(), style };
}
import { Calendar, ArrowRight, Mail, MapPin, Clock, Send, FileDown, ExternalLink, Music } from 'lucide-react';
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

export function SidebarBlockContent({ block }: { block: SidebarBlock }) {
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

export function BuilderBlockView({ block }: { block: BuilderBlock }) {
  if (block.type === 'richText') {
    const style = block.displayStyle ?? 'text';
    if (style === 'hero') {
      const heroH = block.heroHeightPx ?? 260;
      return (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div
            className="relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-slate-200/80 bg-gradient-to-br from-red-800 to-red-700"
            style={{ minHeight: heroH, height: heroH }}
          >
            {block.imageUrl && (
              <img src={block.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-30" alt={block.title ?? ''} />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/85 via-red-800/40 to-transparent flex items-center px-6 md:px-12">
              <div className="max-w-xl space-y-3">
                <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight tracking-tight">{block.title ?? ''}</h2>
                <div
                  className="text-sm md:text-base text-white/90 leading-relaxed line-clamp-3 prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: textToHtml(block.content) }}
                />
                <Link
                  href="/join"
                  className="inline-flex bg-white text-slate-900 hover:bg-slate-100 px-5 py-2.5 rounded-lg font-semibold shadow-md ring-1 ring-white/20 transition-all items-center gap-2 group"
                >
                  Join Us <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      );
    }
    if (style === 'header') {
      return (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="max-w-3xl">
            {block.title && (
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 border-l-4 border-red-800 pl-6">{block.title}</h3>
            )}
            <div
              className="prose prose-slate max-w-none text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: textToHtml(block.content) }}
            />
          </div>
        </section>
      );
    }
    return (
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="max-w-3xl">
          <div
            className="prose prose-slate max-w-none text-lg leading-relaxed"
            dangerouslySetInnerHTML={{ __html: textToHtml(block.content) }}
          />
        </div>
      </section>
    );
  }

  if (block.type === 'image') {
    const radius = 12;
    const padding = 8;
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
    return (
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <a
          href={block.href || '#'}
          className={classes}
          style={{ borderRadius: 999, paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10 }}
        >
          {block.label}
        </a>
      </section>
    );
  }

  return null;
}

function GallerySection({ section, pageSlug }: { section: PageSection; pageSlug: string }) {
  const hasEvents = section.galleryEvents && section.galleryEvents.length > 0;
  const basePath = pageSlug === '/' ? '' : pageSlug;

  const cols = section.galleryColumns ?? 3;
  const cardSize = section.galleryCardSize ?? 'md';
  const thumbAspect = section.galleryThumbnailAspect ?? 'landscape';
  const showDesc = section.galleryShowDescription ?? true;

  const gridColsClass: Record<number, string> = {
    2: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6',
    3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
    4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6',
  };

  const cardPadding: Record<string, string> = {
    sm: 'p-2.5',
    md: 'p-4',
    lg: 'p-6',
  };

  const titleSize: Record<string, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const descSize: Record<string, string> = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-sm',
  };

  const aspectClass = thumbAspect === 'square' ? 'aspect-square' : 'aspect-[4/3]';

  return (
    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm ring-1 ring-slate-900/5" style={section.minHeight ? { minHeight: section.minHeight } : undefined}>
      <h3 className="text-2xl font-bold text-slate-900 mb-8 border-l-4 border-red-800 pl-6">{section.title}</h3>
      {hasEvents ? (
        <div className={gridColsClass[cols] ?? gridColsClass[3]}>
          {section.galleryEvents!.map((ev) => (
            <Link
              key={ev.id}
              href={`${basePath}/${ev.slug}`}
              className="group block rounded-xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all bg-white"
            >
              <div className={`${aspectClass} bg-slate-100 overflow-hidden`}>
                {ev.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ev.coverImageUrl}
                    alt={ev.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : ev.media.length > 0 && ev.media[0].type === 'image' && ev.media[0].url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ev.media[0].url}
                    alt={ev.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </div>
                )}
              </div>
              <div className={cardPadding[cardSize]}>
                <h4 className={`font-semibold text-slate-900 group-hover:text-red-800 transition-colors ${titleSize[cardSize]}`}>{ev.title}</h4>
                {showDesc && ev.description && <p className={`${descSize[cardSize]} text-slate-500 mt-1 line-clamp-2`}>{ev.description}</p>}
                {ev.media.length > 0 && (
                  <p className="text-xs text-slate-400 mt-2">{ev.media.length} {ev.media.length === 1 ? 'item' : 'items'}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : section.content && section.content.includes('•') ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {section.content.split('•').filter(Boolean).map((item, i) => (
            <div key={i} className="bg-slate-50 p-4 rounded-xl hover:bg-slate-100 hover:ring-2 hover:ring-slate-200 transition-all cursor-pointer group">
              <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{item.trim()}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-60"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          <p className="text-sm">No events yet. Add events via the admin panel.</p>
        </div>
      )}
    </div>
  );
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
        {hasBlocks && page.blocks!.map((block) => {
          const { className, style } = blockWrapperClassesAndStyle(block.wrapperStyle);
          return (
            <div key={block.id} className={className || undefined} style={Object.keys(style).length ? style : undefined}>
              <BuilderBlockView block={block} />
            </div>
          );
        })}

        {!hasBlocks && page.sections.map((section) => {
          const sectionStyle: React.CSSProperties = {};
          if (section.maxWidth && section.maxWidth < 100) {
            sectionStyle.maxWidth = `${section.maxWidth}%`;
            sectionStyle.marginLeft = 'auto';
            sectionStyle.marginRight = 'auto';
            sectionStyle.width = '100%';
          }
          const heroH = section.minHeight && section.minHeight > 0 ? section.minHeight : 260;
          return (
          <section key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={sectionStyle}>
            <div className={sectionWrapperClasses(section.style)}>
            {section.type === 'hero' && (
              <div className="relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-slate-200/80 bg-gradient-to-br from-red-800 to-red-700" style={{ height: heroH }}>
                {section.imageUrl && (
                  <img src={section.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-30" alt={section.title} />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-red-900/85 via-red-800/40 to-transparent flex items-center px-6 md:px-12">
                  <div className="max-w-xl space-y-3">
                    <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight tracking-tight">{section.title}</h2>
                    <div
                      className="text-sm md:text-base text-white/90 leading-relaxed line-clamp-3 prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: textToHtml(section.content) }}
                    />
                    <Link 
                      href="/join"
                      className="inline-flex bg-white text-slate-900 hover:bg-slate-100 px-5 py-2.5 rounded-lg font-semibold shadow-md ring-1 ring-white/20 transition-all items-center gap-2 group"
                    >
                      Join Us <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {section.type === 'text' && (
              <div className="max-w-3xl" style={section.minHeight ? { minHeight: section.minHeight } : undefined}>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 border-l-4 border-red-800 pl-6">{section.title}</h3>
                <div
                  className="prose prose-slate max-w-none text-lg leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: textToHtml(section.content) }}
                />
              </div>
            )}

            {section.type === 'image-text' && (() => {
              const { wrapper, image } = imageLayoutClasses(section.style);
              return (
                <div className={wrapper} style={section.minHeight ? { minHeight: section.minHeight } : undefined}>
                  {section.imageUrl && (
                    <div className={`rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-900/10 bg-slate-100 aspect-[4/3] ${image}`}>
                      <img src={section.imageUrl} className="w-full h-full object-cover" alt={section.title} />
                    </div>
                  )}
                  <div className="space-y-5">
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900">{section.title}</h3>
                    <div
                      className="prose prose-slate max-w-none text-base leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: textToHtml(section.content) }}
                    />
                  </div>
                </div>
              );
            })()}

            {section.type === 'gallery' && (
              <GallerySection section={section} pageSlug={page.slug} />
            )}

            {section.type === 'contact' && (
              <div style={section.minHeight ? { minHeight: section.minHeight } : undefined}>
                <ContactSection section={section} />
              </div>
            )}

            {section.type === 'schedule' && (
              <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm ring-1 ring-slate-900/5" style={section.minHeight ? { minHeight: section.minHeight } : undefined}>
                <h3 className="text-2xl font-bold text-slate-900 text-center mb-4 flex items-center justify-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Calendar className="text-slate-700" size={24}/>
                  </div>
                  {section.title}
                </h3>
                {section.content ? (
                  <div
                    className="text-slate-600 text-center prose prose-slate prose-sm mx-auto"
                    dangerouslySetInnerHTML={{ __html: textToHtml(section.content) }}
                  />
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Calendar className="mx-auto mb-3 opacity-50" size={36}/>
                    <p className="text-sm">No schedule information yet. Add details via the admin panel.</p>
                  </div>
                )}
              </div>
            )}

            {section.type === 'performances' && (
              <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm ring-1 ring-slate-900/5" style={section.minHeight ? { minHeight: section.minHeight } : undefined}>
                <h3 className="text-2xl font-bold text-slate-900 mb-8 border-l-4 border-red-800 pl-6">{section.title}</h3>
                {section.performanceItems && section.performanceItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {section.performanceItems.map((perf) => (
                      <div key={perf.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5 hover:shadow-md hover:border-slate-300 transition-all">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-800 text-white">
                            <Calendar size={12} />
                            {perf.date}
                          </span>
                          {perf.time && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                              <Clock size={11} />
                              {perf.time}
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-1">{perf.title}</h4>
                        {perf.venue && (
                          <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-2">
                            <MapPin size={13} className="flex-shrink-0" />
                            {perf.venue}
                          </p>
                        )}
                        {perf.description && (
                          <p className="text-sm text-slate-600 leading-relaxed">{perf.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Music className="mx-auto mb-3 opacity-50" size={36} />
                    <p className="text-sm">No performances scheduled yet. Add events via the admin panel.</p>
                  </div>
                )}
              </div>
            )}

            {section.type === 'table' && section.tableData && (
              <div className="overflow-x-auto" style={section.minHeight ? { minHeight: section.minHeight } : undefined}>
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

            {section.type === 'downloads' && (
              <div style={section.minHeight ? { minHeight: section.minHeight } : undefined}>
                {section.title && <h3 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-red-800 pl-6">{section.title}</h3>}
                {section.content && (
                  <div className="text-slate-600 mb-6 prose prose-slate prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: textToHtml(section.content) }} />
                )}

                {/* Grouped downloads (e.g. newsletter by season) */}
                {section.downloadGroups && section.downloadGroups.length > 0 && (
                  <div className="space-y-8">
                    {section.downloadGroups.map((group, gi) => (
                      <div key={gi}>
                        <h4 className="text-lg font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-200">{group.title}</h4>
                        <ul className="space-y-2">
                          {group.items.map((item, ii) => (
                            <li key={ii} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                              <span className="font-medium text-slate-700">{item.label}</span>
                              {item.url && (
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-red-800 hover:text-red-900 hover:underline">
                                  <FileDown size={14} /> Download
                                </a>
                              )}
                              {item.links && item.links.length > 0 && (
                                <span className="flex items-center gap-2">
                                  {item.links.map((link, li) => (
                                    <a key={li} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-red-800 hover:text-red-900 hover:underline">
                                      <FileDown size={14} /> {link.label}
                                    </a>
                                  ))}
                                </span>
                              )}
                              {item.description && <span className="text-sm text-slate-500 basis-full">{item.description}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Flat downloads list (documents, samples/recordings) */}
                {section.downloadItems && section.downloadItems.length > 0 && (() => {
                  const hasDuration = section.downloadItems.some((it) => it.duration);
                  const hasSize = section.downloadItems.some((it) => it.fileSize);
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b-2 border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                            <th className="py-3 px-3">Name</th>
                            {hasSize && <th className="py-3 px-3 hidden sm:table-cell">Size</th>}
                            {hasDuration && <th className="py-3 px-3 hidden sm:table-cell">Duration</th>}
                            <th className="py-3 px-3 text-right">Download</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {section.downloadItems.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors group">
                              <td className="py-3.5 px-3">
                                <span className="font-medium text-slate-800">{item.label}</span>
                                {item.description && <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>}
                              </td>
                              {hasSize && (
                                <td className="py-3.5 px-3 text-xs text-slate-400 whitespace-nowrap hidden sm:table-cell">
                                  {item.fileSize ?? '\u2014'}
                                </td>
                              )}
                              {hasDuration && (
                                <td className="py-3.5 px-3 text-xs text-slate-400 whitespace-nowrap hidden sm:table-cell">
                                  {item.duration ?? '\u2014'}
                                </td>
                              )}
                              <td className="py-3.5 px-3 text-right">
                                {item.url ? (
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-red-800 hover:text-red-900 hover:underline">
                                    <FileDown size={14} /> Download
                                  </a>
                                ) : (
                                  <span className="text-xs text-slate-400">&mdash;</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
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
          );
        })}
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
