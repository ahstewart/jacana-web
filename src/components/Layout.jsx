// src/components/Layout.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { PlusIcon, Bars3Icon, XMarkIcon, UserIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const GitHubIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);
import Button from './Button';
import { useAuth } from '../lib/authContext';

export const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Navigation links
  const navLinks = [
    { label: 'Home',   path: '/',       exact: true  },
    { label: 'Browse Models', path: '/browse', exact: false },
  ];

  const learnLinks = [
    { label: 'Get Started', path: '/get-started' },
    { label: 'Docs',        path: '/docs'        },
  ];

  const isActive = (path, exact) => {
    if (exact || path === '/') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      setUserMenuOpen(false);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* TOP NAVIGATION BAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left Side: Logo */}
            <div className="flex items-center gap-3 flex-1">
              <Link to="/" className="flex items-center group">
                <img
                  src="/logo-with-name.png"
                  alt="Jacana"
                  className="h-14 w-auto transition-all duration-200 group-hover:scale-105 drop-shadow-sm"
                />
              </Link>
            </div>

            {/* Center: Navigation Links (Desktop) */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.path, link.exact)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Learn dropdown */}
              <div className="relative group">
                <button
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    learnLinks.some((l) => isActive(l.path, false))
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Learn
                  <ChevronDownIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
                </button>
                <div className="absolute left-0 top-full pt-1 hidden group-hover:block z-50">
                  <div className="bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[140px]">
                    {learnLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`block px-4 py-2 text-sm font-medium transition-colors ${
                          isActive(link.path, false)
                            ? 'text-primary-600 bg-primary-50'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Side: GitHub + CTA + Avatar */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <a
                href="https://github.com/ahstewart/jacana-flutter"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-medium transition-all duration-200"
              >
                <GitHubIcon className="h-3.5 w-3.5" />
                Check out the code
              </a>
              {!user ? (
                <>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex gap-2"
                    onClick={() => navigate('/auth/login')}
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="primary"
                    size="sm"
                    className="hidden sm:flex gap-2"
                    onClick={() => navigate('/auth/signup')}
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Sign Up</span>
                  </Button>
                </>
              ) : (
                <>
                  {/* User Menu */}
                  <div className="relative">
                    <button 
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </button>

                    {/* Dropdown Menu */}
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-xs text-slate-600">Signed in as</p>
                          <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
                        </div>
                        <button
                          onClick={() => { navigate('/models/create'); setUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <PlusIcon className="h-4 w-4" />
                            New Model
                          </div>
                        </button>
                        <div className="border-t border-slate-100 my-1" />
                        <Link
                          to="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>
                            Dashboard
                          </div>
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            Account Settings
                          </div>
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-all"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-5 w-5" />
                ) : (
                  <Bars3Icon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 py-4 space-y-2 animate-slide-up">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.path, link.exact)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* GitHub in mobile */}
              <a
                href="https://github.com/ahstewart/jacana-flutter"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
              >
                <GitHubIcon className="h-4 w-4" />
                Check out the code
              </a>

              {/* Learn section in mobile */}
              <div className="pt-1">
                <p className="px-4 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Learn</p>
                {learnLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(link.path, false)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              {!user && (
                <>
                  <Link
                    to="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full block text-center bg-slate-100 text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-200 transition text-sm font-medium mt-3"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full block text-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children || <Outlet />}
      </main>

      {/* FOOTER */}
      <footer className="bg-dark mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="mb-2">
                <img src="/logo-with-name.png" alt="Jacana" className="h-12 w-auto brightness-0 invert" />
              </div>
              <p className="text-sm text-slate-400">Download and run mobile-optimized AI models.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Navigation</h4>
              <ul className="space-y-1.5 text-sm">
                <li><Link to="/" className="text-slate-300 hover:text-white transition">Home</Link></li>
                <li><Link to="/browse" className="text-slate-300 hover:text-white transition">Browse Models</Link></li>
                <li><Link to="/get-started" className="text-slate-300 hover:text-white transition">Get Started</Link></li>
                <li><Link to="/docs" className="text-slate-300 hover:text-white transition">Docs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">About</h4>
              <p className="text-sm text-slate-400">A platform for sharing and discovering mobile-optimized AI models for edge devices.</p>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-5 pt-5 flex justify-between items-center">
            <p className="text-sm text-slate-400">© 2026 Jacana. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-slate-300 hover:text-white transition">Privacy</a>
              <a href="#" className="text-slate-300 hover:text-white transition">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};