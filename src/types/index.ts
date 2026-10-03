export type AccountId = 'all' | 'hicham' | 'zouhir' | 'adnan';

export type PipelineStatus = 
  | 'in_kast' 
  | 'in_binance' 
  | 'settled_cih' 
  | 'final_payout'
  | 'transferred_to_hicham';

export interface Transaction {
  id: string;
  account: 'hicham' | 'zouhir' | 'adnan';
  date: string; // YYYY-MM-DD
  source: string; // e.g., 'Global Blue Refund'
  reference?: string; // e.g., 'GB-884920'
  
  // Step 1: KAST
  kastAmount: number; // USD
  kastFee?: number;
  
  // Step 2: Binance
  binanceAmount?: number | null; // USD/USDT after fees
  binanceFee?: number | null; // kastAmount - binanceAmount
  binanceTxId?: string;
  
  // Step 3: CIH Bank
  cihAmount?: number | null; // MAD (Moroccan Dirham)
  exchangeRate?: number | null; // MAD per 1 USD
  cihTxId?: string;

  // Step 4: Final Payout / Destination
  recipient?: string; // e.g., 'Adnan', 'Zouhir', 'Cash Payout'
  payoutAmount?: number | null; // MAD
  payoutDate?: string;
  payoutMethod?: string; // 'Cash', 'Bank Transfer', etc.

  // For Adnan workflow
  transferredToHicham?: boolean;
  hichamLinkedTxId?: string;

  // Overall metadata
  status: PipelineStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AccountSummary {
  id: 'hicham' | 'zouhir' | 'adnan';
  name: string;
  role: string;
  avatar: string;
  color: string;
  badgeBg: string;
  workflow: string;
}
