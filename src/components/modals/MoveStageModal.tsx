'use client';

import React, { useState, useEffect } from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatUSD, formatMAD, formatEUR } from '@/lib/utils';
import { X, Split } from 'lucide-react';

export const MoveStageModal: React.FC = () => {
  const { moveModalTx, closeMoveModal, moveTransactionStage, lastEurRate, t } =
    useTransactionStore();
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
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (moveModalTx) {
      const { tx, targetStage } = moveModalTx;
      const baseUSD = tx.kastAmount || 0;
      setNotes(tx.notes || '');

      if (targetStage === 'in_binance') {
        const defaultFee = Number((baseUSD * 0.01).toFixed(2));
        const defaultNet = Number((baseUSD - defaultFee).toFixed(2));
        setBinanceFee(tx.binanceFee?.toString() || defaultFee.toString());
        setBinanceAmount(tx.binanceAmount?.toString() || defaultNet.toString());
      } else if (targetStage === 'settled_cih') {
        const netUSD = tx.binanceAmount || baseUSD;
        const rate = tx.exchangeRate || 9.9;
        const eRate = tx.eurRate || lastEurRate || 10.85;
        const cAmt = tx.cihAmount ? tx.cihAmount : Number((netUSD * rate).toFixed(2));
        setExchangeRate(rate.toString());
        setCihAmount(cAmt.toString());
        setEurRate(eRate.toString());
        setEurAmount((cAmt / eRate).toFixed(2));
      } else if (targetStage === 'final_payout') {
        const defaultRecipient =
          tx.account === 'adnan' ? 'Adnan' : tx.account === 'zouhir' ? 'Zouhir' : 'Hicham';
        setRecipient(tx.recipient || defaultRecipient);
        const amtMAD = tx.cihAmount || tx.kastAmount * (tx.exchangeRate || 9.9);
        setPayoutAmount(tx.payoutAmount ? tx.payoutAmount.toString() : amtMAD.toFixed(2));
        setPayoutMethod(tx.payoutMethod || 'Bank Transfer / Cash');
      }
    }
  }, [moveModalTx, lastEurRate]);

  useEffect(() => {
    if (!moveModalTx) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMoveModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moveModalTx, closeMoveModal]);

  if (!moveModalTx) return null;

  const { tx, targetStage } = moveModalTx;
  const baseUSD = tx.kastAmount || 0;

  const handleBinanceNetChange = (netStr: string) => {
    setBinanceAmount(netStr);
    const net = parseFloat(netStr);
    if (!isNaN(net) && baseUSD >= net) {
      setBinanceFee((baseUSD - net).toFixed(2));
    }
  };

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
      const eR = parseFloat(eurRate) || lastEurRate || 10.85;
      const eurA = cihA ? Number((cihA / eR).toFixed(2)) : undefined;
      await moveTransactionStage(tx.id, 'settled_cih', {
        cihAmount: cihA,
        exchangeRate: parseFloat(exchangeRate) || 9.9,
        eurRate: eR,
        eurAmount: eurA,
      });
    } else if (targetStage === 'final_payout') {
      await moveTransactionStage(tx.id, 'final_payout', {
        recipient: recipient.trim() || 'Partner',
        payoutAmount: parseFloat(payoutAmount) || (tx.cihAmount ?? 0),
        payoutMethod,
        payoutDate: new Date().toISOString().split('T')[0],
        notes: notes.trim() || tx.notes || undefined,
      });
    } else {
      await moveTransactionStage(tx.id, targetStage, {
        notes: notes.trim() || tx.notes || undefined,
      });
    }
  };

  const maxAvailableInCIH = tx.cihAmount || tx.kastAmount * (tx.exchangeRate || 9.9) || 0;
  const currentPayoutVal = parseFloat(payoutAmount) || 0;
  const remainingVal =
    maxAvailableInCIH > currentPayoutVal
      ? Number((maxAvailableInCIH - currentPayoutVal).toFixed(2))
      : 0;
  const isPartialSplit =
    currentPayoutVal > 0 && maxAvailableInCIH > currentPayoutVal && remainingVal >= 0.01;
  const effectiveRate = tx.eurRate || lastEurRate || 10.85;

  const stageDot =
    targetStage === 'in_binance'
      ? 'bg-amber-600'
      : targetStage === 'settled_cih'
      ? 'bg-teal-600'
      : 'bg-emerald-600';

  return (
    <div
      onClick={closeMoveModal}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden animate-fadeIn"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${stageDot}`} />
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {targetStage === 'in_binance' && dict.transferToBinanceTitle}
                {targetStage === 'settled_cih' && dict.withdrawToCIHTitle}
                {targetStage === 'final_payout' && dict.finalPayoutTitle}
              </h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
              {tx.reference} · KAST {formatUSD(tx.kastAmount)}
            </p>
          </div>
          <button
            type="button"
            onClick={closeMoveModal}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-track)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* STEP 2: Binance */}
          {targetStage === 'in_binance' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  {dict.netBinanceAmount}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={binanceAmount}
                  onChange={(e) => handleBinanceNetChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base font-mono tabular-nums font-bold bg-[var(--bg-track)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--bg-surface)] transition-colors"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  {dict.transferFeeUSD}
                  <span className="ml-1.5 font-mono text-[var(--text-muted)] font-normal">
                    (KAST ${baseUSD.toFixed(2)} - Net)
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={binanceFee}
                  onChange={(e) => handleBinanceFeeChange(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-mono tabular-nums font-semibold text-rose-600 dark:text-rose-400 bg-[var(--bg-track)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--bg-surface)] transition-colors"
                />
              </div>
            </div>
          )}

          {/* STEP 3: CIH Bank */}
          {targetStage === 'settled_cih' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    USD Rate (MAD/USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={exchangeRate}
                    onChange={(e) => handleRateChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums font-semibold bg-[var(--bg-track)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--bg-surface)]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    EUR Rate (MAD/EUR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={eurRate}
                    onChange={(e) => handleEurRateChange(e.target.value)}
                    placeholder="10.85"
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums font-semibold bg-[var(--bg-track)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--bg-surface)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  {dict.finalSettledCIH}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cihAmount}
                  onChange={(e) => handleCihAmountChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base font-mono tabular-nums font-bold text-teal-700 dark:text-teal-400 bg-[var(--bg-track)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-teal-600 focus:bg-[var(--bg-surface)]"
                  required
                  autoFocus
                />
              </div>

              {eurAmount && parseFloat(eurAmount) > 0 && (
                <div className="px-3.5 py-2.5 bg-[var(--bg-track)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)] font-medium">
                    {dict.eurEquivalent}
                  </span>
                  <span className="text-sm font-bold font-mono tabular-nums text-[var(--text-primary)]">
                    {formatEUR(parseFloat(eurAmount))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Final Payout */}
          {targetStage === 'final_payout' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                  {dict.recipientLabel}
                </label>
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {['Adnan', 'Zouhir', 'Hicham', 'Cash Payout'].map((name) => (
                    <button
                      type="button"
                      key={name}
                      onClick={() => setRecipient(name)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        recipient === name
                          ? 'bg-[var(--accent-ink)] text-[var(--accent-ink-fg)] border-transparent'
                          : 'bg-[var(--bg-track)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
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
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-track)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--bg-surface)] font-medium"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                    {dict.payoutAmountLabel}
                  </label>
                  {maxAvailableInCIH > 0 && (
                    <span className="text-xs text-[var(--text-muted)] font-mono tabular-nums">
                      CIH: <strong className="text-teal-700 dark:text-teal-400">{formatMAD(maxAvailableInCIH)}</strong>
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 bg-[var(--bg-track)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-[var(--bg-surface)]"
                  required
                  autoFocus
                />

                {maxAvailableInCIH > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setPayoutAmount(maxAvailableInCIH.toString())}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[var(--bg-track)] hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors cursor-pointer"
                    >
                      {dict.full100} ({formatMAD(maxAvailableInCIH)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutAmount(Math.floor(maxAvailableInCIH / 2).toString())}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[var(--bg-track)] hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors cursor-pointer"
                    >
                      {dict.half50} ({formatMAD(Math.floor(maxAvailableInCIH / 2))})
                    </button>
                  </div>
                )}
              </div>

              {isPartialSplit && (
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Split className="w-3.5 h-3.5" />
                      <span>{dict.autoSplitTitle}</span>
                    </span>
                    <span className="font-mono text-[11px]">{tx.reference}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200/70 dark:border-amber-800/50 text-xs">
                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] block">
                        {dict.payoutTo} {recipient || 'Partner'}
                      </span>
                      <span className="font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                        {formatMAD(currentPayoutVal)}
                      </span>
                      <span className="text-[11px] font-mono text-[var(--text-muted)] block">
                        ≈ {formatEUR(currentPayoutVal / effectiveRate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] block">
                        {dict.leftInCIH}
                      </span>
                      <span className="font-bold font-mono tabular-nums text-teal-700 dark:text-teal-400">
                        {formatMAD(remainingVal)}
                      </span>
                      <span className="text-[11px] font-mono text-[var(--text-muted)] block">
                        ≈ {formatEUR(remainingVal / effectiveRate)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    {dict.paymentMethodLabel}
                  </label>
                  <input
                    type="text"
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    placeholder="CIH Virement, Cash..."
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-track)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--bg-surface)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    {dict.notesOptional}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="1st installment..."
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-track)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--bg-surface)]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={closeMoveModal}
              className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-track)] transition-colors cursor-pointer"
            >
              {dict.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[var(--accent-ink)] text-[var(--accent-ink-fg)] hover:opacity-90 rounded-xl active:scale-[0.98] transition-all cursor-pointer"
            >
              {isPartialSplit ? dict.confirmSplit : dict.confirmMove}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
