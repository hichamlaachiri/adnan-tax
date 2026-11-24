'use client';

import React, { useState, useEffect } from 'react';
import { useTransactionStore, PROFILES } from '@/store/useTransactionStore';
import { PipelineStatus } from '@/types';
import { formatUSD, formatMAD, formatEUR, formatDate, cleanReference } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Pencil,
  History,
  ChevronDown,
  ChevronUp,
  User,
  Paperclip,
  ArrowRight,
  Check,
  Banknote,
} from 'lucide-react';

interface InlineEurRateProps {
  txId: string;
  madAmount: number;
  currentRate: number;
  onUpdate: (id: string, rate: number) => void;
  editTitle?: string;
}

const InlineEurRateEditor: React.FC<InlineEurRateProps> = ({
  txId,
  madAmount,
  currentRate,
  onUpdate,
  editTitle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [rateVal, setRateVal] = useState(currentRate.toString());

  const activeRate = isEditing ? parseFloat(rateVal) || currentRate : currentRate;
  const eurCalculated =
    madAmount > 0 && activeRate > 0 ? Number((madAmount / activeRate).toFixed(2)) : 0;

  const handleCommit = () => {
    setIsEditing(false);
    const num = parseFloat(rateVal);
    if (!isNaN(num) && num > 0 && num !== currentRate) {
      onUpdate(txId, num);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommit();
    } else if (e.key === 'Escape') {
      setRateVal(currentRate.toString());
      setIsEditing(false);
    }
  };

  return (
    <div className="mt-2 flex items-center justify-between gap-2 text-xs">
      <span className="font-mono tabular-nums font-semibold text-[var(--text-secondary)]">
        ≈ {formatEUR(eurCalculated)}
      </span>

      {isEditing ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 bg-[var(--bg-track)] px-1.5 py-0.5 rounded-md border border-[var(--border-strong)]"
        >
          <input
            type="number"
            step="0.01"
            autoFocus
            value={rateVal}
            onChange={(e) => setRateVal(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            placeholder="10.85"
            className="w-14 text-xs font-mono tabular-nums font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-1 py-0.5 focus:outline-none text-center"
          />
          <span className="text-[10px] text-[var(--text-muted)] font-mono">MAD/€</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setRateVal(currentRate.toString());
            setIsEditing(true);
          }}
          title={editTitle || 'Click to edit EUR exchange rate'}
          className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-track)] px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
        >
          <span>{currentRate} MAD/€</span>
          <Pencil className="w-2.5 h-2.5 opacity-60" />
        </button>
      )}
    </div>
  );
};

const ACCOUNT_DOT: Record<'hicham' | 'zouhir' | 'adnan', string> = {
  hicham: 'bg-teal-600',
  zouhir: 'bg-sky-600',
  adnan: 'bg-amber-600',
};

export const KanbanBoard: React.FC = () => {
  const {
    getFilteredTransactions,
    openQuickAdd,
    openMoveModal,
    openProofModal,
    deleteTransaction,
    updateEurRate,
    lastEurRate,
    t,
  } = useTransactionStore();

  const transactions = getFilteredTransactions();
  const dict = t();
  const [draggedTxId, setDraggedTxId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<PipelineStatus | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = setTimeout(() => setConfirmDeleteId(null), 3500);
    return () => clearTimeout(timer);
  }, [confirmDeleteId]);

  const columns: {
    id: PipelineStatus;
    step: string;
    title: string;
    currency: string;
    dotColor: string;
    canAdd?: boolean;
  }[] = [
    {
      id: 'in_kast',
      step: '01',
      title: 'KAST',
      currency: 'USD',
      dotColor: 'bg-blue-600',
      canAdd: true,
    },
    {
      id: 'in_binance',
      step: '02',
      title: 'Binance',
      currency: 'USDT',
      dotColor: 'bg-amber-600',
    },
    {
      id: 'settled_cih',
      step: '03',
      title: 'CIH Bank',
      currency: 'MAD',
      dotColor: 'bg-teal-600',
    },
    {
      id: 'final_payout',
      step: '04',
      title: 'Final Payout',
      currency: 'MAD',
      dotColor: 'bg-emerald-600',
    },
  ];

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedTxId(id);
  };

  const handleDragOver = (e: React.DragEvent, colId: PipelineStatus) => {
    e.preventDefault();
    setDragOverCol(colId);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetCol: PipelineStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const txId = e.dataTransfer.getData('text/plain') || draggedTxId;
    if (!txId) return;

    const tx = transactions.find((item) => item.id === txId);
    if (!tx || tx.status === targetCol) return;

    openMoveModal(tx, targetCol);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {columns.map((col) => {
        const colTransactions = transactions.filter((item) => {
          if (col.id === 'settled_cih') {
            return item.status === 'settled_cih' || item.status === 'transferred_to_hicham';
          }
          if (col.id === 'final_payout') {
            return item.status === 'final_payout';
          }
          return item.status === col.id;
        });

        const isOver = dragOverCol === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-2xl border transition-all min-h-[520px] ${
              isOver
                ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-500/60 ring-2 ring-teal-500/15'
                : 'bg-[var(--bg-track)] border-[var(--border-subtle)]'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${col.dotColor}`} />
                <h2 className="text-[13px] font-bold text-[var(--text-primary)] truncate">
                  {col.title}
                </h2>
                <span className="text-xs font-mono tabular-nums font-medium text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-1.5 py-0.2 rounded-md">
                  {colTransactions.length}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  {col.currency}
                </span>
                {col.canAdd && (
                  <button
                    type="button"
                    onClick={() => openQuickAdd('in_kast')}
                    className="w-6 h-6 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--accent-ink)] text-[var(--text-primary)] hover:text-[var(--accent-ink-fg)] border border-[var(--border-subtle)] flex items-center justify-center transition-colors cursor-pointer"
                    title={dict.newRefund}
                    aria-label={dict.newRefund}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Cards List */}
            <div className="p-2.5 flex-1 space-y-2.5">
              {colTransactions.length === 0 ? (
                <div className="h-36 rounded-xl border border-dashed border-[var(--border-strong)] flex flex-col items-center justify-center text-[var(--text-muted)] text-xs gap-1.5 px-4 text-center">
                  <span>{dict.dragHere}</span>
                  {col.canAdd && (
                    <button
                      type="button"
                      onClick={() => openQuickAdd('in_kast')}
                      className="text-xs font-semibold text-[var(--text-primary)] underline underline-offset-4 hover:opacity-75 cursor-pointer"
                    >
                      + {dict.newRefund}
                    </button>
                  )}
                </div>
              ) : (
                colTransactions.map((tx) => {
                  const profile = PROFILES[tx.account];
                  const fee =
                    tx.binanceFee ??
                    (tx.binanceAmount
                      ? Number((tx.kastAmount - tx.binanceAmount).toFixed(2))
                      : 0);
                  const effectiveRate = tx.eurRate || lastEurRate || 10.85;

                  const isCihCol = col.id === 'settled_cih';
                  const isPayoutCol = col.id === 'final_payout';
                  const origOrderTotal =
                    tx.originalCihAmount ||
                    (isCihCol
                      ? (tx.cihAmount || 0) + (tx.totalPaidOutMAD || 0)
                      : tx.payoutAmount || tx.cihAmount || 0);
                  const currentCardAmt = isCihCol
                    ? tx.cihAmount || 0
                    : tx.payoutAmount || tx.cihAmount || 0;
                  const paidMAD = isPayoutCol
                    ? currentCardAmt
                    : tx.totalPaidOutMAD ||
                      (origOrderTotal > currentCardAmt
                        ? Number((origOrderTotal - currentCardAmt).toFixed(2))
                        : 0);
                  const cihMAD = isCihCol
                    ? currentCardAmt
                    : tx.remainingCihAmount !== undefined
                    ? tx.remainingCihAmount
                    : origOrderTotal > currentCardAmt
                    ? Number((origOrderTotal - currentCardAmt).toFixed(2))
                    : 0;
                  const hasSplitActivity =
                    (origOrderTotal > 0 && paidMAD > 0 && (cihMAD > 0 || isPayoutCol)) ||
                    tx.isSplit;
                  const proofCount = tx.proofImages?.length || 0;
                  const isConfirmingDelete = confirmDeleteId === tx.id;

                  return (
                    <article
                      key={tx.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, tx.id)}
                      onClick={() => openProofModal(tx.id)}
                      className="bg-[var(--bg-surface)] rounded-xl p-3.5 border border-[var(--border-subtle)] hover:border-[var(--border-strong)] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all cursor-pointer active:cursor-grabbing group"
                    >
                      {/* Row 1: Account & Date */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${ACCOUNT_DOT[tx.account]}`}
                          />
                          <span className="font-semibold text-[var(--text-secondary)] truncate">
                            {profile.name.split(' ')[0]}
                          </span>
                        </div>
                        <time className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums shrink-0">
                          {formatDate(tx.date)}
                        </time>
                      </div>

                      {/* Row 2: Voucher Reference & Recipient */}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <h3 className="text-[13.5px] font-bold text-[var(--text-primary)] tracking-tight truncate">
                          {cleanReference(tx.reference || tx.source)}
                        </h3>
                        {tx.recipient && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-track)] px-2 py-0.5 rounded-md shrink-0">
                            <User className="w-3 h-3 text-[var(--text-muted)]" />
                            <span>{tx.recipient}</span>
                          </span>
                        )}
                        {tx.account === 'adnan' && tx.transferredToHicham && !tx.recipient && (
                          <span className="text-[11px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-track)] px-2 py-0.5 rounded-md shrink-0">
                            {dict.toHicham}
                          </span>
                        )}
                      </div>

                      {/* Split Order Total (CIH only) */}
                      {col.id === 'settled_cih' && hasSplitActivity && (
                        <div className="mt-2 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/30 px-2 py-1 rounded-md">
                          <span className="font-medium">{dict.orderTotal}</span>
                          <span className="font-mono tabular-nums font-semibold">
                            {formatMAD(origOrderTotal)}
                          </span>
                        </div>
                      )}

                      {/* Row 3: Primary Financial Amount */}
                      <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)]">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[17px] font-bold font-mono tabular-nums tracking-tight text-[var(--text-primary)]">
                            {col.id === 'in_kast' && formatUSD(tx.kastAmount)}
                            {col.id === 'in_binance' &&
                              formatUSD(tx.binanceAmount || tx.kastAmount)}
                            {col.id === 'settled_cih' && formatMAD(tx.cihAmount || 0)}
                            {col.id === 'final_payout' &&
                              formatMAD(tx.payoutAmount || tx.cihAmount || 0)}
                          </span>

                          {col.id === 'in_binance' && fee > 0 && (
                            <span className="text-[11px] font-mono tabular-nums font-medium text-rose-600 dark:text-rose-400">
                              -{formatUSD(fee)}
                            </span>
                          )}

                          {col.id === 'settled_cih' && tx.exchangeRate && (
                            <span className="text-[11px] font-mono tabular-nums font-medium text-teal-700 dark:text-teal-400">
                              @{tx.exchangeRate}
                            </span>
                          )}

                          {col.id === 'final_payout' && tx.payoutMethod && (
                            <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[120px]">
                              {tx.payoutMethod}
                            </span>
                          )}
                        </div>

                        {/* EUR Equivalent + Inline Rate Editor */}
                        {col.id === 'settled_cih' && (
                          <InlineEurRateEditor
                            txId={tx.id}
                            madAmount={tx.cihAmount || 0}
                            currentRate={effectiveRate}
                            onUpdate={updateEurRate}
                            editTitle={dict.editEurRate}
                          />
                        )}

                        {col.id === 'final_payout' && (
                          <InlineEurRateEditor
                            txId={tx.id}
                            madAmount={tx.payoutAmount || tx.cihAmount || 0}
                            currentRate={effectiveRate}
                            onUpdate={updateEurRate}
                            editTitle={dict.editEurRate}
                          />
                        )}
                      </div>

                      {/* Installments History Disclosure (Final Payout) */}
                      {col.id === 'final_payout' && (
                        <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedHistoryId(expandedHistoryId === tx.id ? null : tx.id);
                            }}
                            className="w-full flex items-center justify-between text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-0.5 transition-colors cursor-pointer"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              <span>
                                {dict.installmentsHistory} ({tx.payoutHistory?.length || 1})
                              </span>
                            </span>
                            {expandedHistoryId === tx.id ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            )}
                          </button>

                          {expandedHistoryId === tx.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)] text-xs animate-fadeIn"
                            >
                              {(tx.payoutHistory && tx.payoutHistory.length > 0
                                ? tx.payoutHistory
                                : [
                                    {
                                      id: 'inst-main',
                                      amount: tx.payoutAmount || tx.cihAmount || 0,
                                      date: tx.payoutDate || tx.date,
                                      recipient: tx.recipient || 'Partner',
                                      method: tx.payoutMethod || 'Cash',
                                      notes: tx.notes,
                                    },
                                  ]
                              ).map((inst, idx) => (
                                <div key={inst.id || idx} className="py-2 space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                                      #{idx + 1} · {inst.recipient || tx.recipient || 'Partner'}
                                    </span>
                                    <span className="font-mono tabular-nums font-bold text-[var(--text-primary)]">
                                      {formatMAD(inst.amount)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                                    <span className="inline-flex items-center gap-1 truncate">
                                      <Banknote className="w-3 h-3 shrink-0" />
                                      <span>{inst.method || 'Transfer'}</span>
                                    </span>
                                    <span className="font-mono tabular-nums shrink-0">
                                      {formatDate(inst.date)}
                                    </span>
                                  </div>
                                  {(inst.notes || (idx === 0 && tx.notes)) && (
                                    <p className="text-[11px] text-[var(--text-secondary)] italic">
                                      {inst.notes || tx.notes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes (non-payout cards) */}
                      {tx.notes && col.id !== 'final_payout' && (
                        <p className="mt-2 text-xs text-[var(--text-muted)] line-clamp-1">
                          {tx.notes}
                        </p>
                      )}

                      {/* Footer: Proof trigger + Stage Action + Delete */}
                      <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openProofModal(tx.id);
                          }}
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-colors cursor-pointer ${
                            proofCount > 0
                              ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-track)]'
                          }`}
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>
                            {proofCount > 0
                              ? `${proofCount} ${dict.proofLabel}`
                              : dict.attachProof}
                          </span>
                        </button>

                        <div className="flex items-center gap-1">
                          {col.id === 'in_kast' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openMoveModal(tx, 'in_binance');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[var(--bg-track)] hover:bg-[var(--accent-ink)] text-[var(--text-primary)] hover:text-[var(--accent-ink-fg)] transition-colors cursor-pointer"
                            >
                              <span>Binance</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {col.id === 'in_binance' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openMoveModal(tx, 'settled_cih');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[var(--bg-track)] hover:bg-teal-700 text-[var(--text-primary)] hover:text-white transition-colors cursor-pointer"
                            >
                              <span>CIH</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {col.id === 'settled_cih' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openMoveModal(tx, 'final_payout');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[var(--bg-track)] hover:bg-emerald-700 text-[var(--text-primary)] hover:text-white transition-colors cursor-pointer"
                            >
                              <span>{dict.delivered}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {isConfirmingDelete ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                                deleteTransaction(tx.id);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(tx.id);
                              }}
                              className="p-1 text-[var(--text-muted)] hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all rounded-md cursor-pointer"
                              title="Delete"
                              aria-label="Delete transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
