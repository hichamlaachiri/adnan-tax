'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTransactionStore, PROFILES } from '@/store/useTransactionStore';
import { PipelineStatus, ProofImage, StageHistoryEntry, Transaction } from '@/types';
import { formatUSD, formatMAD, formatDate, cleanReference } from '@/lib/utils';
import {
  X,
  Upload,
  Trash2,
  Download,
  Maximize2,
  ClipboardPaste,
  Loader2,
  AlertCircle,
  Paperclip,
  Clock,
} from 'lucide-react';

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.72;
const MAX_TOTAL_BYTES = 750_000;

const STAGE_META: Record<PipelineStatus, { label: string; dot: string }> = {
  in_kast: { label: 'Step 1 · KAST', dot: 'bg-blue-600' },
  in_binance: { label: 'Step 2 · Binance', dot: 'bg-amber-600' },
  settled_cih: { label: 'Step 3 · CIH Bank', dot: 'bg-teal-600' },
  final_payout: { label: 'Step 4 · Payout', dot: 'bg-emerald-600' },
  transferred_to_hicham: { label: 'Transferred to Hicham', dot: 'bg-sky-600' },
};

const STAGE_SHORT: Record<PipelineStatus, string> = {
  in_kast: 'KAST',
  in_binance: 'Binance',
  settled_cih: 'CIH',
  final_payout: 'Payout',
  transferred_to_hicham: 'Hicham',
};

function buildTimeline(tx: Transaction): StageHistoryEntry[] {
  if (tx.stageHistory && tx.stageHistory.length > 0) {
    return [...tx.stageHistory].sort((a, b) => a.timestamp - b.timestamp);
  }

  // Fallback for legacy records created before stageHistory existed
  const entries: StageHistoryEntry[] = [];
  if (tx.kastAmount) {
    entries.push({
      id: 'legacy-kast',
      stage: 'in_kast',
      timestamp: tx.createdAt || 0,
      date: tx.date,
      amount: tx.kastAmount,
      currency: 'USD',
    });
  }
  if (tx.binanceAmount !== null && tx.binanceAmount !== undefined) {
    entries.push({
      id: 'legacy-binance',
      stage: 'in_binance',
      timestamp: (tx.createdAt || 0) + 1,
      date: tx.date,
      amount: tx.binanceAmount,
      currency: 'USDT',
      fee: tx.binanceFee ?? undefined,
      txId: tx.binanceTxId || undefined,
    });
  }
  if (
    (tx.cihAmount !== null && tx.cihAmount !== undefined) ||
    tx.originalCihAmount
  ) {
    entries.push({
      id: 'legacy-cih',
      stage: 'settled_cih',
      timestamp: (tx.createdAt || 0) + 2,
      date: tx.date,
      amount: tx.originalCihAmount || tx.cihAmount || 0,
      currency: 'MAD',
      rate: tx.exchangeRate ?? undefined,
      txId: tx.cihTxId || undefined,
    });
  }
  if (tx.status === 'final_payout' && tx.payoutAmount) {
    entries.push({
      id: 'legacy-payout',
      stage: 'final_payout',
      timestamp: tx.updatedAt || (tx.createdAt || 0) + 3,
      date: tx.payoutDate || tx.date,
      amount: tx.payoutAmount,
      currency: 'MAD',
      recipient: tx.recipient || undefined,
    });
  }
  return entries;
}

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        if (dataUrl.length > 350_000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.55);
        }
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const ProofModal: React.FC = () => {
  const {
    proofModalTxId,
    closeProofModal,
    transactions,
    addProofImage,
    removeProofImage,
  } = useTransactionStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<ProofImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tx = proofModalTxId ? transactions.find((t) => t.id === proofModalTxId) : null;
  const proofImages = tx?.proofImages || [];

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!tx) return;
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        setErrorMsg('Please select or paste a valid image file (PNG, JPG, WebP).');
        return;
      }

      setErrorMsg(null);
      setIsUploading(true);

      try {
        let currentSize = (tx.proofImages || []).reduce(
          (sum, img) => sum + img.dataUrl.length,
          0
        );

        for (const file of imageFiles) {
          const compressed = await compressImageFile(file);
          if (currentSize + compressed.length > MAX_TOTAL_BYTES) {
            setErrorMsg(
              'Storage limit reached for this card. Delete an old proof image before adding more.'
            );
            break;
          }

          const newImg: ProofImage = {
            id:
              'proof-' +
              Date.now().toString(36) +
              Math.random().toString(36).substring(2, 6),
            dataUrl: compressed,
            name: file.name || `Proof ${new Date().toLocaleDateString()}`,
            stage: tx.status,
            uploadedAt: Date.now(),
          };

          await addProofImage(tx.id, newImg);
          currentSize += compressed.length;
        }
      } catch (err) {
        console.error('Error processing proof image:', err);
        setErrorMsg('Could not process image. Please try another image.');
      } finally {
        setIsUploading(false);
      }
    },
    [tx, addProofImage]
  );

  useEffect(() => {
    if (!proofModalTxId) return;

    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pastedImages: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const f = items[i].getAsFile();
          if (f) pastedImages.push(f);
        }
      }
      if (pastedImages.length > 0) {
        e.preventDefault();
        handleFiles(pastedImages);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImg) {
          setLightboxImg(null);
        } else {
          closeProofModal();
        }
      }
    };

    window.addEventListener('paste', onPaste);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('paste', onPaste);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [proofModalTxId, handleFiles, lightboxImg, closeProofModal]);

  if (!tx) return null;

  const profile = PROFILES[tx.account];
  const timeline = buildTimeline(tx);
  const displayAmount =
    tx.status === 'final_payout'
      ? formatMAD(tx.payoutAmount || tx.cihAmount || 0)
      : tx.status === 'settled_cih' || tx.status === 'transferred_to_hicham'
      ? formatMAD(tx.cihAmount || 0)
      : tx.status === 'in_binance'
      ? formatUSD(tx.binanceAmount || tx.kastAmount)
      : formatUSD(tx.kastAmount);

  const stageLabel = STAGE_SHORT[tx.status] || 'KAST';

  return (
    <>
      <div
        onClick={closeProofModal}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden max-h-[90vh] flex flex-col animate-fadeIn"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--border-subtle)] shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
                  {cleanReference(tx.reference || tx.source)}
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-track)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  {stageLabel}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mt-1">
                <span>{profile.name.split(' ')[0]}</span>
                <span>·</span>
                <span className="font-mono tabular-nums font-semibold text-[var(--text-primary)]">
                  {displayAmount}
                </span>
                <span>·</span>
                <span className="font-mono tabular-nums">{formatDate(tx.date)}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={closeProofModal}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-track)] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Step-by-Step Traceability Timeline */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Traceability Timeline</span>
              </h4>

              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-track)] divide-y divide-[var(--border-subtle)]">
                {timeline.map((entry) => {
                  const meta = STAGE_META[entry.stage] || {
                    label: entry.stage,
                    dot: 'bg-slate-500',
                  };
                  const formattedAmount =
                    entry.amount !== undefined
                      ? entry.currency === 'MAD'
                        ? formatMAD(entry.amount)
                        : formatUSD(entry.amount)
                      : '—';

                  return (
                    <div
                      key={entry.id}
                      className="px-3.5 py-2.5 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${meta.dot}`}
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                            <span>{meta.label}</span>
                            {entry.recipient && (
                              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                                &rarr; {entry.recipient}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 flex-wrap mt-0.5 font-mono tabular-nums">
                            <span>{formatDate(entry.date)}</span>
                            {entry.fee !== undefined && entry.fee > 0 && (
                              <span className="text-rose-600 dark:text-rose-400">
                                Fee -{formatUSD(entry.fee)}
                              </span>
                            )}
                            {entry.rate !== undefined && entry.rate > 0 && (
                              <span className="text-teal-700 dark:text-teal-400">
                                @{entry.rate} MAD/USD
                              </span>
                            )}
                            {entry.txId && (
                              <span className="text-[var(--text-secondary)] bg-[var(--bg-surface)] px-1.5 py-0.2 rounded border border-[var(--border-subtle)]">
                                {entry.txId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="font-mono tabular-nums font-bold text-[var(--text-primary)] shrink-0">
                        {formattedAmount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upload / Drag & Drop / Paste Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFiles(e.dataTransfer.files);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30'
                  : 'border-[var(--border-strong)] hover:border-[var(--text-secondary)] bg-[var(--bg-track)]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFiles(e.target.files);
                    e.target.value = '';
                  }
                }}
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-2 py-1">
                  <Loader2 className="w-6 h-6 text-[var(--text-primary)] animate-spin" />
                  <p className="text-xs font-medium text-[var(--text-secondary)]">
                    Compressing &amp; saving proof...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      Click to upload, drag &amp; drop, or paste receipt ({stageLabel})
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center justify-center gap-1.5">
                      <ClipboardPaste className="w-3 h-3" />
                      <span>
                        Press{' '}
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[var(--bg-surface)] rounded border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                          Ctrl + V
                        </kbd>{' '}
                        to paste screenshot
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Attached Proofs Gallery */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>Attached Proofs ({proofImages.length})</span>
                </h4>
                {proofImages.length > 0 && (
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Click image to zoom
                  </span>
                )}
              </div>

              {proofImages.length === 0 ? (
                <div className="text-center py-6 rounded-xl bg-[var(--bg-track)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                  No proof images attached to this transaction yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {proofImages.map((img) => (
                    <div
                      key={img.id}
                      className="group relative rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-track)]"
                    >
                      <button
                        type="button"
                        onClick={() => setLightboxImg(img)}
                        className="block w-full aspect-4/3 overflow-hidden cursor-zoom-in"
                      >
                        <img
                          src={img.dataUrl}
                          alt={img.name || 'Payment proof'}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                        />
                      </button>

                      {img.stage && (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-black/70 text-white">
                          {STAGE_SHORT[img.stage] || img.stage}
                        </span>
                      )}

                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setLightboxImg(img)}
                          title="View full size"
                          className="p-1.5 rounded-lg bg-black/75 hover:bg-black text-white cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                        <a
                          href={img.dataUrl}
                          download={`${cleanReference(tx.reference || 'proof')}-${img.id}.jpg`}
                          title="Download proof"
                          className="p-1.5 rounded-lg bg-black/75 hover:bg-black text-white cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => removeProofImage(tx.id, img.id)}
                          title="Delete proof"
                          className="p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="px-2.5 py-1.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                        <span className="truncate font-medium text-[var(--text-secondary)]">
                          {img.name || 'Proof'}
                        </span>
                        <span className="shrink-0 ml-2 font-mono tabular-nums">
                          {new Date(img.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-[var(--border-subtle)] flex justify-end shrink-0">
            <button
              type="button"
              onClick={closeProofModal}
              className="px-4 py-1.5 text-xs font-semibold bg-[var(--bg-track)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxImg.dataUrl}
            alt={lightboxImg.name || 'Proof preview'}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </>
  );
};
