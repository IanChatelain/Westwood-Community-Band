'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { SiteSettings, NavLink, User } from '@/types';
import { Menu, X, Music, Mail, Phone, MapPin, ChevronDown, LogOut, LayoutDashboard, LogIn, Facebook, Instagram, Youtube } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LayoutProps {
  settings: SiteSettings;
  navLinks: NavLink[];
  children: React.ReactNode;
  onLoginClick: () => void;
  isAuthenticated: boolean;
  currentUser?: User | null;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  settings,
  navLinks,
  children,
  onLoginClick,
  isAuthenticated,
  currentUser,
  onLogout,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const closeUserMenu = useCallback(() => setIsUserMenuOpen(false), []);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        closeUserMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, closeUserMenu]);

  const sortedLinks = [...navLinks].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm" style={{ borderTopWidth: 3, borderTopStyle: 'solid', borderTopColor: 'var(--westwood-red)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0">
              <div className="relative w-[100px] sm:w-[140px] h-10 sm:h-12 flex-shrink-0">
                <Image src="/BannerLogo.png" alt="Westwood Community Band Logo" fill className="object-contain object-left" sizes="(max-width: 640px) 100px, 140px" priority />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight leading-none truncate">
                  {settings.bandName}
                </h1>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mt-0.5 hidden sm:block" style={{ color: 'var(--westwood-red)' }}>
                  Community Excellence
                </p>
              </div>
            </Link>

            {/* Desktop Nav + Auth */}
            <div className="hidden md:flex items-center gap-1">
              <nav className="flex items-center gap-1">
                {sortedLinks.map((link) => (
                  <Link
                    key={link.id}
                    href={link.path}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      pathname === link.path
                        ? 'text-[var(--westwood-red)] bg-red-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="ml-3 pl-3 border-l border-slate-200" ref={userMenuRef}>
                {isAuthenticated && currentUser ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen((v) => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--westwood-red)] focus:ring-offset-1"
                    >
                      {currentUser.username}
                      <ChevronDown size={14} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <Link
                          href="/admin"
                          onClick={closeUserMenu}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <LayoutDashboard size={15} className="text-slate-400" />
                          Admin Dashboard
                        </Link>
                        {onLogout && (
                          <button
                            type="button"
                            onClick={() => { closeUserMenu(); onLogout(); }}
                            className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <LogOut size={15} className="text-slate-400" />
                            Log out
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onLoginClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--westwood-red)] text-[var(--westwood-red)] hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--westwood-red)] focus:ring-offset-1"
                  >
                    <LogIn size={14} />
                    Member Login
                  </button>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 px-4 pt-2 pb-4 space-y-1 shadow-xl">
            {sortedLinks.map((link) => (
              <Link
                key={link.id}
                href={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  pathname === link.path
                    ? 'bg-red-50 text-[var(--westwood-red)] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-slate-200 pt-3 mt-2 space-y-1">
              {isAuthenticated && currentUser ? (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <LayoutDashboard size={18} className="text-slate-400" />
                    Admin Dashboard
                  </Link>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => { setIsMenuOpen(false); onLogout(); }}
                      className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <LogOut size={18} className="text-slate-400" />
                      Log out
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { setIsMenuOpen(false); onLoginClick(); }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-base font-semibold border-2 border-[var(--westwood-red)] text-[var(--westwood-red)] hover:bg-red-50 transition-colors"
                >
                  <LogIn size={18} />
                  Member Login
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--westwood-red)' }}>
                <Music size={18} />
              </div>
              {settings.bandName}
            </h3>
            {(settings.footerTagline) && (
              <p className="text-sm leading-relaxed mb-6 text-slate-400">
                {settings.footerTagline}
              </p>
            )}
            <div className="flex space-x-3">
              {settings.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-[var(--westwood-red)] transition-colors text-slate-400 hover:text-white" aria-label="Facebook">
                  <Facebook size={18} />
                </a>
              )}
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-pink-600 transition-colors text-slate-400 hover:text-white" aria-label="Instagram">
                  <Instagram size={18} />
                </a>
              )}
              {settings.youtubeUrl && (
                <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-[var(--westwood-red)] transition-colors text-slate-400 hover:text-white" aria-label="YouTube">
                  <Youtube size={18} />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-5 text-sm tracking-wide">Connect</h4>
            <ul className="space-y-3 text-sm">
              {settings.contactAddress && (
                <li className="flex items-center gap-3 text-slate-400"><MapPin size={16} className="shrink-0 text-slate-400" /> {settings.contactAddress}</li>
              )}
              <li className="flex items-center gap-3">
                <Mail size={16} className="shrink-0 text-slate-400" />
                <Link href={settings.contactPageSlug || '/contact'} className="text-slate-400 hover:text-slate-300 transition-colors">
                  Contact Us
                </Link>
              </li>
              {settings.contactPhone && (
                <li className="flex items-center gap-3 text-slate-400"><Phone size={16} className="shrink-0 text-slate-400" /> {settings.contactPhone}</li>
              )}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          {settings.footerText}
        </div>
      </footer>
    </div>
  );
};

export default Layout;
