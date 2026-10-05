import { create } from 'zustand';
import { Transaction, AccountId, PipelineStatus, AccountSummary } from '@/types';
import { isFirebaseConfigured, saveTransactionToFirebase, deleteTransactionFromFirebase, subscribeToTransactions } from '@/lib/firebase';
import { Language, translations, Translations } from '@/lib/i18n';

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
    set({ transactions: txs, isLoaded: true });
    saveStorage(txs);
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
        set({ transactions: txs, isLoaded: true });
        saveStorage(txs);
      });
      if (unsubscribe) return unsubscribe;
    }

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            set({ transactions: parsed, isLoaded: true });
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

    const currentLastRate = get().lastEurRate;
    const extraCreatedTxs: Transaction[] = [];

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
          
          // Euro manual conversion
          const eurR = extraData.eurRate || t.eurRate || currentLastRate || 10.85;
          merged.eurRate = eurR;
          merged.eurAmount = extraData.eurAmount ?? Number((cihMAD / eurR).toFixed(2));
        }

        if (targetStage === 'final_payout') {
          const currentCih = t.cihAmount ?? (t.kastAmount * (t.exchangeRate || 9.90));
          const payoutMAD = extraData.payoutAmount ?? currentCih;
          const eurR = extraData.eurRate || t.eurRate || currentLastRate || 10.85;

          const isPartial = currentCih > 0 && payoutMAD > 0 && (currentCih - payoutMAD) >= 0.01;

          if (isPartial) {
            const remainingMAD = Number((currentCih - payoutMAD).toFixed(2));
            const exRate = t.exchangeRate || 9.90;
            const refBase = t.reference || t.source || 'GB-Payout';

            // 1. Current transaction becomes the Paid Out portion
            merged.status = 'final_payout';
            merged.recipient = extraData.recipient || (t.account === 'adnan' ? 'Adnan' : t.account === 'zouhir' ? 'Zouhir' : 'Hicham');
            merged.cihAmount = payoutMAD;
            merged.payoutAmount = payoutMAD;
            merged.payoutDate = extraData.payoutDate || new Date().toISOString().split('T')[0];
            merged.payoutMethod = extraData.payoutMethod || 'Cash / Bank Transfer';
            merged.eurRate = eurR;
            merged.eurAmount = Number((payoutMAD / eurR).toFixed(2));
            merged.reference = `${refBase} (Paid)`;

            // 2. Create the remaining portion that stays in CIH Bank
            const remainingTx: Transaction = {
              id: 'tx-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
              account: t.account,
              date: t.date,
              source: t.source,
              reference: `${refBase.replace(' (Remaining)', '')} (Remaining)`,
              kastAmount: Number((remainingMAD / exRate).toFixed(2)),
              binanceAmount: Number((remainingMAD / exRate).toFixed(2)),
              status: 'settled_cih',
              exchangeRate: exRate,
              cihAmount: remainingMAD,
              eurRate: eurR,
              eurAmount: Number((remainingMAD / eurR).toFixed(2)),
              notes: `Remaining balance from ${refBase}`,
              createdAt: Date.now() + 1,
              updatedAt: Date.now() + 1,
            };

            extraCreatedTxs.push(remainingTx);
          } else {
            // Full Payout
            merged.status = 'final_payout';
            merged.recipient = extraData.recipient || (t.account === 'adnan' ? 'Adnan' : t.account === 'zouhir' ? 'Zouhir' : 'Hicham');
            merged.payoutAmount = payoutMAD;
            merged.payoutDate = extraData.payoutDate || new Date().toISOString().split('T')[0];
            merged.payoutMethod = extraData.payoutMethod || 'Cash / Bank Transfer';
            merged.eurRate = eurR;
            merged.eurAmount = Number((payoutMAD / eurR).toFixed(2));
          }
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

    if (extraData.eurRate && !isNaN(extraData.eurRate) && extraData.eurRate > 0) {
      get().setLastEurRate(extraData.eurRate);
    }

    const finalTransactions = [...extraCreatedTxs, ...updated];
    set({ transactions: finalTransactions, moveModalTx: null });
    saveStorage(finalTransactions);

    if (isFirebaseConfigured) {
      const changed = finalTransactions.find(t => t.id === id);
      if (changed) await saveTransactionToFirebase(changed);
      for (const extra of extraCreatedTxs) {
        await saveTransactionToFirebase(extra);
      }
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
    return transactions.filter(t => t.account === selectedAccount);
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
