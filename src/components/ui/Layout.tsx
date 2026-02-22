'use client';

import React from 'react';
import { SiteSettings, NavLink } from '@/types';
import { Menu, X, Music, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LayoutProps {
  settings: SiteSettings;
  navLinks: NavLink[];
  children: React.ReactNode;
  onLoginClick: () => void;
  isAuthenticated: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  settings,
  navLinks,
  children,
  onLoginClick,
  isAuthenticated
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const pathname = usePathname();

  const sortedLinks = [...navLinks].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Banner */}
      <div className="bg-[var(--westwood-red)] text-white text-xs py-2 px-4 flex justify-between items-center">
        <button 
          onClick={onLoginClick}
          className="ml-auto text-red-100 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:ring-offset-[var(--westwood-red)] rounded px-2 py-0.5"
          aria-label={isAuthenticated ? 'Open admin dashboard' : 'Open member login'}
        >
          {isAuthenticated ? 'Admin Dashboard' : 'Member Login'}
        </button>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 cursor-pointer group">
              <div className="w-35 h-10">
                <img src="/BannerLogo.png" alt="Westwood Community Band Logo" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                  {settings.bandName}
                </h1>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mt-0.5" style={{ color: 'var(--westwood-red)' }}>
                  Community Excellence
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {sortedLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === link.path 
                      ? 'text-slate-900 bg-slate-100 font-semibold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

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
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--westwood-red)' }}>
                <Music size={18} />
              </div>
              {settings.bandName}
            </h3>
            <p className="text-sm leading-relaxed mb-6 text-slate-400">
              Empowering local musicians and enriching our community through the universal language of music.
            </p>
            <div className="flex space-x-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-[var(--westwood-red)] transition-colors text-slate-400 hover:text-white">f</div>
              <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-pink-600 transition-colors text-slate-400 hover:text-white">i</div>
              <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-[var(--westwood-red)] transition-colors text-slate-400 hover:text-white">y</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm tracking-wide">Quick Links</h4>
            <ul className="space-y-3">
              {sortedLinks.map(link => (
                <li key={link.id}>
                  <Link 
                    href={link.path}
                    className="text-slate-400 hover:text-slate-300 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-5 text-sm tracking-wide">Connect</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-slate-400"><MapPin size={16} className="text-slate-400" /> Westwood Community Arts Center</li>
              <li className="flex items-center gap-3 text-slate-400"><Mail size={16} className="text-slate-400" /> hello@westwoodband.ca</li>
              <li className="flex items-center gap-3 text-slate-400"><Phone size={16} className="text-slate-400" /> (555) 123-4567</li>
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
