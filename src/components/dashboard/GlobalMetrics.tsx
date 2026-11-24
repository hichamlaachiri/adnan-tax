'use client';

import React from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatUSD, formatMAD, formatEUR } from '@/lib/utils';

export const GlobalMetrics: React.FC = () => {
  const { getMetrics, getFilteredTransactions, t } = useTransactionStore();
  const metrics = getMetrics();
  const list = getFilteredTransactions();
  const dict = t();

  const kastCount = list.filter((tx) => tx.status === 'in_kast').length;
  const binanceCount = list.filter((tx) => tx.status === 'in_binance').length;
  const cihCount = list.filter(
    (tx) => tx.status === 'settled_cih' || tx.status === 'transferred_to_hicham'
  ).length;
  const payoutCount = list.filter((tx) => tx.status === 'final_payout').length;

  const stages = [
    {
      key: 'kast',
      step: '01',
      label: dict.totalKast,
      currency: 'USD',
      dot: 'bg-blue-600',
      value: formatUSD(metrics.totalInKastUSD),
      valueColor: 'text-[var(--text-primary)]',
      subtext: `${kastCount} ${kastCount === 1 ? 'item' : 'items'}`,
      subtextMono: false,
    },
    {
      key: 'binance',
      step: '02',
      label: dict.totalBinance,
      currency: 'USDT',
      dot: 'bg-amber-600',
      value: formatUSD(metrics.totalInBinanceUSD),
      valueColor: 'text-[var(--text-primary)]',
      subtext:
        metrics.totalFeesUSD > 0
          ? `${binanceCount} ${binanceCount === 1 ? 'item' : 'items'} · ${dict.feeDeducted} -${formatUSD(metrics.totalFeesUSD)}`
          : `${binanceCount} ${binanceCount === 1 ? 'item' : 'items'}`,
      subtextMono: false,
    },
    {
      key: 'cih',
      step: '03',
      label: dict.totalCIH,
      currency: 'MAD',
      dot: 'bg-teal-600',
      value: formatMAD(metrics.totalSettledCIHMAD),
      valueColor: 'text-teal-700 dark:text-teal-400',
      subtext: `≈ ${formatEUR(metrics.totalSettledEUR)} EUR · ${cihCount}`,
      subtextMono: true,
    },
    {
      key: 'payout',
      step: '04',
      label: dict.totalPayout,
      currency: 'MAD',
      dot: 'bg-emerald-600',
      value: formatMAD(metrics.totalFinalPayoutMAD),
      valueColor: 'text-emerald-700 dark:text-emerald-400',
      subtext: `≈ ${formatEUR(metrics.totalFinalPayoutEUR)} EUR · ${payoutCount}`,
      subtextMono: true,
    },
  ];

  return (
    <section
      aria-label="Pipeline totals"
      className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)]">
        {stages.map((stage) => (
          <div
            key={stage.key}
            className="px-5 py-4 flex flex-col justify-between gap-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${stage.dot}`} />
                <span className="text-xs font-semibold text-[var(--text-secondary)] truncate">
                  {stage.label}
                </span>
              </div>
              <span className="text-[11px] font-mono font-medium text-[var(--text-muted)] shrink-0">
                {stage.currency}
              </span>
            </div>

            <div>
              <div
                className={`text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${stage.valueColor}`}
              >
                {stage.value}
              </div>
              <p
                className={`mt-1 text-xs text-[var(--text-muted)] truncate ${
                  stage.subtextMono ? 'font-mono tabular-nums' : ''
                }`}
              >
                {stage.subtext}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
