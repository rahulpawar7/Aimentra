'use client';
import React from 'react';
import { Menu, Bell, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';

interface DashboardTopBarProps {
  title?: string;
  onMenuClick: () => void;
}

export default function DashboardTopBar({ title = 'Dashboard', onMenuClick }: DashboardTopBarProps) {
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <header className="h-16 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 backdrop-blur-md bg-opacity-80">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-md transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="max-w-[40vw] truncate text-base font-semibold text-[var(--text-primary)] sm:max-w-none sm:text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--brand-700)] hover:bg-[var(--bg-elevated)] rounded-full transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--brand-500)] rounded-full border border-[var(--bg-surface)]"></span>
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 pl-1 pr-3 hover:bg-[var(--bg-elevated)] rounded-full transition-colors border border-transparent hover:border-[var(--border-subtle)]"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--navy-800)] flex items-center justify-center text-white text-sm font-bold shadow-md">
              {user?.name?.[0] || 'U'}
            </div>
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] hidden sm:block" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-xl z-50 overflow-hidden animate-fade-up">
                <div className="py-2 px-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.name || 'Student'}</p>
                </div>
                <div className="py-1">
                  <Link 
                    href="/dashboard/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <Link 
                    href="/dashboard/security"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-[var(--bg-elevated)]"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
