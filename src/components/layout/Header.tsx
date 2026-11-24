'use client';

import React from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { AccountId } from '@/types';
import { Language } from '@/lib/i18n';
import { FileText, Plus, Search, X, Sun, Moon } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    transactions,
    selectedAccount,
    setSelectedAccount,
    searchQuery,
    setSearchQuery,
    language,
    setLanguage,
    theme,
    toggleTheme,
    setReportOpen,
    openQuickAdd,
    t,
  } = useTransactionStore();

  const dict = t();

  const countForAccount = (id: AccountId) => {
    if (id === 'all') return transactions.length;
    return transactions.filter(
      (tx) =>
        tx.account === id ||
        (tx.recipient && tx.recipient.toLowerCase().includes(id.toLowerCase()))
    ).length;
  };

  const accounts: { id: AccountId; label: string; dotColor?: string }[] = [
    { id: 'all', label: dict.allAccounts },
    { id: 'hicham', label: 'Hicham', dotColor: 'bg-teal-600' },
    { id: 'zouhir', label: 'Zouhir', dotColor: 'bg-sky-600' },
    { id: 'adnan', label: 'Adnan', dotColor: 'bg-amber-600' },
  ];

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
    { code: 'ar', label: 'AR' },
  ];

  return (
    <header className="space-y-4">
      {/* Top Row: Brand & Global Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-ink)] text-[var(--accent-ink-fg)] flex items-center justify-center shadow-xs shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
              <circle cx="5" cy="12" r="2" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)] leading-tight">
              TaxFree Flow
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
              Global Blue &rarr; KAST &rarr; Binance &rarr; CIH Bank
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Theme Toggle (Light / Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="p-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Language Switcher */}
          <div
            role="group"
            aria-label="Language"
            className="inline-flex items-center p-0.5 rounded-lg bg-[var(--bg-track)] border border-[var(--border-subtle)]"
          >
            {languages.map((lang) => {
              const isActive = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>

          {/* Report Export Button */}
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>{dict.reportBtn}</span>
          </button>

          {/* Primary CTA: New Refund */}
          <button
            type="button"
            onClick={() => openQuickAdd('in_kast')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--accent-ink)] text-[var(--accent-ink-fg)] hover:opacity-90 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{dict.newRefund}</span>
          </button>
        </div>
      </div>

      {/* Second Row: Account Filter Tabs & Quick Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Account Filter */}
        <div
          role="tablist"
          aria-label="Filter by account"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-track)] border border-[var(--border-subtle)] overflow-x-auto max-w-full"
        >
          {accounts.map((acc) => {
            const isActive = selectedAccount === acc.id;
            const count = countForAccount(acc.id);
            return (
              <button
                key={acc.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setSelectedAccount(acc.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {acc.dotColor && (
                  <span className={`w-1.5 h-1.5 rounded-full ${acc.dotColor}`} />
                )}
                <span>{acc.label}</span>
                <span
                  className={`text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded-md ${
                    isActive
                      ? 'bg-[var(--bg-track)] text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={dict.searchPlaceholder}
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--border-strong)] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label={dict.clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
