'use client';

import React, { useState } from 'react';
import { useTransactionStore, PROFILES } from '@/store/useTransactionStore';
import { Transaction, PipelineStatus } from '@/types';
import { formatUSD, formatMAD, formatDate } from '@/lib/utils';
import { 
  Plus, 
  Wallet, 
  Coins, 
  Building2, 
  ArrowRight, 
  Trash2, 
  GripVertical
} from 'lucide-react';

export const KanbanBoard: React.FC = () => {
  const { 
    getFilteredTransactions, 
    openQuickAdd, 
    openMoveModal,
    deleteTransaction,
    t
  } = useTransactionStore();

  const transactions = getFilteredTransactions();
  const dict = t();
  const [draggedTxId, setDraggedTxId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<PipelineStatus | null>(null);

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
      currency: 'MAD',
      icon: <Building2 className="w-4 h-4 text-emerald-600" />,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgAccent: 'bg-emerald-50/60 dark:bg-emerald-950/30',
      borderAccent: 'border-emerald-200 dark:border-emerald-800',
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {columns.map((col) => {
        const colTransactions = transactions.filter(t => {
          if (col.id === 'settled_cih') {
            return t.status === 'settled_cih' || t.status === 'transferred_to_hicham';
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
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${col.bgAccent} border ${col.borderAccent}`}>
                  {col.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold ${col.color}`}>
                      {col.title}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
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
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
                  title={dict.addBtn}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{dict.addBtn}</span>
                </button>
              )}
            </div>

            {/* Column Cards Drop Area */}
            <div className="p-3 flex-1 space-y-3 overflow-y-auto">
              {colTransactions.length === 0 ? (
                <div className="h-44 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
                  <span>{dict.dragHere}</span>
                  {col.canAdd && (
                    <button
                      onClick={() => openQuickAdd('in_kast')}
                      className="text-blue-600 font-semibold hover:underline mt-1"
                    >
                      {dict.addBtn}
                    </button>
                  )}
                </div>
              ) : (
                colTransactions.map((tx) => {
                  const profile = PROFILES[tx.account];
                  const fee = tx.binanceFee ?? (tx.binanceAmount ? tx.kastAmount - tx.binanceAmount : 0);

                  return (
                    <div
                      key={tx.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, tx.id)}
                      className="bg-slate-50/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative"
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

                      {/* Reference & Source */}
                      <div className="mt-2 text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{tx.reference || tx.source}</span>
                        {tx.account === 'adnan' && tx.transferredToHicham && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            {dict.toHicham}
                          </span>
                        )}
                      </div>

                      {/* Main Amount for this Column */}
                      <div className="mt-2.5 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {col.id === 'in_kast' && 'KAST USD:'}
                          {col.id === 'in_binance' && 'Binance Net:'}
                          {col.id === 'settled_cih' && 'CIH Settled:'}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                            {col.id === 'in_kast' && formatUSD(tx.kastAmount)}
                            {col.id === 'in_binance' && formatUSD(tx.binanceAmount || tx.kastAmount)}
                            {col.id === 'settled_cih' && (
                              tx.cihAmount 
                                ? formatMAD(tx.cihAmount) 
                                : formatUSD(tx.kastAmount)
                            )}
                          </span>

                          {col.id === 'in_binance' && fee > 0 && (
                            <div className="text-[10px] text-rose-500">
                              {dict.feeDeducted} -${fee.toFixed(2)}
                            </div>
                          )}

                          {col.id === 'settled_cih' && tx.exchangeRate && (
                            <div className="text-[10px] text-emerald-600">
                              @ {tx.exchangeRate} {dict.ratePerUSD}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notes if any */}
                      {tx.notes && (
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1">
                          {tx.notes}
                        </p>
                      )}

                      {/* Drag / Move helper buttons */}
                      <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <GripVertical className="w-3 h-3 text-slate-300" /> {dict.dragToMove}
                        </span>

                        <div className="flex items-center gap-1">
                          {col.id === 'in_kast' && (
                            <button
                              onClick={() => openMoveModal(tx, 'in_binance')}
                              className="px-2 py-0.5 text-[11px] font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-md shadow-xs active:scale-95 transition-all flex items-center gap-1"
                            >
                              <span>{dict.toBinance}</span>
                            </button>
                          )}

                          {col.id === 'in_binance' && (
                            <button
                              onClick={() => openMoveModal(tx, 'settled_cih')}
                              className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs active:scale-95 transition-all flex items-center gap-1"
                            >
                              <span>{dict.toCIH}</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(dict.deleteConfirm)) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded"
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
