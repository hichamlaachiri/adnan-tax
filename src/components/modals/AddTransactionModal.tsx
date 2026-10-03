'use client';

import React, { useState, useEffect } from 'react';
import { useTransactionStore, PROFILES } from '@/store/useTransactionStore';
import { X, Plus, Wallet } from 'lucide-react';

export const AddTransactionModal: React.FC = () => {
  const {
    isQuickAddOpen,
    closeQuickAdd,
    addTransaction,
    selectedAccount,
    quickAddStage,
    t
  } = useTransactionStore();

  const dict = t();
  const [account, setAccount] = useState<'hicham' | 'zouhir' | 'adnan'>('hicham');
  const [kastAmount, setKastAmount] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isQuickAddOpen) {
      const def = (selectedAccount !== 'all' ? selectedAccount : 'hicham') as 'hicham' | 'zouhir' | 'adnan';
      setAccount(def);
      setKastAmount('');
      setReference(`GB-${Math.floor(10000 + Math.random() * 90000)}`);
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isQuickAddOpen, selectedAccount]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {dict.addToKastTitle}
              </h3>
              <p className="text-[11px] text-slate-400">{dict.addToKastSubtitle}</p>
            </div>
          </div>
          <button
            onClick={closeQuickAdd}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Profile Choice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{p.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {dict.amountKastUSD}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="1500.00"
                value={kastAmount}
                onChange={(e) => setKastAmount(e.target.value)}
                required
                autoFocus
                className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Reference & Date */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {dict.refVoucher}
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="GB-12345"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {dict.date}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {dict.notesOptional}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Madrid refund"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeQuickAdd}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              {dict.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs active:scale-95 transition-all"
            >
              {dict.addTransactionBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
