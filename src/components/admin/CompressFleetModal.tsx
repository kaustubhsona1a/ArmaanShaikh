import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  batchOptimizeAllVehicles, 
  revertFleetOptimization, 
  getFleetOptimizationBackup, 
  clearFleetOptimizationBackup,
  OptimizationBackupLog 
} from '../../lib/supabase';
import { useVehicles } from '../../context/VehicleContext';
import { 
  Zap, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  HardDrive, 
  X, 
  Loader2, 
  Info, 
  Trash2,
  AlertTriangle 
} from 'lucide-react';

interface CompressFleetModalProps {
  onClose: () => void;
  onCompleted?: () => void;
}

export function CompressFleetModal({ onClose, onCompleted }: CompressFleetModalProps) {
  const { vehicles, refreshInventory } = useVehicles();
  const [backupInfo, setBackupInfo] = useState<OptimizationBackupLog | null>(null);

  // Configuration options
  const [keepBackup, setKeepBackup] = useState(true);

  // Compression state
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState<{
    currentVehicle: number;
    totalVehicles: number;
    imagesProcessed: number;
    bytesSaved: number;
    currentCarName: string;
  } | null>(null);

  const [compressResult, setCompressResult] = useState<{
    vehiclesProcessed: number;
    imagesOptimized: number;
    totalBytesSaved: number;
    backupCreated: boolean;
  } | null>(null);

  // Revert / Undo state
  const [isReverting, setIsReverting] = useState(false);
  const [revertProgress, setRevertProgress] = useState<{ reverted: number; total: number } | null>(null);
  const [revertSuccessMsg, setRevertSuccessMsg] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setBackupInfo(getFleetOptimizationBackup());
  }, []);

  const formatMB = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2);
  };

  const handleStartFleetCompression = async () => {
    setIsCompressing(true);
    setErrorMsg(null);
    setCompressResult(null);
    setRevertSuccessMsg(null);

    try {
      const result = await batchOptimizeAllVehicles((progress) => {
        setCompressProgress(progress);
      }, {
        keepOriginalBackup: keepBackup,
        maxDimension: 1200,
        targetQuality: 0.70
      });

      setCompressResult(result);
      const updatedBackup = getFleetOptimizationBackup();
      setBackupInfo(updatedBackup);

      await refreshInventory();
      if (onCompleted) {
        onCompleted();
      }
    } catch (err: any) {
      console.error('[FLEET COMPRESS MODAL ERROR]', err);
      setErrorMsg(err?.message || 'Failed to complete fleet image compression.');
    } finally {
      setIsCompressing(false);
      setCompressProgress(null);
    }
  };

  const handleUndoAndRevert = async () => {
    if (!backupInfo || !backupInfo.records || backupInfo.records.length === 0) {
      setErrorMsg('No safety backup found to undo.');
      return;
    }

    setIsReverting(true);
    setErrorMsg(null);
    setRevertProgress({ reverted: 0, total: backupInfo.records.length });

    try {
      const result = await revertFleetOptimization((reverted, total) => {
        setRevertProgress({ reverted, total });
      });

      if (result.success) {
        setBackupInfo(null);
        setCompressResult(null);
        setRevertSuccessMsg(`Successfully restored all ${result.revertedCount} original photos!`);
        await refreshInventory();
        if (onCompleted) {
          onCompleted();
        }
      } else {
        setErrorMsg(result.error || 'Failed to revert images.');
      }
    } catch (err: any) {
      console.error('[REVERT ERROR]', err);
      setErrorMsg(err?.message || 'An error occurred while reverting.');
    } finally {
      setIsReverting(false);
      setRevertProgress(null);
    }
  };

  const handleDismissBackup = () => {
    clearFleetOptimizationBackup();
    setBackupInfo(null);
  };

  const isBusy = isCompressing || isReverting;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div 
        onClick={!isBusy ? onClose : undefined}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity" 
      />

      <div className="bg-zinc-950 border border-white/10 rounded-2xl p-5 sm:p-6 md:p-8 max-w-2xl w-full relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col text-zinc-200 font-sans">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-white uppercase tracking-wider">
                Compress All Vehicles & Undo Manager
              </h2>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                {vehicles.length} inventory cars • WebP Image Compression Engine
              </p>
            </div>
          </div>
          
          <button
            type="button"
            disabled={isBusy}
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-5 overflow-y-auto pr-1 flex-1 font-mono text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300">
              {errorMsg}
            </div>
          )}

          {revertSuccessMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{revertSuccessMsg}</span>
            </div>
          )}

          {/* Active Backup Snapshot Warning Banner if one exists */}
          {backupInfo && backupInfo.records && backupInfo.records.length > 0 && !isReverting && !isCompressing && (
            <div className="bg-zinc-900 border border-amber-500/30 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Safety Backup Active ({backupInfo.records.length} Photos)</span>
                </div>
                <span className="text-[10px] text-zinc-500">
                  {new Date(backupInfo.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed font-sans text-xs">
                You previously ran compression. All original high-resolution photos are safely backed up. If you are unhappy with visual quality, you can undo and restore the originals with 1 click.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleUndoAndRevert}
                  className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo & Revert All to Originals</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismissBackup}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-1.5"
                  title="Remove backup records and keep compressed WebP permanently"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Dismiss Backup</span>
                </button>
              </div>
            </div>
          )}

          {/* Real-time Reverting Progress */}
          {isReverting && revertProgress && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-5 rounded-xl space-y-3">
              <div className="flex justify-between font-bold text-rose-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Restoring original uncompressed photos...
                </span>
                <span>{revertProgress.reverted} of {revertProgress.total}</span>
              </div>
              <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden border border-white/10">
                <div 
                  className="bg-rose-500 h-full transition-all duration-200 rounded-full"
                  style={{
                    width: `${revertProgress.total > 0 ? (revertProgress.reverted / revertProgress.total) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Real-time Compressing Progress */}
          {isCompressing && compressProgress && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-xl space-y-3">
              <div className="flex justify-between font-bold text-amber-300">
                <span className="truncate pr-2 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>{compressProgress.currentCarName}</span>
                </span>
                <span className="shrink-0">
                  Car {compressProgress.currentVehicle} of {compressProgress.totalVehicles}
                </span>
              </div>
              <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden border border-white/10">
                <div 
                  className="bg-amber-500 h-full transition-all duration-200 rounded-full"
                  style={{
                    width: `${compressProgress.totalVehicles > 0 ? (compressProgress.currentVehicle / compressProgress.totalVehicles) * 100 : 0}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-400 pt-1">
                <span>{compressProgress.imagesProcessed} photos processed</span>
                <span className="text-emerald-400 font-bold">Saved {formatMB(compressProgress.bytesSaved)} MB so far</span>
              </div>
            </div>
          )}

          {/* Pre-run Configuration View */}
          {!compressResult && !isCompressing && (
            <div className="space-y-4">
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span>How "Compress All" with Undo Works</span>
                </div>
                <p className="text-zinc-300 leading-relaxed font-sans text-xs">
                  This scans all vehicles in your inventory and compresses existing oversized images down to lightweight WebP (1200px @ 70% quality).
                </p>

                {/* Undo Safety Toggle */}
                <div className="pt-2 border-t border-white/5">
                  <label className="flex items-start gap-3 cursor-pointer select-none bg-black/40 p-3 rounded-lg border border-white/10 hover:border-amber-500/30 transition-all">
                    <input
                      type="checkbox"
                      checked={keepBackup}
                      onChange={(e) => setKeepBackup(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
                    />
                    <div>
                      <span className="text-white font-bold block">
                        Keep Safety Backup for 1-Click Undo
                      </span>
                      <span className="text-zinc-400 text-[11px] font-sans block mt-0.5 leading-relaxed">
                        {keepBackup 
                          ? 'Recommended: Original high-res photos are kept so you can undo and restore them anytime if you dislike the quality. (You can clear them later to save storage).'
                          : 'Storage-saver: Deletes original photos immediately. No undo option available.'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-400">
                <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cuts loading time by up to 80%</span>
                </div>
                <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Prevents Supabase egress overages</span>
                </div>
              </div>
            </div>
          )}

          {/* Post-run Results View */}
          {compressResult && !isCompressing && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Fleet Compression Completed</span>
                  </div>
                  {compressResult.backupCreated && (
                    <span className="bg-emerald-950 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                      Undo Backup Saved
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-black/50 border border-white/5 rounded-lg p-3">
                    <p className="text-[10px] text-zinc-500 uppercase">Vehicles</p>
                    <p className="text-base sm:text-lg font-bold text-white mt-1">
                      {compressResult.vehiclesProcessed}
                    </p>
                  </div>
                  <div className="bg-black/50 border border-white/5 rounded-lg p-3">
                    <p className="text-[10px] text-zinc-500 uppercase">Photos Compressed</p>
                    <p className="text-base sm:text-lg font-bold text-emerald-400 mt-1">
                      {compressResult.imagesOptimized}
                    </p>
                  </div>
                  <div className="bg-black/50 border border-emerald-500/20 rounded-lg p-3">
                    <p className="text-[10px] text-zinc-500 uppercase">Bandwidth Saved</p>
                    <p className="text-base sm:text-lg font-bold text-white mt-1">
                      {formatMB(compressResult.totalBytesSaved)} MB
                    </p>
                  </div>
                </div>

                {compressResult.backupCreated && (
                  <div className="bg-black/40 border border-white/10 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="text-zinc-300 font-sans text-xs">
                      Don't like the quality? You can undo and restore all photos now.
                    </div>
                    <button
                      type="button"
                      onClick={handleUndoAndRevert}
                      className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Undo Now</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Applies to active vehicle inventory in real time.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!compressResult ? (
              <>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-colors disabled:opacity-40"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isBusy || vehicles.length === 0}
                  onClick={handleStartFleetCompression}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCompressing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Optimizing Fleet...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Compress All Vehicles</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-lg"
              >
                Done
              </button>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
