'use client';

import React, { useState, useEffect } from 'react';
import { useTransactionStore, PROFILES } from '@/store/useTransactionStore';
import { Transaction, PipelineStatus } from '@/types';
import { formatUSD, formatMAD, formatEUR, formatDate, cleanReference } from '@/lib/utils';
import { 
  Plus, 
  Wallet, 
  Coins, 
  Building2, 
  UserCheck, 
  Trash2, 
  GripVertical,
  Pencil,
  Split,
  History,
  ChevronDown,
  ChevronUp,
  User,
  Calendar
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

  useEffect(() => {
    setRateVal(currentRate.toString());
  }, [currentRate]);

  const activeRate = parseFloat(rateVal) || currentRate;
  const eurCalculated = madAmount > 0 && activeRate > 0 ? Number((madAmount / activeRate).toFixed(2)) : 0;

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
    <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1">
      <div className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 font-mono tracking-tight">
        ≈ {formatEUR(eurCalculated)}
      </div>

      {isEditing ? (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded-lg border border-blue-400 dark:border-blue-600 shadow-xs"
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
            className="w-13 text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded px-1 py-0.2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
          />
          <span className="text-[9px] text-blue-500 font-semibold">MAD/EUR</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          title={editTitle || 'Click to edit EUR exchange rate'}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 px-1.5 py-0.5 rounded-md border border-blue-200/80 dark:border-blue-800 transition-all cursor-pointer group/rate active:scale-95"
        >
          <span>{currentRate} MAD/EUR</span>
          <Pencil className="w-2.5 h-2.5 opacity-60 group-hover/rate:opacity-100" />
        </button>
      )}
    </div>
  );
};

export const KanbanBoard: React.FC = () => {
  const { 
    getFilteredTransactions, 
    openQuickAdd, 
    openMoveModal, 
    deleteTransaction, 
    updateEurRate, 
    lastEurRate, 
    t 
  } = useTransactionStore();

  const transactions = getFilteredTransactions();
  const dict = t();
  const [draggedTxId, setDraggedTxId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<PipelineStatus | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const columns: {
    id: PipelineStatus;
    title: string;
    currency: string;
    icon: React.ReactNode;
    color: string;
    bgAccent: string;
    borderAccent: string;
    canAdd?: boolean;
  }[] = [
    {
      id: 'in_kast',
      title: 'KAST',
      currency: 'USD',
      icon: <Wallet className="w-4 h-4 text-blue-600" />,
      color: 'text-blue-600 dark:text-blue-400',
      bgAccent: 'bg-blue-50/60 dark:bg-blue-950/30',
      borderAccent: 'border-blue-200 dark:border-blue-800',
      canAdd: true,
    },
    {
      id: 'in_binance',
      title: 'Binance',
      currency: 'USDT',
      icon: <Coins className="w-4 h-4 text-amber-600" />,
      color: 'text-amber-600 dark:text-amber-400',
      bgAccent: 'bg-amber-50/60 dark:bg-amber-950/30',
      borderAccent: 'border-amber-200 dark:border-amber-800',
    },
    {
      id: 'settled_cih',
      title: 'CIH Bank',
      currency: 'MAD / EUR',
      icon: <Building2 className="w-4 h-4 text-emerald-600" />,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgAccent: 'bg-emerald-50/60 dark:bg-emerald-950/30',
      borderAccent: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'final_payout',
      title: 'Final Payout',
      currency: 'MAD / EUR',
      icon: <UserCheck className="w-4 h-4 text-purple-600" />,
      color: 'text-purple-600 dark:text-purple-400',
      bgAccent: 'bg-purple-50/60 dark:bg-purple-950/30',
      borderAccent: 'border-purple-200 dark:border-purple-800',
    },
  ];

  // Drag handlers
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

    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.status === targetCol) return;

    openMoveModal(tx, targetCol);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map((col) => {
        const colTransactions = transactions.filter(t => {
          if (col.id === 'settled_cih') {
            return t.status === 'settled_cih' || t.status === 'transferred_to_hicham';
          }
          if (col.id === 'final_payout') {
            return t.status === 'final_payout';
          }
          return t.status === col.id;
        });

        const isOver = dragOverCol === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col bg-white dark:bg-slate-900 rounded-2xl border transition-all min-h-[550px] shadow-xs ${
              isOver
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
                : 'border-slate-200/80 dark:border-slate-800'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${col.bgAccent} border ${col.borderAccent}`}>
                  {col.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xs font-bold ${col.color}`}>
                      {col.title}
                    </h3>
                    <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {colTransactions.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    {col.currency}
                  </span>
                </div>
              </div>

              {col.canAdd && (
                <button
                  onClick={() => openQuickAdd('in_kast')}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                  title={dict.addBtn}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{dict.addBtn}</span>
                </button>
              )}
            </div>

            {/* Column Cards Drop Area */}
            <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto">
              {colTransactions.length === 0 ? (
                <div className="h-40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
                  <span>{dict.dragHere}</span>
                  {col.canAdd && (
                    <button
                      onClick={() => openQuickAdd('in_kast')}
                      className="text-blue-600 font-semibold hover:underline mt-1 cursor-pointer"
                    >
                      {dict.addBtn}
                    </button>
                  )}
                </div>
              ) : (
                colTransactions.map((tx) => {
                  const profile = PROFILES[tx.account];
                  const fee = tx.binanceFee ?? (tx.binanceAmount ? Number((tx.kastAmount - tx.binanceAmount).toFixed(2)) : 0);
                  const effectiveRate = tx.eurRate || lastEurRate || 10.85;

                  const isCihCol = col.id === 'settled_cih';
                  const isPayoutCol = col.id === 'final_payout';
                  const origOrderTotal = tx.originalCihAmount || (isCihCol ? (tx.cihAmount || 0) + (tx.totalPaidOutMAD || 0) : (tx.payoutAmount || tx.cihAmount || 0));
                  const currentCardAmt = isCihCol ? (tx.cihAmount || 0) : (tx.payoutAmount || tx.cihAmount || 0);
                  const paidMAD = isPayoutCol ? currentCardAmt : (tx.totalPaidOutMAD || (origOrderTotal > currentCardAmt ? Number((origOrderTotal - currentCardAmt).toFixed(2)) : 0));
                  const cihMAD = isCihCol ? currentCardAmt : (tx.remainingCihAmount !== undefined ? tx.remainingCihAmount : (origOrderTotal > currentCardAmt ? Number((origOrderTotal - currentCardAmt).toFixed(2)) : 0));
                  const hasSplitActivity = (origOrderTotal > 0 && paidMAD > 0 && (cihMAD > 0 || isPayoutCol)) || tx.isSplit;
                  const paidPercent = origOrderTotal > 0 ? Math.min(100, Math.max(0, Math.round((paidMAD / origOrderTotal) * 100))) : 0;
                  const cihPercent = 100 - paidPercent;

                  return (
                    <div
                      key={tx.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, tx.id)}
                      className="bg-slate-50/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative"
                    >
                      {/* Top row: Profile & Date */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center ${profile.badgeBg} border`}>
                            {profile.avatar}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {profile.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDate(tx.date)}
                        </span>
                      </div>

                      {/* Reference & Recipient Badge */}
                      <div className="mt-1.5 text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                        <span className="truncate">{cleanReference(tx.reference || tx.source)}</span>
                        {tx.recipient && (
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 shrink-0">
                            👤 {tx.recipient}
                          </span>
                        )}
                        {tx.account === 'adnan' && tx.transferredToHicham && !tx.recipient && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0">
                            {dict.toHicham}
                          </span>
                        )}
                      </div>

                      {/* CIH Bank: Show Split Remaining Indicator pill (NO progress bar as requested) */}
                      {col.id === 'settled_cih' && hasSplitActivity && (
                        <div className="mt-1.5 px-2 py-1 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Split className="w-3 h-3" />
                            <span>{dict.splitActive}: {cleanReference(tx.reference)}</span>
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono text-[9px]">
                            {dict.orderTotal} <strong className="text-slate-700 dark:text-slate-300">{formatMAD(origOrderTotal)}</strong>
                          </span>
                        </div>
                      )}

                      {/* Final Payout: Show Prominent Origin Order Badge */}
                      {col.id === 'final_payout' && (
                        <div className="mt-1.5 p-2 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                              <Split className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              <span>{dict.fromOrder}</span>
                            </span>
                            <span className="text-[11px] font-mono font-extrabold text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-700">
                              {cleanReference(tx.reference || tx.originReference)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Final Payout ONLY: Visual Dual-Tone Split Allocation Bar */}
                      {isPayoutCol && hasSplitActivity && (
                        <div className="mt-2 space-y-1.5 bg-slate-100/90 dark:bg-slate-900/90 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                              <span>{dict.paid}: {formatMAD(paidMAD)}</span>
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>{dict.cihRemaining}: {formatMAD(cihMAD)}</span>
                            </span>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                            <div 
                              style={{ width: `${paidPercent}%` }} 
                              className="bg-purple-500 h-full transition-all"
                            />
                            <div 
                              style={{ width: `${cihPercent}%` }} 
                              className="bg-emerald-500 h-full transition-all"
                            />
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                            <span>{dict.orderTotal} <strong className="text-slate-600 dark:text-slate-300 font-mono">{formatMAD(origOrderTotal)}</strong></span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">{paidPercent}% {dict.delivered}</span>
                          </div>
                        </div>
                      )}

                      {/* Main Amount for this Column */}
                      <div className="mt-2 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {col.id === 'in_kast' && 'KAST USD:'}
                            {col.id === 'in_binance' && 'Binance Net:'}
                            {col.id === 'settled_cih' && 'CIH Settled:'}
                            {col.id === 'final_payout' && 'Paid Out:'}
                          </span>

                          <div className="text-right">
                            <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                              {col.id === 'in_kast' && formatUSD(tx.kastAmount)}
                              {col.id === 'in_binance' && formatUSD(tx.binanceAmount || tx.kastAmount)}
                              {col.id === 'settled_cih' && formatMAD(tx.cihAmount || 0)}
                              {col.id === 'final_payout' && formatMAD(tx.payoutAmount || tx.cihAmount || 0)}
                            </span>

                            {col.id === 'in_binance' && fee > 0 && (
                              <div className="text-[10px] text-rose-500 font-semibold">
                                {dict.feeDeducted} -${fee.toFixed(2)}
                              </div>
                            )}

                            {col.id === 'final_payout' && tx.payoutMethod && (
                              <div className="text-[10px] text-slate-400 font-medium">
                                {tx.payoutMethod}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* CIH Column: Exchange Rate + Interactive EUR section directly UNDER MAD/USD */}
                        {col.id === 'settled_cih' && (
                          <div className="mt-1">
                            {tx.exchangeRate && (
                              <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                                {tx.exchangeRate} {dict.ratePerUSD}
                              </div>
                            )}

                            <InlineEurRateEditor
                              txId={tx.id}
                              madAmount={tx.cihAmount || 0}
                              currentRate={effectiveRate}
                              onUpdate={updateEurRate}
                              editTitle={dict.editEurRate}
                            />
                          </div>
                        )}

                        {/* Final Payout Column: Euro equivalent and editable EUR rate */}
                        {col.id === 'final_payout' && (
                          <InlineEurRateEditor
                            txId={tx.id}
                            madAmount={tx.payoutAmount || tx.cihAmount || 0}
                            currentRate={effectiveRate}
                            onUpdate={updateEurRate}
                            editTitle={dict.editEurRate}
                          />
                        )}

                        {/* Final Payout: Clickable Installments History Drawer */}
                        {col.id === 'final_payout' && (
                          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            {/* Expandable History Toggle Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedHistoryId(expandedHistoryId === tx.id ? null : tx.id);
                              }}
                              className="w-full flex items-center justify-between px-2 py-1 bg-purple-50/70 hover:bg-purple-100/90 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 rounded-lg text-[10px] font-bold text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 transition-all cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5">
                                <History className="w-3 h-3 text-purple-600" />
                                <span>{dict.installmentsHistory} ({tx.payoutHistory?.length || 1})</span>
                              </span>
                              {expandedHistoryId === tx.id ? (
                                <ChevronUp className="w-3 h-3 opacity-70" />
                              ) : (
                                <ChevronDown className="w-3 h-3 opacity-70" />
                              )}
                            </button>

                            {/* Expanded History Breakdown */}
                            {expandedHistoryId === tx.id && (
                              <div className="mt-1.5 space-y-1.5 p-2 bg-white dark:bg-slate-900/90 rounded-xl border border-purple-200 dark:border-purple-800 text-[10px]">
                                {(tx.payoutHistory && tx.payoutHistory.length > 0 ? tx.payoutHistory : [{
                                  id: 'inst-main',
                                  amount: tx.payoutAmount || tx.cihAmount || 0,
                                  date: tx.payoutDate || tx.date,
                                  recipient: tx.recipient || 'Partner',
                                  method: tx.payoutMethod || 'Cash'
                                }]).map((inst, idx) => (
                                  <div key={inst.id || idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                                    <div className="flex items-center justify-between font-bold">
                                      <span className="text-purple-600 dark:text-purple-400">
                                        • {dict.paymentNumber} #{idx + 1}
                                      </span>
                                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                                        {formatMAD(inst.amount)}
                                      </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-500 dark:text-slate-400">
                                      <div className="flex items-center gap-1 truncate">
                                        <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{inst.recipient || tx.recipient || 'Partner'}</span>
                                      </div>
                                      <div className="flex items-center gap-1 justify-end">
                                        <Calendar className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                        <span>{formatDate(inst.date)}</span>
                                      </div>
                                    </div>

                                    {inst.method && (
                                      <div className="text-[9px] text-slate-400 font-medium">
                                        💵 {inst.method}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Notes if any */}
                      {tx.notes && (
                        <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1">
                          {tx.notes}
                        </p>
                      )}

                      {/* Drag / Move helper buttons */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <GripVertical className="w-3 h-3 text-slate-300" /> {dict.dragToMove}
                        </span>

                        <div className="flex items-center gap-1">
                          {col.id === 'in_kast' && (
                            <button
                              onClick={() => openMoveModal(tx, 'in_binance')}
                              className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-md shadow-xs active:scale-95 transition-all cursor-pointer"
                            >
                              <span>{dict.toBinance}</span>
                            </button>
                          )}

                          {col.id === 'in_binance' && (
                            <button
                              onClick={() => openMoveModal(tx, 'settled_cih')}
                              className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs active:scale-95 transition-all cursor-pointer"
                            >
                              <span>{dict.toCIH}</span>
                            </button>
                          )}

                          {col.id === 'settled_cih' && (
                            <button
                              onClick={() => openMoveModal(tx, 'final_payout')}
                              className="px-2 py-0.5 text-[10px] font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-xs active:scale-95 transition-all cursor-pointer"
                            >
                              <span>{dict.toPayout}</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(dict.deleteConfirm)) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
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
