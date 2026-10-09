'use client';

import React from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatUSD, formatMAD, formatEUR, formatDate } from '@/lib/utils';
import { X, Printer, Download, FileText } from 'lucide-react';

export const ReportModal: React.FC = () => {
  const { isReportOpen, setReportOpen, getFilteredTransactions, getMetrics, selectedAccount, t } = useTransactionStore();
  const dict = t();
  const transactions = getFilteredTransactions();
  const metrics = getMetrics();

  if (!isReportOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Account', 'Date', 'Reference', 'KAST (USD)', 'Binance Net (USD)', 'Binance Fee (USD)', 'CIH Settled (MAD)', 'EUR Rate', 'EUR Value', 'Recipient', 'Payout (MAD)', 'Status', 'Notes'];
    const rows = transactions.map(t => [
      t.id,
      t.account,
      t.date,
      t.reference || '',
      t.kastAmount,
      t.binanceAmount || '',
      t.binanceFee || '',
      t.cihAmount || '',
      t.eurRate || '',
      t.eurAmount || '',
      t.recipient || '',
      t.payoutAmount || '',
      t.status,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 print:border-none print:shadow-none print:my-0 print:w-full print:max-w-none">
        {/* Header Actions (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {dict.reportTitle}
              </h3>
              <p className="text-xs text-slate-400">{dict.reportSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{dict.exportPDF}</span>
            </button>
            <button
              onClick={() => setReportOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="p-6 sm:p-8 space-y-6 print:p-4 print:text-black">
          {/* Report Brand Header */}
          <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white print:text-black tracking-tight">
                TaxFree Flow Statement
              </h1>
              <p className="text-xs text-slate-500">
                Generated on {new Date().toLocaleDateString()} • Scope: {selectedAccount === 'all' ? 'All Accounts' : selectedAccount.toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {dict.officialReport}
              </span>
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1. KAST (USD)</span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white print:text-black mt-0.5">
                {formatUSD(metrics.totalInKastUSD)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">2. Binance (USDT)</span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white print:text-black mt-0.5">
                {formatUSD(metrics.totalInBinanceUSD)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">3. CIH Bank (MAD / EUR)</span>
              <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatMAD(metrics.totalSettledCIHMAD)}
              </div>
              <div className="text-[10px] font-bold text-blue-600 font-mono">
                ≈ {formatEUR(metrics.totalSettledEUR)}
              </div>
            </div>

            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">4. {dict.totalPayout} (MAD / EUR)</span>
              <div className="text-base font-extrabold text-purple-700 dark:text-purple-300 mt-0.5">
                {formatMAD(metrics.totalFinalPayoutMAD)}
              </div>
              <div className="text-[10px] font-bold text-purple-600 font-mono">
                ≈ {formatEUR(metrics.totalFinalPayoutEUR)}
              </div>
            </div>
          </div>

          {/* Statement Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-3">{dict.date}</th>
                  <th className="py-2.5 px-3">{dict.accountProfile}</th>
                  <th className="py-2.5 px-3">{dict.refVoucher}</th>
                  <th className="py-2.5 px-3 text-right">KAST (USD)</th>
                  <th className="py-2.5 px-3 text-right">Binance Net</th>
                  <th className="py-2.5 px-3 text-right">CIH (MAD)</th>
                  <th className="py-2.5 px-3 text-right">EUR Value</th>
                  <th className="py-2.5 px-3">{dict.recipient}</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-400">
                      No records found
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const effectiveEur = tx.eurAmount || (tx.cihAmount && tx.eurRate ? tx.cihAmount / tx.eurRate : null);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200 capitalize">
                          {tx.account}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {tx.reference || tx.source}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600">
                          {formatUSD(tx.kastAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800 dark:text-slate-200">
                          {tx.binanceAmount ? formatUSD(tx.binanceAmount) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                          {tx.cihAmount ? formatMAD(tx.cihAmount) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                          {effectiveEur ? formatEUR(effectiveEur) : '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          {tx.recipient ? (
                            <span className="font-bold text-purple-600">👤 {tx.recipient}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {tx.status === 'in_kast' && `1. ${dict.statusKast}`}
                            {tx.status === 'in_binance' && `2. ${dict.statusBinance}`}
                            {tx.status === 'settled_cih' && `3. ${dict.statusCIH}`}
                            {tx.status === 'final_payout' && `4. ${dict.statusPayout}`}
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

          {/* Report Footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{dict.totalRecords} {transactions.length}</span>
            <span>TaxFree Flow Tracker System</span>
          </div>
        </div>
      </div>
    </div>
  );
};
