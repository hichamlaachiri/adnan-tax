'use client';

import React, { useState, useEffect } from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatUSD, formatMAD } from '@/lib/utils';
import { X, Coins, Building2 } from 'lucide-react';

export const MoveStageModal: React.FC = () => {
  const { moveModalTx, closeMoveModal, moveTransactionStage, t } = useTransactionStore();
  const dict = t();

  const [binanceAmount, setBinanceAmount] = useState<string>('');
  const [binanceFee, setBinanceFee] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<string>('9.90');
  const [cihAmount, setCihAmount] = useState<string>('');

  useEffect(() => {
    if (moveModalTx) {
      const { tx, targetStage } = moveModalTx;
      const baseUSD = tx.kastAmount || 0;

      if (targetStage === 'in_binance') {
        const fee = Number((baseUSD * 0.01).toFixed(2));
        const net = Number((baseUSD - fee).toFixed(2));
        setBinanceFee(fee.toString());
        setBinanceAmount(net.toString());
      } else if (targetStage === 'settled_cih') {
        const netUSD = tx.binanceAmount || baseUSD;
        const rate = 9.90;
        setExchangeRate(rate.toString());
        setCihAmount((netUSD * rate).toFixed(2));
      }
    }
  }, [moveModalTx]);

  if (!moveModalTx) return null;

  const { tx, targetStage } = moveModalTx;

  const handleRateChange = (rStr: string) => {
    setExchangeRate(rStr);
    const r = parseFloat(rStr);
    const base = tx.binanceAmount || tx.kastAmount;
    if (!isNaN(r) && base) {
      setCihAmount((base * r).toFixed(2));
    }
  };

  const handleCihAmountChange = (cStr: string) => {
    setCihAmount(cStr);
    const c = parseFloat(cStr);
    const base = tx.binanceAmount || tx.kastAmount;
    if (!isNaN(c) && base > 0) {
      setExchangeRate((c / base).toFixed(4));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetStage === 'in_binance') {
      await moveTransactionStage(tx.id, 'in_binance', {
        binanceAmount: parseFloat(binanceAmount) || tx.kastAmount,
        binanceFee: parseFloat(binanceFee) || 0,
      });
    } else if (targetStage === 'settled_cih') {
      await moveTransactionStage(tx.id, 'settled_cih', {
        cihAmount: parseFloat(cihAmount) || undefined,
        exchangeRate: parseFloat(exchangeRate) || 9.90,
      });
    } else {
      await moveTransactionStage(tx.id, targetStage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              targetStage === 'in_binance' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {targetStage === 'in_binance' ? <Coins className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {targetStage === 'in_binance' ? dict.transferToBinanceTitle : dict.withdrawToCIHTitle}
              </h3>
              <p className="text-[11px] text-slate-400">
                {tx.reference} • {formatUSD(tx.kastAmount)}
              </p>
            </div>
          </div>
          <button
            onClick={closeMoveModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {targetStage === 'in_binance' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.netBinanceAmount}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={binanceAmount}
                  onChange={(e) => setBinanceAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-500 mb-1">
                  {dict.transferFeeUSD}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={binanceFee}
                  onChange={(e) => setBinanceFee(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-rose-500"
                />
              </div>
            </div>
          )}

          {targetStage === 'settled_cih' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.p2pRate}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => handleRateChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  {dict.finalSettledCIH}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cihAmount}
                  onChange={(e) => handleCihAmountChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-extrabold text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl"
                  required
                />
              </div>
            </div>
          )}

          {/* Action */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeMoveModal}
              className="px-4 py-2 text-xs font-semibold text-slate-500"
            >
              {dict.cancel}
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs active:scale-95 transition-all ${
                targetStage === 'in_binance' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {dict.confirmMove}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
