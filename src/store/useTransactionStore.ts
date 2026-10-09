import { create } from 'zustand';
import { Transaction, AccountId, PipelineStatus, AccountSummary, PayoutInstallment } from '@/types';
import { isFirebaseConfigured, saveTransactionToFirebase, deleteTransactionFromFirebase, subscribeToTransactions } from '@/lib/firebase';
import { Language, translations, Translations } from '@/lib/i18n';
import { cleanReference, formatMAD } from '@/lib/utils';

export const PROFILES: Record<'hicham' | 'zouhir' | 'adnan', AccountSummary> = {
  hicham: {
    id: 'hicham',
    name: 'Hicham (Me)',
    role: 'Primary Account',
    avatar: 'H',
    color: 'emerald',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    workflow: 'KAST → Binance → CIH → Payout',
  },
  zouhir: {
    id: 'zouhir',
    name: 'Zouhir',
    role: 'Managed Profile',
    avatar: 'Z',
    color: 'indigo',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    workflow: 'KAST → Binance → CIH → Payout',
  },
  adnan: {
    id: 'adnan',
    name: 'Adnan',
    role: 'Partner Profile',
    avatar: 'A',
    color: 'amber',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    workflow: 'KAST → Direct Transfer to Hicham',
  }
};

const STORAGE_KEY = 'taxfree_flow_transactions_live';
const LANG_STORAGE_KEY = 'taxfree_flow_lang';
const EUR_RATE_STORAGE_KEY = 'taxfree_last_eur_rate';

// Consolidates multiple Final Payout cards with the same base reference into ONE single card
export function consolidatePayoutTransactions(txs: Transaction[]): Transaction[] {
  const nonPayout: Transaction[] = [];
  const payoutMap = new Map<string, Transaction>();
  const toDeleteIds: string[] = [];

  for (const tx of txs) {
    if (tx.status === 'final_payout') {
      const baseRef = cleanReference(tx.reference || tx.originReference);
      const key = `${tx.account}_${baseRef}`;

      if (payoutMap.has(key)) {
        const existing = payoutMap.get(key)!;
        const currentAmt = tx.payoutAmount || tx.cihAmount || 0;
        const existingAmt = existing.payoutAmount || existing.cihAmount || 0;
        const totalAmt = Number((existingAmt + currentAmt).toFixed(2));
        const rate = existing.eurRate || tx.eurRate || 10.85;
        const origTotal = existing.originalCihAmount || tx.originalCihAmount || totalAmt;

        existing.payoutAmount = totalAmt;
        existing.cihAmount = totalAmt;
        existing.eurAmount = Number((totalAmt / rate).toFixed(2));
        existing.reference = baseRef;
        existing.originReference = baseRef;
        existing.originalCihAmount = origTotal;
        existing.isSplit = existing.isSplit || tx.isSplit || (origTotal > totalAmt);
        if (tx.notes && !existing.notes?.includes(tx.notes)) {
          existing.notes = existing.notes ? `${existing.notes} | ${tx.notes}` : tx.notes;
        }

        // Merge payout history
        const existingHistory = existing.payoutHistory || [{
          id: 'hist-1',
          amount: existingAmt,
          date: existing.payoutDate || existing.date,
          recipient: existing.recipient || 'Partner',
          originReference: baseRef,
          notes: existing.notes
        }];
        const currentHistory = tx.payoutHistory || [{
          id: 'hist-2',
          amount: currentAmt,
          date: tx.payoutDate || tx.date,
          recipient: tx.recipient || 'Partner',
          originReference: baseRef,
          notes: tx.notes
        }];
        existing.payoutHistory = [...existingHistory, ...currentHistory];

        if (tx.id !== existing.id) {
          toDeleteIds.push(tx.id);
        }
      } else {
        const cleanTx = { 
          ...tx, 
          reference: baseRef,
          originReference: tx.originReference || baseRef
        };
        payoutMap.set(key, cleanTx);
      }
    } else {
      nonPayout.push(tx);
    }
  }

  // Check if any CIH transactions were split but lack an active Final Payout card in the map
  for (const nonP of nonPayout) {
    if (nonP.status === 'settled_cih' || nonP.status === 'transferred_to_hicham') {
      const baseRef = cleanReference(nonP.reference || nonP.originReference || nonP.source);
      const key = `${nonP.account}_${baseRef}`;
      const origTotal = nonP.originalCihAmount || 0;
      const currentCih = nonP.cihAmount || 0;
      const paidDiff = origTotal > currentCih ? Number((origTotal - currentCih).toFixed(2)) : 0;

      if (paidDiff > 0.01 && !payoutMap.has(key)) {
        const rate = nonP.eurRate || 10.85;
        const autoPayoutCard: Transaction = {
          id: `tx-payout-auto-${nonP.id}`,
          account: nonP.account,
          date: nonP.date,
          source: nonP.source,
          reference: baseRef,
          originReference: baseRef,
          originalCihAmount: origTotal,
          remainingCihAmount: currentCih,
          totalPaidOutMAD: paidDiff,
          isSplit: true,
          status: 'final_payout',
          kastAmount: Number((paidDiff / (nonP.exchangeRate || 9.90)).toFixed(2)),
          cihAmount: paidDiff,
          payoutAmount: paidDiff,
          eurRate: rate,
          eurAmount: Number((paidDiff / rate).toFixed(2)),
          recipient: nonP.recipient || (nonP.account === 'adnan' ? 'Adnan' : nonP.account === 'zouhir' ? 'Zouhir' : 'Hicham'),
          payoutDate: nonP.payoutDate || nonP.date,
          payoutMethod: nonP.payoutMethod || 'Bank Transfer / Cash',
          payoutHistory: [{
            id: 'inst-auto-1',
            amount: paidDiff,
            date: nonP.payoutDate || nonP.date,
            recipient: nonP.recipient || (nonP.account === 'adnan' ? 'Adnan' : nonP.account === 'zouhir' ? 'Zouhir' : 'Hicham'),
            originReference: baseRef,
            orderTotal: origTotal,
            notes: `Split payment from ${baseRef}`
          }],
          notes: `Split payment from ${baseRef}`,
          createdAt: nonP.createdAt || Date.now(),
          updatedAt: Date.now(),
        };

        payoutMap.set(key, autoPayoutCard);
      }
    }
  }

  // Delete redundant duplicate split cards from Firebase
  if (isFirebaseConfigured && toDeleteIds.length > 0) {
    toDeleteIds.forEach(id => deleteTransactionFromFirebase(id));
  }

  return [...nonPayout, ...Array.from(payoutMap.values())];
}

interface TransactionStore {
  transactions: Transaction[];
  selectedAccount: AccountId;
  language: Language;
  lastEurRate: number;
  isLoaded: boolean;
  
  // Modals
  isQuickAddOpen: boolean;
  quickAddStage: PipelineStatus;
  moveModalTx: { tx: Transaction; targetStage: PipelineStatus } | null;
  isReportOpen: boolean;
  
  // Actions
  setSelectedAccount: (account: AccountId) => void;
  setLanguage: (lang: Language) => void;
  setLastEurRate: (rate: number) => void;
  t: () => Translations;
  
  openQuickAdd: (stage?: PipelineStatus) => void;
  closeQuickAdd: () => void;
  
  openMoveModal: (tx: Transaction, targetStage: PipelineStatus) => void;
  closeMoveModal: () => void;
  
  setReportOpen: (open: boolean) => void;
  
  setTransactions: (txs: Transaction[]) => void;
  initStore: () => () => void;
  
  addTransaction: (data: {
    account: 'hicham' | 'zouhir' | 'adnan';
    kastAmount: number;
    source?: string;
    reference?: string;
    notes?: string;
    date?: string;
    stage?: PipelineStatus;
  }) => Promise<void>;
  
  moveTransactionStage: (
    id: string, 
    targetStage: PipelineStatus, 
    extraData?: {
      binanceAmount?: number;
      binanceFee?: number;
      cihAmount?: number;
      exchangeRate?: number;
      eurRate?: number;
      eurAmount?: number;
      recipient?: string;
      payoutAmount?: number;
      payoutDate?: string;
      payoutMethod?: string;
      notes?: string;
    }
  ) => Promise<void>;
  
  deleteTransaction: (id: string) => Promise<void>;
  updateEurRate: (id: string, newRate: number) => Promise<void>;
  clearAll: () => void;
  
  getMetrics: () => {
    totalInKastUSD: number;
    totalInBinanceUSD: number;
    totalSettledCIHMAD: number;
    totalSettledEUR: number;
    totalFinalPayoutMAD: number;
    totalFinalPayoutEUR: number;
    totalFeesUSD: number;
    count: number;
  };
  getFilteredTransactions: () => Transaction[];
}

const saveStorage = (txs: Transaction[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
  } catch (e) {
    console.error(e);
  }
};

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  selectedAccount: 'all',
  language: 'en',
  lastEurRate: 10.85,
  isLoaded: false,
  
  isQuickAddOpen: false,
  quickAddStage: 'in_kast',
  moveModalTx: null,
  isReportOpen: false,

  setSelectedAccount: (acc) => set({ selectedAccount: acc }),
  
  setLanguage: (lang) => {
    set({ language: lang });
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  },

  setLastEurRate: (rate) => {
    if (!isNaN(rate) && rate > 0) {
      set({ lastEurRate: rate });
      if (typeof window !== 'undefined') {
        localStorage.setItem(EUR_RATE_STORAGE_KEY, rate.toString());
      }
    }
  },

  t: () => translations[get().language] || translations.en,

  openQuickAdd: (stage = 'in_kast') => set({ isQuickAddOpen: true, quickAddStage: stage }),
  closeQuickAdd: () => set({ isQuickAddOpen: false }),

  openMoveModal: (tx, targetStage) => set({ moveModalTx: { tx, targetStage } }),
  closeMoveModal: () => set({ moveModalTx: null }),
  
  setReportOpen: (open) => set({ isReportOpen: open }),

  setTransactions: (txs) => {
    const consolidated = consolidatePayoutTransactions(txs);
    set({ transactions: consolidated, isLoaded: true });
    saveStorage(consolidated);
  },

  initStore: () => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY) as Language;
      if (savedLang && (savedLang === 'en' || savedLang === 'es' || savedLang === 'ar')) {
        set({ language: savedLang });
        document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = savedLang;
      }

      const savedRate = localStorage.getItem(EUR_RATE_STORAGE_KEY);
      if (savedRate) {
        const parsedRate = parseFloat(savedRate);
        if (!isNaN(parsedRate) && parsedRate > 0) {
          set({ lastEurRate: parsedRate });
        }
      }
    }

    if (isFirebaseConfigured) {
      const unsubscribe = subscribeToTransactions((txs) => {
        const consolidated = consolidatePayoutTransactions(txs);
        set({ transactions: consolidated, isLoaded: true });
        saveStorage(consolidated);
      });
      if (unsubscribe) return unsubscribe;
    }

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const consolidated = consolidatePayoutTransactions(parsed);
            set({ transactions: consolidated, isLoaded: true });
            return () => {};
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    set({ transactions: [], isLoaded: true });
    return () => {};
  },

  addTransaction: async (data) => {
    const today = new Date().toISOString().split('T')[0];
    const newTx: Transaction = {
      id: 'tx-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      account: data.account,
      date: data.date || today,
      source: data.source || 'Global Blue Refund',
      reference: data.reference || `GB-${Math.floor(10000 + Math.random() * 90000)}`,
      kastAmount: data.kastAmount,
      status: data.stage || 'in_kast',
      notes: data.notes || '',
      eurRate: get().lastEurRate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (data.account === 'adnan' && data.stage === 'transferred_to_hicham') {
      newTx.transferredToHicham = true;
    }

    const updated = [newTx, ...get().transactions];
    set({ transactions: updated, isQuickAddOpen: false });
    saveStorage(updated);

    if (isFirebaseConfigured) {
      await saveTransactionToFirebase(newTx);
    }
  },

  moveTransactionStage: async (id, targetStage, extraData = {}) => {
    const tx = get().transactions.find(t => t.id === id);
    if (!tx) return;

    const today = new Date().toISOString().split('T')[0];
    const currentLastRate = get().lastEurRate;
    const baseRef = cleanReference(tx.reference);
    const eurR = extraData.eurRate || tx.eurRate || currentLastRate || 10.85;

    if (extraData.eurRate && !isNaN(extraData.eurRate) && extraData.eurRate > 0) {
      get().setLastEurRate(extraData.eurRate);
    }

    // SPECIAL HANDLING: Moving from CIH Bank to Final Payout with single-card accumulation and crystal-clear split tracking
    if (targetStage === 'final_payout') {
      const currentCih = tx.cihAmount ?? (tx.kastAmount * (tx.exchangeRate || 9.90));
      const payoutMAD = extraData.payoutAmount ?? currentCih;
      const remainingMAD = Number((currentCih - payoutMAD).toFixed(2));
      const recipient = extraData.recipient || (tx.account === 'adnan' ? 'Adnan' : tx.account === 'zouhir' ? 'Zouhir' : 'Hicham');
      const origTotal = tx.originalCihAmount || currentCih;
      const isSplitNow = remainingMAD > 0.01 || (tx.isSplit ?? false) || (origTotal > payoutMAD);
      
      const newInstallment: PayoutInstallment = {
        id: 'inst-' + Date.now(),
        amount: payoutMAD,
        date: extraData.payoutDate || today,
        recipient: recipient,
        method: extraData.payoutMethod || 'Bank Transfer / Cash',
        originReference: baseRef,
        orderTotal: origTotal,
        notes: extraData.notes
      };

      // Check if a Final Payout card for this transaction already exists
      const existingPayoutCard = get().transactions.find(t => 
        t.status === 'final_payout' && 
        cleanReference(t.reference || t.originReference) === baseRef
      );

      let nextTransactions: Transaction[] = [];
      let txToSave: Transaction[] = [];
      let txToDeleteIds: string[] = [];

      if (existingPayoutCard) {
        // Accumulate onto existing Final Payout card
        const updatedTotal = Number(((existingPayoutCard.payoutAmount || 0) + payoutMAD).toFixed(2));
        const prevHist: PayoutInstallment[] = (existingPayoutCard.payoutHistory && existingPayoutCard.payoutHistory.length > 0)
          ? existingPayoutCard.payoutHistory
          : [{
              id: 'inst-prev-' + existingPayoutCard.id,
              amount: existingPayoutCard.payoutAmount || existingPayoutCard.cihAmount || 0,
              date: existingPayoutCard.payoutDate || existingPayoutCard.date,
              recipient: existingPayoutCard.recipient || recipient,
              method: existingPayoutCard.payoutMethod || 'Cash',
              originReference: baseRef,
              orderTotal: origTotal,
            }];
        const updatedHistory = [...prevHist, newInstallment];

        const updatedPayoutCard: Transaction = {
          ...existingPayoutCard,
          payoutAmount: updatedTotal,
          cihAmount: updatedTotal,
          eurRate: eurR,
          eurAmount: Number((updatedTotal / eurR).toFixed(2)),
          recipient: recipient,
          payoutDate: extraData.payoutDate || today,
          payoutMethod: extraData.payoutMethod || existingPayoutCard.payoutMethod,
          payoutHistory: updatedHistory,
          isSplit: isSplitNow,
          originReference: baseRef,
          originalCihAmount: origTotal,
          remainingCihAmount: remainingMAD,
          totalPaidOutMAD: updatedTotal,
          updatedAt: Date.now(),
        };

        txToSave.push(updatedPayoutCard);

        if (remainingMAD > 0.01) {
          // Update CIH Card with remaining balance
          const updatedCihCard: Transaction = {
            ...tx,
            cihAmount: remainingMAD,
            eurRate: eurR,
            eurAmount: Number((remainingMAD / eurR).toFixed(2)),
            reference: `${baseRef} (Remaining)`,
            originReference: baseRef,
            originalCihAmount: origTotal,
            remainingCihAmount: remainingMAD,
            totalPaidOutMAD: (tx.totalPaidOutMAD || 0) + payoutMAD,
            isSplit: true,
            notes: `Remaining balance from ${baseRef} (${formatMAD(remainingMAD)} left of ${formatMAD(origTotal)})`,
            updatedAt: Date.now(),
          };

          txToSave.push(updatedCihCard);

          nextTransactions = get().transactions.map(t => {
            if (t.id === existingPayoutCard.id) return updatedPayoutCard;
            if (t.id === tx.id) return updatedCihCard;
            return t;
          });
        } else {
          // 0 remaining in CIH: remove CIH card completely
          txToDeleteIds.push(tx.id);
          nextTransactions = get().transactions
            .filter(t => t.id !== tx.id)
            .map(t => (t.id === existingPayoutCard.id ? updatedPayoutCard : t));
        }
      } else {
        // No existing Final Payout card -> create ONE card in Final Payout
        if (remainingMAD > 0.01) {
          const newPayoutCard: Transaction = {
            id: 'tx-payout-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
            account: tx.account,
            date: tx.date,
            source: tx.source,
            reference: baseRef,
            originReference: baseRef,
            originalCihAmount: origTotal,
            remainingCihAmount: remainingMAD,
            totalPaidOutMAD: payoutMAD,
            isSplit: true,
            status: 'final_payout',
            kastAmount: Number((payoutMAD / (tx.exchangeRate || 9.90)).toFixed(2)),
            cihAmount: payoutMAD,
            payoutAmount: payoutMAD,
            eurRate: eurR,
            eurAmount: Number((payoutMAD / eurR).toFixed(2)),
            recipient: recipient,
            payoutDate: extraData.payoutDate || today,
            payoutMethod: extraData.payoutMethod || 'Bank Transfer / Cash',
            payoutHistory: [newInstallment],
            notes: extraData.notes || '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          const updatedCihCard: Transaction = {
            ...tx,
            cihAmount: remainingMAD,
            eurRate: eurR,
            eurAmount: Number((remainingMAD / eurR).toFixed(2)),
            reference: `${baseRef} (Remaining)`,
            originReference: baseRef,
            originalCihAmount: origTotal,
            remainingCihAmount: remainingMAD,
            totalPaidOutMAD: (tx.totalPaidOutMAD || 0) + payoutMAD,
            isSplit: true,
            notes: `Remaining balance from ${baseRef} (${formatMAD(remainingMAD)} left of ${formatMAD(origTotal)})`,
            updatedAt: Date.now(),
          };

          txToSave.push(newPayoutCard, updatedCihCard);

          nextTransactions = [
            newPayoutCard,
            ...get().transactions.map(t => (t.id === tx.id ? updatedCihCard : t))
          ];
        } else {
          // Full 100% payout in one go -> transform CIH card into Final Payout card
          const fullPayoutCard: Transaction = {
            ...tx,
            status: 'final_payout',
            reference: baseRef,
            originReference: baseRef,
            originalCihAmount: origTotal,
            remainingCihAmount: 0,
            totalPaidOutMAD: payoutMAD,
            isSplit: tx.isSplit || false,
            cihAmount: payoutMAD,
            payoutAmount: payoutMAD,
            eurRate: eurR,
            eurAmount: Number((payoutMAD / eurR).toFixed(2)),
            recipient: recipient,
            payoutDate: extraData.payoutDate || today,
            payoutMethod: extraData.payoutMethod || 'Bank Transfer / Cash',
            payoutHistory: [newInstallment],
            updatedAt: Date.now(),
          };

          txToSave.push(fullPayoutCard);

          nextTransactions = get().transactions.map(t => (t.id === tx.id ? fullPayoutCard : t));
        }
      }

      set({ transactions: nextTransactions, moveModalTx: null });
      saveStorage(nextTransactions);

      if (isFirebaseConfigured) {
        for (const item of txToSave) {
          await saveTransactionToFirebase(item);
        }
        for (const delId of txToDeleteIds) {
          await deleteTransactionFromFirebase(delId);
        }
      }
      return;
    }

    // Standard moves for other stages (KAST -> Binance -> CIH)
    const updated = get().transactions.map(t => {
      if (t.id === id) {
        const merged: Transaction = {
          ...t,
          status: targetStage,
          updatedAt: Date.now(),
        };

        if (targetStage === 'in_binance') {
          const fee = extraData.binanceFee ?? (extraData.binanceAmount ? Number((t.kastAmount - extraData.binanceAmount).toFixed(2)) : Number((t.kastAmount * 0.01).toFixed(2)));
          merged.binanceAmount = extraData.binanceAmount ?? Number((t.kastAmount - fee).toFixed(2));
          merged.binanceFee = fee;
        }

        if (targetStage === 'settled_cih') {
          const baseUSD = t.binanceAmount || t.kastAmount;
          const rate = extraData.exchangeRate ?? 9.90;
          merged.exchangeRate = rate;
          const cihMAD = extraData.cihAmount ?? Number((baseUSD * rate).toFixed(2));
          merged.cihAmount = cihMAD;
          merged.eurRate = eurR;
          merged.eurAmount = extraData.eurAmount ?? Number((cihMAD / eurR).toFixed(2));
        }

        if (targetStage === 'transferred_to_hicham') {
          merged.transferredToHicham = true;
        }

        if (extraData.notes) {
          merged.notes = extraData.notes;
        }

        return merged;
      }
      return t;
    });

    set({ transactions: updated, moveModalTx: null });
    saveStorage(updated);

    const changed = updated.find(t => t.id === id);
    if (changed && isFirebaseConfigured) {
      await saveTransactionToFirebase(changed);
    }
  },

  deleteTransaction: async (id) => {
    const updated = get().transactions.filter(t => t.id !== id);
    set({ transactions: updated });
    saveStorage(updated);

    if (isFirebaseConfigured) {
      await deleteTransactionFromFirebase(id);
    }
  },

  updateEurRate: async (id, newRate) => {
    const tx = get().transactions.find(t => t.id === id);
    if (!tx || isNaN(newRate) || newRate <= 0) return;

    // Remember as the last used rate globally
    get().setLastEurRate(newRate);

    const madAmt = tx.payoutAmount || tx.cihAmount || 0;
    const newEurAmt = madAmt > 0 ? Number((madAmt / newRate).toFixed(2)) : undefined;

    const updated = get().transactions.map(t => {
      if (t.id === id) {
        return {
          ...t,
          eurRate: newRate,
          eurAmount: newEurAmt,
          updatedAt: Date.now(),
        };
      }
      return t;
    });

    set({ transactions: updated });
    saveStorage(updated);

    const changed = updated.find(t => t.id === id);
    if (changed && isFirebaseConfigured) {
      await saveTransactionToFirebase(changed);
    }
  },

  clearAll: () => {
    set({ transactions: [] });
    saveStorage([]);
  },

  getFilteredTransactions: () => {
    const { transactions, selectedAccount } = get();
    if (selectedAccount === 'all') return transactions;
    return transactions.filter(t => 
      t.account === selectedAccount || 
      (t.recipient && t.recipient.toLowerCase().includes(selectedAccount.toLowerCase()))
    );
  },

  getMetrics: () => {
    const list = get().getFilteredTransactions();
    const fallbackRate = get().lastEurRate || 10.85;
    let totalInKastUSD = 0;
    let totalInBinanceUSD = 0;
    let totalSettledCIHMAD = 0;
    let totalSettledEUR = 0;
    let totalFinalPayoutMAD = 0;
    let totalFinalPayoutEUR = 0;
    let totalFeesUSD = 0;

    list.forEach(tx => {
      if (tx.binanceFee) {
        totalFeesUSD += tx.binanceFee;
      }
      if (tx.status === 'in_kast') {
        totalInKastUSD += tx.kastAmount || 0;
      } else if (tx.status === 'in_binance') {
        totalInBinanceUSD += (tx.binanceAmount || tx.kastAmount || 0);
      } else if (tx.status === 'settled_cih') {
        totalSettledCIHMAD += tx.cihAmount || 0;
        const rate = tx.eurRate || fallbackRate;
        totalSettledEUR += (tx.eurAmount || (tx.cihAmount ? tx.cihAmount / rate : 0));
      } else if (tx.status === 'final_payout') {
        const pMAD = (tx.payoutAmount || tx.cihAmount || 0);
        totalFinalPayoutMAD += pMAD;
        const rate = tx.eurRate || fallbackRate;
        totalFinalPayoutEUR += (tx.eurAmount || (pMAD / rate));
      }
    });

    return {
      totalInKastUSD,
      totalInBinanceUSD,
      totalSettledCIHMAD,
      totalSettledEUR,
      totalFinalPayoutMAD,
      totalFinalPayoutEUR,
      totalFeesUSD,
      count: list.length
    };
  }
}));
