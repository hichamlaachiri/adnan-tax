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
  step4Tag: string;
  totalPayout: string;
  payoutSubtitle: string;
  addBtn: string;
  dragHere: string;
  dragToMove: string;
  toBinance: string;
  toCIH: string;
  toPayout: string;
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
  finalPayoutTitle: string;
  netBinanceAmount: string;
  transferFeeUSD: string;
  p2pRate: string;
  finalSettledCIH: string;
  recipientLabel: string;
  recipientPlaceholder: string;
  payoutAmountLabel: string;
  paymentMethodLabel: string;
  confirmMove: string;
  reportBtn: string;
  reportTitle: string;
  reportSubtitle: string;
  exportPDF: string;
  summaryTitle: string;
  statusKast: string;
  statusBinance: string;
  statusCIH: string;
  statusPayout: string;
  recipient: string;
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
    cihSubtitle: 'Withdrawn from Binance into CIH Bank',
    step4Tag: 'STEP 4 • FINAL DESTINATION',
    totalPayout: 'Total Final Payouts',
    payoutSubtitle: 'Delivered to final recipients / partners',
    addBtn: '+ Add',
    dragHere: 'Drag items here',
    dragToMove: 'Drag to move',
    toBinance: '→ Binance',
    toCIH: '→ CIH',
    toPayout: '→ Payout',
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
    finalPayoutTitle: 'Final Payout & Destination',
    netBinanceAmount: 'Net Amount Received in Binance (USDT/USD)',
    transferFeeUSD: 'Transfer Fee Deducted ($)',
    p2pRate: 'P2P Exchange Rate (MAD per 1 USD)',
    finalSettledCIH: 'Final Settled in CIH Bank (MAD)',
    recipientLabel: 'Recipient / Final Destination',
    recipientPlaceholder: 'e.g. Adnan, Zouhir, Cash Payout...',
    payoutAmountLabel: 'Payout Amount (MAD)',
    paymentMethodLabel: 'Delivery Method',
    confirmMove: 'Confirm Move',
    reportBtn: 'Report & Export',
    reportTitle: 'Financial Flow Statement',
    reportSubtitle: 'Tax Free Refunds → KAST → Binance → CIH → Payouts',
    exportPDF: 'Print / Save PDF',
    summaryTitle: 'Overview Summary',
    statusKast: 'In KAST',
    statusBinance: 'In Binance',
    statusCIH: 'In CIH Bank',
    statusPayout: 'Paid Out',
    recipient: 'Recipient',
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
    cihSubtitle: 'Retirado de Binance a cuenta CIH Bank',
    step4Tag: 'PASO 4 • DESTINO FINAL',
    totalPayout: 'Total Pagos Finales',
    payoutSubtitle: 'Entregado a destinatarios / socios',
    addBtn: '+ Añadir',
    dragHere: 'Arrastra elementos aquí',
    dragToMove: 'Arrastrar para mover',
    toBinance: '→ Binance',
    toCIH: '→ CIH',
    toPayout: '→ Pago Final',
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
    finalPayoutTitle: 'Pago y Destino Final',
    netBinanceAmount: 'Monto Neto en Binance (USDT/USD)',
    transferFeeUSD: 'Comisión de Transferencia ($)',
    p2pRate: 'Tipo de Cambio P2P (MAD por 1 USD)',
    finalSettledCIH: 'Monto Final Liquidado en CIH (MAD)',
    recipientLabel: 'Destinatario / Destino Final',
    recipientPlaceholder: 'ej. Adnan, Zouhir, Efectivo...',
    payoutAmountLabel: 'Monto Pagado (MAD)',
    paymentMethodLabel: 'Método de Entrega',
    confirmMove: 'Confirmar Traslado',
    reportBtn: 'Informe y Exportar',
    reportTitle: 'Informe de Flujo Financiero',
    reportSubtitle: 'Tax Free Refunds → KAST → Binance → CIH → Pagos',
    exportPDF: 'Imprimir / Guardar PDF',
    summaryTitle: 'Resumen General',
    statusKast: 'En KAST',
    statusBinance: 'En Binance',
    statusCIH: 'En CIH Bank',
    statusPayout: 'Pagado',
    recipient: 'Destinatario',
  },
  ar: {
    allAccounts: 'جميع الحسابات',
    step1Tag: 'الخطوة 1 • المحفظة الرقمية',
    totalKast: 'المجموع في KAST',
    kastSubtitle: 'أموال Global Blue المستلمة في انتظار التحويل',
    step2Tag: 'الخطوة 2 • منصة التداول',
    totalBinance: 'المجموع في Binance',
    binanceSubtitle: 'تم التحويل إلى بينانس، جاهز للسحب P2P',
    step3Tag: 'الخطوة 3 • الاستلام في CIH',
    totalCIH: 'المجموع المستلم في CIH',
    cihSubtitle: 'تم السحب من بينانس إلى حساب بنك CIH',
    step4Tag: 'الخطوة 4 • الوجهة النهائية / الدفع',
    totalPayout: 'مجموع المدفوعات النهائية',
    payoutSubtitle: 'تم تسليم المبالغ للمستفيدين والشركاء',
    addBtn: '+ إضافة',
    dragHere: 'اسحب المعاملات إلى هنا',
    dragToMove: 'اسحب للتنقل',
    toBinance: '← بينانس',
    toCIH: '← بنك CIH',
    toPayout: '← الدفع النهائي',
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
    finalPayoutTitle: 'الدفع النهائي والوجهة',
    netBinanceAmount: 'المبلغ الصافي في بينانس (USDT/USD)',
    transferFeeUSD: 'رسوم التحويل المقتطعة ($)',
    p2pRate: 'سعر الصرف P2P (درهم مقابل دولار)',
    finalSettledCIH: 'المبلغ المستلم في CIH (MAD)',
    recipientLabel: 'المستفيد / الوجهة النهائية',
    recipientPlaceholder: 'مثال: عدنان، زهير، تسليم نقدي...',
    payoutAmountLabel: 'المبلغ المدفوع (MAD)',
    paymentMethodLabel: 'طريقة الدفع والتسليم',
    confirmMove: 'تأكيد التحويل',
    reportBtn: 'التقرير والطباعة',
    reportTitle: 'كشف الحركات المالية الشامل',
    reportSubtitle: 'Tax Free Refunds → KAST → Binance → CIH → التسليم النهائي',
    exportPDF: 'طباعة / حفظ PDF',
    summaryTitle: 'ملخص الأرصدة',
    statusKast: 'في KAST',
    statusBinance: 'في بينانس',
    statusCIH: 'في بنك CIH',
    statusPayout: 'تم التسليم',
    recipient: 'المستفيد',
  },
};
