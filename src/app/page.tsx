'use client';

import React, { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { GlobalMetrics } from '@/components/dashboard/GlobalMetrics';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { MoveStageModal } from '@/components/modals/MoveStageModal';
import { ReportModal } from '@/components/modals/ReportModal';
import { useTransactionStore } from '@/store/useTransactionStore';

export default function Home() {
  const { initStore } = useTransactionStore();

  useEffect(() => {
    const cleanup = initStore();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [initStore]);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5 flex-1">
        {/* 1. Account Selector Pills, Report Export, Language */}
        <Header />

        {/* 2. Four Summary Cards (KAST, Binance, CIH Bank, Final Payouts) */}
        <GlobalMetrics />

        {/* 3. 4-Column Pipeline Board with Drag & Drop */}
        <section className="pt-2">
          <KanbanBoard />
        </section>
      </main>

      {/* Modals */}
      <AddTransactionModal />
      <MoveStageModal />
      <ReportModal />
    </div>
  );
}
