'use client';

import React, { useEffect } from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatUSD, formatMAD, formatEUR, formatDate } from '@/lib/utils';
import { X, Printer, Download } from 'lucide-react';

export const ReportModal: React.FC = () => {
  const {
    isReportOpen,
    setReportOpen,
    getFilteredTransactions,
    getMetrics,
    selectedAccount,
    t,
  } = useTransactionStore();
  const dict = t();
  const transactions = getFilteredTransactions();
  const metrics = getMetrics();

  useEffect(() => {
    if (!isReportOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReportOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isReportOpen, setReportOpen]);

  if (!isReportOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Account',
      'Date',
      'Reference',
      'KAST (USD)',
      'Binance Net (USD)',
      'Binance Fee (USD)',
      'CIH Settled (MAD)',
      'EUR Rate',
      'EUR Value',
      'Recipient',
      'Payout (MAD)',
      'Status',
      'Notes',
    ];
    const rows = transactions.map((tx) => [
      tx.id,
      tx.account,
      tx.date,
      tx.reference || '',
      tx.kastAmount,
      tx.binanceAmount || '',
      tx.binanceFee || '',
      tx.cihAmount || '',
      tx.eurRate || '',
      tx.eurAmount || '',
      tx.recipient || '',
      tx.payoutAmount || '',
      tx.status,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `financial_report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={() => setReportOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-[2px] overflow-y-auto print:p-0 print:bg-white print:static"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden my-4 print:border-none print:shadow-none print:my-0 print:w-full print:max-w-none animate-fadeIn"
      >
        {/* Modal Toolbar (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-track)] print:hidden">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {dict.reportTitle}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {dict.reportSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--border-strong)] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[var(--accent-ink)] text-[var(--accent-ink-fg)] hover:opacity-90 rounded-lg transition-opacity cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{dict.exportPDF}</span>
            </button>
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Statement Content */}
        <div className="p-6 sm:p-8 space-y-6 print:p-4 print:text-black">
          {/* Statement Header */}
          <div className="flex items-start justify-between border-b pb-5 border-[var(--border-subtle)]">
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] print:text-black tracking-tight">
                TaxFree Flow Statement
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Generated {new Date().toLocaleDateString()} · Scope:{' '}
                <span className="font-semibold text-[var(--text-secondary)]">
                  {selectedAccount === 'all' ? 'All Accounts' : selectedAccount.toUpperCase()}
                </span>
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--bg-track)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
              {dict.officialReport}
            </span>
          </div>

          {/* 4 Summary Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
            <div className="p-4">
              <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                01 · KAST (USD)
              </span>
              <div className="text-lg font-bold font-mono tabular-nums text-[var(--text-primary)] print:text-black mt-1">
                {formatUSD(metrics.totalInKastUSD)}
              </div>
            </div>

            <div className="p-4">
              <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                02 · Binance (USDT)
              </span>
              <div className="text-lg font-bold font-mono tabular-nums text-[var(--text-primary)] print:text-black mt-1">
                {formatUSD(metrics.totalInBinanceUSD)}
              </div>
            </div>

            <div className="p-4">
              <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                03 · CIH Bank
              </span>
              <div className="text-lg font-bold font-mono tabular-nums text-teal-700 dark:text-teal-400 print:text-black mt-1">
                {formatMAD(metrics.totalSettledCIHMAD)}
              </div>
              <div className="text-xs font-mono tabular-nums text-[var(--text-muted)] mt-0.5">
                ≈ {formatEUR(metrics.totalSettledEUR)}
              </div>
            </div>

            <div className="p-4">
              <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                04 · {dict.totalPayout}
              </span>
              <div className="text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 print:text-black mt-1">
                {formatMAD(metrics.totalFinalPayoutMAD)}
              </div>
              <div className="text-xs font-mono tabular-nums text-[var(--text-muted)] mt-0.5">
                ≈ {formatEUR(metrics.totalFinalPayoutEUR)}
              </div>
            </div>
          </div>

          {/* Statement Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--bg-track)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)]">
                  <th className="py-2.5 px-3">{dict.date}</th>
                  <th className="py-2.5 px-3">{dict.accountProfile}</th>
                  <th className="py-2.5 px-3">{dict.refVoucher}</th>
                  <th className="py-2.5 px-3 text-right">KAST</th>
                  <th className="py-2.5 px-3 text-right">Binance</th>
                  <th className="py-2.5 px-3 text-right">CIH (MAD)</th>
                  <th className="py-2.5 px-3 text-right">EUR</th>
                  <th className="py-2.5 px-3">{dict.recipient}</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[var(--text-muted)]">
                      No records found
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const effectiveEur =
                      tx.eurAmount ||
                      (tx.cihAmount && tx.eurRate ? tx.cihAmount / tx.eurRate : null);
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        <td className="py-2.5 px-3 text-[var(--text-muted)] font-mono tabular-nums whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)] capitalize">
                          {tx.account}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[var(--text-secondary)]">
                          {tx.reference || tx.source}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[var(--text-primary)]">
                          {formatUSD(tx.kastAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                          {tx.binanceAmount ? formatUSD(tx.binanceAmount) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-teal-700 dark:text-teal-400 print:text-black">
                          {tx.cihAmount ? formatMAD(tx.cihAmount) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                          {effectiveEur ? formatEUR(effectiveEur) : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">
                          {tx.recipient || <span className="text-[var(--text-muted)]">—</span>}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-md bg-[var(--bg-track)] text-[var(--text-secondary)]">
                            {tx.status === 'in_kast' && dict.statusKast}
                            {tx.status === 'in_binance' && dict.statusBinance}
                            {tx.status === 'settled_cih' && dict.statusCIH}
                            {tx.status === 'final_payout' && dict.statusPayout}
                            {tx.status === 'transferred_to_hicham' && dict.toHicham}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Statement Footer */}
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
            <span>
              {dict.totalRecords} {transactions.length}
            </span>
            <span>TaxFree Flow Ledger</span>
          </div>
        </div>
      </div>
    </div>
  );
};
