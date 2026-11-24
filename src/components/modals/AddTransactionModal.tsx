'use client';

import React, { useState, useEffect } from 'react';
import { useTransactionStore, PROFILES } from '@/store/useTransactionStore';
import { X } from 'lucide-react';

const ACCOUNT_DOT: Record<'hicham' | 'zouhir' | 'adnan', string> = {
  hicham: 'bg-teal-600',
  zouhir: 'bg-sky-600',
  adnan: 'bg-amber-600',
};

export const AddTransactionModal: React.FC = () => {
  const {
    isQuickAddOpen,
    closeQuickAdd,
    addTransaction,
    selectedAccount,
    quickAddStage,
    t,
  } = useTransactionStore();

  const dict = t();
  const [account, setAccount] = useState<'hicham' | 'zouhir' | 'adnan'>('hicham');
  const [kastAmount, setKastAmount] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isQuickAddOpen) {
      const def = (
        selectedAccount !== 'all' ? selectedAccount : 'hicham'
      ) as 'hicham' | 'zouhir' | 'adnan';
      setAccount(def);
      setKastAmount('');
      setReference(`GB-${Math.floor(10000 + Math.random() * 90000)}`);
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isQuickAddOpen, selectedAccount]);

  useEffect(() => {
    if (!isQuickAddOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeQuickAdd();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isQuickAddOpen, closeQuickAdd]);

  if (!isQuickAddOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(kastAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    await addTransaction({
      account,
      kastAmount: amountNum,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
      date,
      stage: quickAddStage,
    });
  };

  return (
    <div
      onClick={closeQuickAdd}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden animate-fadeIn"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {dict.addToKastTitle}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {dict.addToKastSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={closeQuickAdd}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-track)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Profile Choice */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
              {dict.accountProfile}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['hicham', 'zouhir', 'adnan'] as const).map((accKey) => {
                const p = PROFILES[accKey];
                const isSelected = account === accKey;
                return (
                  <button
                    type="button"
                    key={accKey}
                    onClick={() => setAccount(accKey)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--accent-ink)] text-[var(--accent-ink-fg)] border-transparent'
                        : 'bg-[var(--bg-track)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-current opacity-80' : ACCOUNT_DOT[accKey]
                      }`}
                    />
                    <span>{p.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              {dict.amountKastUSD}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-[var(--text-muted)]">
                $
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="1500.00"
                value={kastAmount}
                onChange={(e) => setKastAmount(e.target.value)}
                required
                autoFocus
                className="w-full pl-8 pr-3.5 py-2.5 text-base font-mono tabular-nums font-bold bg-[var(--bg-track)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--bg-surface)] transition-colors"
              />
            </div>
          </div>

          {/* Reference & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                {dict.refVoucher}
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="GB-12345"
                className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-track)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--bg-surface)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                {dict.date}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-track)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--bg-surface)] transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              {dict.notesOptional}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Madrid refund"
              className="w-full px-3 py-2 text-xs bg-[var(--bg-track)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--bg-surface)] transition-colors"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={closeQuickAdd}
              className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-track)] transition-colors cursor-pointer"
            >
              {dict.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[var(--accent-ink)] text-[var(--accent-ink-fg)] hover:opacity-90 rounded-xl active:scale-[0.98] transition-all cursor-pointer"
            >
              {dict.addTransactionBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
