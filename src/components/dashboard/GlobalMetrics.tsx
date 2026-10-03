'use client';

import React from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatUSD, formatMAD } from '@/lib/utils';
import { Wallet, Coins, Building2, UserCheck } from 'lucide-react';

export const GlobalMetrics: React.FC = () => {
  const { getMetrics, t } = useTransactionStore();
  const metrics = getMetrics();
  const dict = t();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Total in KAST */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/60">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {dict.step1Tag}
              </span>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {dict.totalKast}
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
            USD
          </span>
        </div>

        <div className="mt-3">
          <div className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatUSD(metrics.totalInKastUSD)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
            {dict.kastSubtitle}
          </p>
        </div>
      </div>

      {/* 2. Total in Binance */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/60">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {dict.step2Tag}
              </span>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {dict.totalBinance}
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
            USDT
          </span>
        </div>

        <div className="mt-3">
          <div className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatUSD(metrics.totalInBinanceUSD)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
            {dict.binanceSubtitle}
          </p>
        </div>
      </div>

      {/* 3. Total in CIH Bank */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {dict.step3Tag}
              </span>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {dict.totalCIH}
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
            MAD
          </span>
        </div>

        <div className="mt-3">
          <div className="text-xl lg:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatMAD(metrics.totalSettledCIHMAD)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            {dict.cihSubtitle}
          </p>
        </div>
      </div>

      {/* 4. Total Final Payouts */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/60">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {dict.step4Tag}
              </span>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {dict.totalPayout}
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
            Delivered
          </span>
        </div>

        <div className="mt-3">
          <div className="text-xl lg:text-2xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">
            {formatMAD(metrics.totalFinalPayoutMAD)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
            {dict.payoutSubtitle}
          </p>
        </div>
      </div>
    </div>
  );
};
