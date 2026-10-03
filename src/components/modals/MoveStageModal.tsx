'use client';

import React, { useState, useEffect } from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatUSD, formatMAD, formatEUR } from '@/lib/utils';
import { X, Coins, Building2, UserCheck, Euro } from 'lucide-react';

export const MoveStageModal: React.FC = () => {
  const { moveModalTx, closeMoveModal, moveTransactionStage, lastEurRate, t } = useTransactionStore();
  const dict = t();

  // Step 2: Binance
  const [binanceAmount, setBinanceAmount] = useState<string>('');
  const [binanceFee, setBinanceFee] = useState<string>('');

  // Step 3: CIH
  const [exchangeRate, setExchangeRate] = useState<string>('9.90');
  const [cihAmount, setCihAmount] = useState<string>('');
  const [eurRate, setEurRate] = useState<string>(lastEurRate?.toString() || '10.85');
  const [eurAmount, setEurAmount] = useState<string>('');

  // Step 4: Final Payout
  const [recipient, setRecipient] = useState<string>('');
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<string>('Bank Transfer / Cash');

  useEffect(() => {
    if (moveModalTx) {
      const { tx, targetStage } = moveModalTx;
      const baseUSD = tx.kastAmount || 0;

      if (targetStage === 'in_binance') {
        const defaultFee = Number((baseUSD * 0.01).toFixed(2));
        const defaultNet = Number((baseUSD - defaultFee).toFixed(2));
        setBinanceFee(tx.binanceFee?.toString() || defaultFee.toString());
        setBinanceAmount(tx.binanceAmount?.toString() || defaultNet.toString());
      } else if (targetStage === 'settled_cih') {
        const netUSD = tx.binanceAmount || baseUSD;
        const rate = tx.exchangeRate || 9.90;
        const eRate = tx.eurRate || lastEurRate || 10.85;
        const cAmt = tx.cihAmount ? tx.cihAmount : Number((netUSD * rate).toFixed(2));
        setExchangeRate(rate.toString());
        setCihAmount(cAmt.toString());
        setEurRate(eRate.toString());
        setEurAmount((cAmt / eRate).toFixed(2));
      } else if (targetStage === 'final_payout') {
        const defaultRecipient = tx.account === 'adnan' ? 'Adnan' : tx.account === 'zouhir' ? 'Zouhir' : 'Hicham';
        setRecipient(tx.recipient || defaultRecipient);
        const amtMAD = tx.cihAmount || (tx.kastAmount * 9.90);
        setPayoutAmount(tx.payoutAmount ? tx.payoutAmount.toString() : amtMAD.toFixed(2));
        setPayoutMethod(tx.payoutMethod || 'Bank Transfer / Cash');
      }
    }
  }, [moveModalTx, lastEurRate]);

  if (!moveModalTx) return null;

  const { tx, targetStage } = moveModalTx;
  const baseUSD = tx.kastAmount || 0;

  // Auto calculate fee when typing Binance net amount
  const handleBinanceNetChange = (netStr: string) => {
    setBinanceAmount(netStr);
    const net = parseFloat(netStr);
    if (!isNaN(net) && baseUSD >= net) {
      setBinanceFee((baseUSD - net).toFixed(2));
    }
  };

  // Auto calculate Binance net amount when typing fee
  const handleBinanceFeeChange = (feeStr: string) => {
    setBinanceFee(feeStr);
    const fee = parseFloat(feeStr);
    if (!isNaN(fee) && baseUSD >= fee) {
      setBinanceAmount((baseUSD - fee).toFixed(2));
    }
  };

  const handleRateChange = (rStr: string) => {
    setExchangeRate(rStr);
    const r = parseFloat(rStr);
    const base = tx.binanceAmount || tx.kastAmount;
    if (!isNaN(r) && base) {
      const calculatedMAD = Number((base * r).toFixed(2));
      setCihAmount(calculatedMAD.toString());
      const eR = parseFloat(eurRate);
      if (!isNaN(eR) && eR > 0) {
        setEurAmount((calculatedMAD / eR).toFixed(2));
      }
    }
  };

  const handleCihAmountChange = (cStr: string) => {
    setCihAmount(cStr);
    const c = parseFloat(cStr);
    const base = tx.binanceAmount || tx.kastAmount;
    if (!isNaN(c) && base > 0) {
      setExchangeRate((c / base).toFixed(4));
    }
    const eR = parseFloat(eurRate);
    if (!isNaN(c) && !isNaN(eR) && eR > 0) {
      setEurAmount((c / eR).toFixed(2));
    }
  };

  const handleEurRateChange = (eStr: string) => {
    setEurRate(eStr);
    const eR = parseFloat(eStr);
    const c = parseFloat(cihAmount);
    if (!isNaN(eR) && eR > 0 && !isNaN(c)) {
      setEurAmount((c / eR).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetStage === 'in_binance') {
      const net = parseFloat(binanceAmount) || tx.kastAmount;
      const fee = parseFloat(binanceFee) ?? Number((tx.kastAmount - net).toFixed(2));
      await moveTransactionStage(tx.id, 'in_binance', {
        binanceAmount: net,
        binanceFee: fee,
      });
    } else if (targetStage === 'settled_cih') {
      const cihA = parseFloat(cihAmount) || undefined;
      const eR = parseFloat(eurRate) || 10.85;
      const eurA = cihA ? Number((cihA / eR).toFixed(2)) : undefined;
      await moveTransactionStage(tx.id, 'settled_cih', {
        cihAmount: cihA,
        exchangeRate: parseFloat(exchangeRate) || 9.90,
        eurRate: eR,
        eurAmount: eurA,
      });
    } else if (targetStage === 'final_payout') {
      await moveTransactionStage(tx.id, 'final_payout', {
        recipient: recipient.trim() || 'Partner',
        payoutAmount: parseFloat(payoutAmount) || (tx.cihAmount ?? 0),
        payoutMethod,
        payoutDate: new Date().toISOString().split('T')[0],
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
              targetStage === 'in_binance' 
                ? 'bg-amber-50 text-amber-600' 
                : targetStage === 'settled_cih'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-purple-50 text-purple-600'
            }`}>
              {targetStage === 'in_binance' && <Coins className="w-4 h-4" />}
              {targetStage === 'settled_cih' && <Building2 className="w-4 h-4" />}
              {targetStage === 'final_payout' && <UserCheck className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {targetStage === 'in_binance' && dict.transferToBinanceTitle}
                {targetStage === 'settled_cih' && dict.withdrawToCIHTitle}
                {targetStage === 'final_payout' && dict.finalPayoutTitle}
              </h3>
              <p className="text-[11px] text-slate-400">
                {tx.reference} • KAST: {formatUSD(tx.kastAmount)}
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
          {/* STEP 2: Binance with dynamic auto fee */}
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
                  onChange={(e) => handleBinanceNetChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-500 mb-1">
                  {dict.transferFeeUSD} (KAST ${baseUSD.toFixed(2)} - Net)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={binanceFee}
                  onChange={(e) => handleBinanceFeeChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          {/* STEP 3: CIH Bank + Euro Manual Conversion */}
          {targetStage === 'settled_cih' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    USD Rate (MAD/USD)
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
                  <label className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                    💶 EUR Rate (MAD/EUR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={eurRate}
                    onChange={(e) => handleEurRateChange(e.target.value)}
                    placeholder="10.85"
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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

              {/* Real-time Euro equivalent badge */}
              {eurAmount && parseFloat(eurAmount) > 0 && (
                <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between text-xs">
                  <span className="text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1">
                    <Euro className="w-3.5 h-3.5" />
                    {dict.eurEquivalent}:
                  </span>
                  <span className="text-sm font-extrabold font-mono text-blue-700 dark:text-blue-300">
                    {formatEUR(parseFloat(eurAmount))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Final Payout / Destination */}
          {targetStage === 'final_payout' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {dict.recipientLabel}
                </label>
                <div className="flex gap-2 mb-2">
                  {['Adnan', 'Zouhir', 'Hicham', 'Cash Payout'].map((name) => (
                    <button
                      type="button"
                      key={name}
                      onClick={() => setRecipient(name)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                        recipient === name
                          ? 'bg-purple-600 text-white border-purple-700'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder={dict.recipientPlaceholder}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {dict.payoutAmountLabel}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-extrabold text-purple-600 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {dict.paymentMethodLabel}
                </label>
                <input
                  type="text"
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  placeholder="e.g. CIH Virement, Cash, Wafacash..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
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
                targetStage === 'in_binance' 
                  ? 'bg-amber-500 hover:bg-amber-600' 
                  : targetStage === 'settled_cih'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-purple-600 hover:bg-purple-700'
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
