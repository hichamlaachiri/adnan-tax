'use client';

import React from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { AccountId } from '@/types';
import { Language } from '@/lib/i18n';
import { Globe, FileSpreadsheet } from 'lucide-react';

export const Header: React.FC = () => {
  const { selectedAccount, setSelectedAccount, language, setLanguage, setReportOpen, t } = useTransactionStore();
  const dict = t();

  const accounts: { id: AccountId; label: string; dotColor?: string }[] = [
    { id: 'all', label: dict.allAccounts },
    { id: 'hicham', label: 'Hicham (Me)', dotColor: 'bg-emerald-500' },
    { id: 'zouhir', label: 'Zouhir', dotColor: 'bg-indigo-500' },
    { id: 'adnan', label: 'Adnan', dotColor: 'bg-amber-500' },
  ];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'es', label: 'ES', flag: '🇪🇸' },
    { code: 'ar', label: 'AR', flag: '🇲🇦' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-2">
      {/* Account Selector Pills */}
      <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700/60 shadow-xs">
        {accounts.map((acc) => {
          const isActive = selectedAccount === acc.id;
          return (
            <button
              key={acc.id}
              onClick={() => setSelectedAccount(acc.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs ring-1.5 ring-slate-900 dark:ring-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {acc.dotColor && (
                <span className={`w-2 h-2 rounded-full ${acc.dotColor}`} />
              )}
              <span>{acc.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: Report Export & Language Switcher */}
      <div className="flex items-center gap-2">
        {/* Report Button */}
        <button
          onClick={() => setReportOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full border border-slate-200 dark:border-slate-700 hover:border-blue-500 shadow-xs transition-all"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
          <span>{dict.reportBtn}</span>
        </button>

        {/* Language Switcher Buttons */}
        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <div className="pl-2 pr-1 text-slate-400">
            <Globe className="w-3.5 h-3.5" />
          </div>
          {languages.map((lang) => {
            const isActive = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs ring-1.5 ring-blue-500'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={`Switch language to ${lang.label}`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
