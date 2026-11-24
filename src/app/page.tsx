'use client';

import React, { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { GlobalMetrics } from '@/components/dashboard/GlobalMetrics';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { MoveStageModal } from '@/components/modals/MoveStageModal';
import { ProofModal } from '@/components/modals/ProofModal';
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
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col font-sans">
      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 flex-1">
        <Header />
        <GlobalMetrics />
        <section aria-label="Refund pipeline">
          <KanbanBoard />
        </section>
      </main>

      <AddTransactionModal />
      <MoveStageModal />
      <ProofModal />
      <ReportModal />
    </div>
  );
}
