'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { isAdminRole, getAppHome } from '@/lib/auth-utils';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/brand';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
    { name: 'Packages', href: '/packages' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] py-3 shadow-[var(--shadow-card)]">
      <div className="container mx-auto flex items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="z-50 flex min-w-0 items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-[var(--brand-500)] text-sm font-extrabold text-[var(--navy-900)]">
            {BRAND.monogram}
          </div>
          <span className="truncate text-lg font-extrabold tracking-tight text-[var(--navy-900)] sm:text-xl">
            {BRAND.nameUpper}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex xl:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'text-[var(--brand-700)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--navy-900)]'
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="hidden items-center gap-3 lg:flex">
          {!isAuthenticated ? (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" leftIcon={<LogIn className="h-4 w-4" />}>
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="brand" size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <Avatar
                  src={user?.avatar}
                  alt={user?.name || 'User'}
                  size="sm"
                  className="ring-2 ring-[var(--border-subtle)] transition-all hover:ring-[var(--brand-400)]"
                />
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-card)] py-1 shadow-[var(--shadow-elevated)]">
                    <div className="border-b border-[var(--border-subtle)] px-4 py-2">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{user?.name}</p>
                      <p className="truncate text-xs text-[var(--text-muted)]">{user?.email}</p>
                    </div>
                    <Link
                      href={isAdminRole(user?.role) ? '/admin' : '/dashboard'}
                      className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--brand-700)]"
                    >
                      {isAdminRole(user?.role) ? 'Admin Panel' : 'Dashboard'}
                    </Link>
                    {!isAdminRole(user?.role) && (
                      <Link
                        href="/dashboard/profile"
                        className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--brand-700)]"
                      >
                        Profile
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="z-50 p-2 text-[var(--navy-900)] focus:outline-none lg:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'fixed inset-0 top-[57px] z-40 flex flex-col items-center justify-center gap-6 bg-[var(--bg-surface)] transition-all duration-300',
          isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
        )}
      >
        <nav className="flex flex-col items-center gap-6 text-lg">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'font-semibold transition-colors',
                pathname === link.href ? 'text-[var(--brand-700)]' : 'text-[var(--text-secondary)]'
              )}
            >
              {link.name}
            </Link>
          ))}

          <div className="my-2 h-px w-16 bg-[var(--border-subtle)]" />

          {!isAuthenticated ? (
            <div className="flex w-full flex-col items-center gap-4 px-8">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2 text-center text-base text-[var(--text-secondary)]"
              >
                Login
              </Link>
              <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                <Button variant="brand" className="w-full" size="lg">
                  Get Started
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Link
                href={isAdminRole(user?.role) ? '/admin' : '/dashboard'}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[var(--text-secondary)]"
              >
                {isAdminRole(user?.role) ? 'Admin Panel' : 'Dashboard'}
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="font-medium text-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
