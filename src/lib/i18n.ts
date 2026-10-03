export type Language = 'en' | 'es' | 'ar';

export interface Translations {
  allAccounts: string;
  step1Tag: string;
  totalKast: string;
  kastSubtitle: string;
  step2Tag: string;
  totalBinance: string;
  binanceSubtitle: string;
  step3Tag: string;
  totalCIH: string;
  cihSubtitle: string;
  addBtn: string;
  dragHere: string;
  dragToMove: string;
  toBinance: string;
  toCIH: string;
  toHicham: string;
  feeDeducted: string;
  ratePerUSD: string;
  deleteConfirm: string;
  addToKastTitle: string;
  addToKastSubtitle: string;
  accountProfile: string;
  amountKastUSD: string;
  refVoucher: string;
  date: string;
  notesOptional: string;
  cancel: string;
  addTransactionBtn: string;
  transferToBinanceTitle: string;
  withdrawToCIHTitle: string;
  netBinanceAmount: string;
  transferFeeUSD: string;
  p2pRate: string;
  finalSettledCIH: string;
  confirmMove: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    allAccounts: 'All Accounts',
    step1Tag: 'STEP 1 • DIGITAL WALLET',
    totalKast: 'Total in KAST',
    kastSubtitle: 'Incoming Global Blue funds awaiting bridge',
    step2Tag: 'STEP 2 • EXCHANGE POOL',
    totalBinance: 'Total in Binance',
    binanceSubtitle: 'Bridged to exchange, ready to P2P withdraw',
    step3Tag: 'STEP 3 • LOCAL SETTLEMENT',
    totalCIH: 'Total Settled in CIH',
    cihSubtitle: 'Fully settled in local Moroccan bank account',
    addBtn: '+ Add',
    dragHere: 'Drag items here',
    dragToMove: 'Drag to move',
    toBinance: '→ Binance',
    toCIH: '→ CIH',
    toHicham: '→ Hicham',
    feeDeducted: 'Fee:',
    ratePerUSD: 'MAD/USD',
    deleteConfirm: 'Delete this transaction?',
    addToKastTitle: 'Add to KAST',
    addToKastSubtitle: 'Incoming tax free USD refund',
    accountProfile: 'Account / Profile',
    amountKastUSD: 'Amount in KAST ($ USD) *',
    refVoucher: 'Ref / Voucher #',
    date: 'Date',
    notesOptional: 'Notes (Optional)',
    cancel: 'Cancel',
    addTransactionBtn: 'Add to KAST',
    transferToBinanceTitle: 'Transfer to Binance',
    withdrawToCIHTitle: 'Withdraw to CIH Bank',
    netBinanceAmount: 'Net Amount Received in Binance (USDT/USD)',
    transferFeeUSD: 'Transfer Fee Deducted ($)',
    p2pRate: 'P2P Exchange Rate (MAD per 1 USD)',
    finalSettledCIH: 'Final Settled in CIH Bank (MAD)',
    confirmMove: 'Confirm Move',
  },
  es: {
    allAccounts: 'Todos los perfiles',
    step1Tag: 'PASO 1 • BILLETERA DIGITAL',
    totalKast: 'Total en KAST',
    kastSubtitle: 'Fondos de Global Blue en espera de transferencia',
    step2Tag: 'PASO 2 • PLATAFORMA CRIPTO',
    totalBinance: 'Total en Binance',
    binanceSubtitle: 'Transferido a Binance, listo para P2P',
    step3Tag: 'PASO 3 • LIQUIDACIÓN LOCAL',
    totalCIH: 'Total Liquidado en CIH',
    cihSubtitle: 'Completamente ingresado en cuenta bancaria marroquí',
    addBtn: '+ Añadir',
    dragHere: 'Arrastra elementos aquí',
    dragToMove: 'Arrastrar para mover',
    toBinance: '→ Binance',
    toCIH: '→ CIH',
    toHicham: '→ Hicham',
    feeDeducted: 'Comisión:',
    ratePerUSD: 'MAD/USD',
    deleteConfirm: '¿Eliminar esta transacción?',
    addToKastTitle: 'Añadir a KAST',
    addToKastSubtitle: 'Reembolso Tax Free entrante en USD',
    accountProfile: 'Perfil / Cuenta',
    amountKastUSD: 'Monto en KAST ($ USD) *',
    refVoucher: 'Ref / Nº de Factura',
    date: 'Fecha',
    notesOptional: 'Notas (Opcional)',
    cancel: 'Cancelar',
    addTransactionBtn: 'Añadir a KAST',
    transferToBinanceTitle: 'Transferir a Binance',
    withdrawToCIHTitle: 'Retirar a CIH Bank',
    netBinanceAmount: 'Monto Neto en Binance (USDT/USD)',
    transferFeeUSD: 'Comisión de Transferencia ($)',
    p2pRate: 'Tipo de Cambio P2P (MAD por 1 USD)',
    finalSettledCIH: 'Monto Final Liquidado en CIH (MAD)',
    confirmMove: 'Confirmar Traslado',
  },
  ar: {
    allAccounts: 'جميع الحسابات',
    step1Tag: 'الخطوة 1 • المحفظة الرقمية',
    totalKast: 'المجموع في KAST',
    kastSubtitle: 'أموال Global Blue المستلمة في انتظار التحويل',
    step2Tag: 'الخطوة 2 • منصة التداول',
    totalBinance: 'المجموع في Binance',
    binanceSubtitle: 'تم التحويل إلى بينانس، جاهز للسحب P2P',
    step3Tag: 'الخطوة 3 • الاستلام البنكي المحلي',
    totalCIH: 'المجموع المستلم في CIH',
    cihSubtitle: 'تم الإيداع بالكامل في الحساب البنكي المغربي',
    addBtn: '+ إضافة',
    dragHere: 'اسحب المعاملات إلى هنا',
    dragToMove: 'اسحب للتنقل',
    toBinance: '← بينانس',
    toCIH: '← بنك CIH',
    toHicham: '← هشام',
    feeDeducted: 'الرسوم:',
    ratePerUSD: 'درهم/دولار',
    deleteConfirm: 'هل أنت متأكد من حذف هذه المعاملة؟',
    addToKastTitle: 'إضافة إلى KAST',
    addToKastSubtitle: 'استرداد ضريبي وارد بالدولار (USD)',
    accountProfile: 'الحساب / الملف',
    amountKastUSD: 'المبلغ في KAST ($ USD) *',
    refVoucher: 'رقم الإيصال / المرجع',
    date: 'التاريخ',
    notesOptional: 'ملاحظات (اختياري)',
    cancel: 'إلغاء',
    addTransactionBtn: 'إضافة إلى KAST',
    transferToBinanceTitle: 'تحويل إلى Binance',
    withdrawToCIHTitle: 'سحب إلى بنك CIH',
    netBinanceAmount: 'المبلغ الصافي في بينانس (USDT/USD)',
    transferFeeUSD: 'رسوم التحويل المقتطعة ($)',
    p2pRate: 'سعر الصرف P2P (درهم مقابل دولار)',
    finalSettledCIH: 'المبلغ النهائي المستلم في CIH (MAD)',
    confirmMove: 'تأكيد التحويل',
  },
};
