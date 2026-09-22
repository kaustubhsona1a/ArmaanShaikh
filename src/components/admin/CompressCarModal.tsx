import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Vehicle } from '../../data/mockData';
import { optimizeVehicleImages, SingleVehicleOptimizeResult } from '../../lib/supabase';
import { useVehicles } from '../../context/VehicleContext';
import { 
  Zap, 
  X, 
  CheckCircle2, 
  Loader2, 
  HardDrive, 
  ArrowRight, 
  Sparkles, 
  Info, 
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface CompressCarModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onSuccess?: (updatedImages: string[]) => void;
}

export function CompressCarModal({ vehicle, onClose, onSuccess }: CompressCarModalProps) {
  const { updateVehicle, refreshInventory } = useVehicles();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<SingleVehicleOptimizeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected image index for interactive side-by-side quality comparison inspection
  const [inspectIndex, setInspectIndex] = useState(0);
  const [showOriginalPreview, setShowOriginalPreview] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [isReverted, setIsReverted] = useState(false);

  const images = vehicle.images || [];
  const [originalImagesBackup] = useState<string[]>([...images]);

  const handleStartCompression = async () => {
    if (images.length === 0) {
      setErrorMsg('This vehicle has no images to compress.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setIsReverted(false);
    setProgressMsg(`Analyzing and compressing ${images.length} vehicle photos...`);

    try {
      // keepOriginalBackup is false by default so old bloated originals are cleaned up and storage is not blown up
      const optResult = await optimizeVehicleImages(vehicle.id, images, {
        keepOriginalBackup: false,
        maxDimension: 1200,
        targetQuality: 0.70
      });

      setResult(optResult);

      if (optResult.imagesOptimized > 0) {
        // Update local context so the gallery and cards reflect the optimized images immediately
        await updateVehicle(vehicle.id, {
          images: optResult.newImages
        });
        if (onSuccess) {
          onSuccess(optResult.newImages);
        }
        await refreshInventory();
      }
    } catch (err: any) {
      console.error('[SINGLE CAR OPT ERROR]', err);
      setErrorMsg(err?.message || 'Failed to compress car photos. Please verify your connection.');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleUndoThisCar = async () => {
    if (!originalImagesBackup || originalImagesBackup.length === 0) return;
    setIsReverting(true);
    setErrorMsg(null);
    try {
      await updateVehicle(vehicle.id, {
        images: originalImagesBackup
      });
      const { syncVehicleImages } = await import('../../context/VehicleContext');
      await syncVehicleImages(vehicle.id, originalImagesBackup);
      if (onSuccess) {
        onSuccess(originalImagesBackup);
      }
      await refreshInventory();
      setIsReverted(true);
      setResult(null);
    } catch (err: any) {
      console.error('[UNDO SINGLE CAR ERROR]', err);
      setErrorMsg(err?.message || 'Failed to revert vehicle images.');
    } finally {
      setIsReverting(false);
    }
  };

  const formatMB = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2);
  };

  const formatKB = (bytes: number) => {
    return (bytes / 1024).toFixed(1);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div 
        onClick={!isProcessing ? onClose : undefined}
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
                Compress Vehicle Photos
              </h2>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.variant ? `(${vehicle.variant})` : ''} • {images.length} photos
              </p>
            </div>
          </div>
          
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-5 overflow-y-auto pr-1 flex-1">
          
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-mono text-rose-300">
              {errorMsg}
            </div>
          )}

          {isReverted && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Original high-resolution photos restored successfully!</span>
            </div>
          )}

          {!result ? (
            /* Pre-compression view */
            <div className="space-y-4">
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-300 font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Zero Storage Bloat Guarantee</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  This tool re-compresses all photos for <strong>{vehicle.make} {vehicle.model}</strong> using the HD WebP compression engine (1200px @ 70% quality).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Cleans oversized original files to save storage
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Drastically cuts mobile loading time
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Exact byte savings reported right after
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Tests visual quality before doing whole fleet
                  </div>
                </div>
              </div>

              {/* Photo Previews */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 font-bold">
                  Photos to be compressed ({images.length})
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {images.slice(0, 8).map((img, idx) => (
                    <div key={idx} className="aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/40 relative">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/80 px-1 py-0.5 rounded text-[8px] font-mono text-white">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                  {images.length > 8 && (
                    <div className="aspect-video rounded-lg border border-dashed border-white/10 flex items-center justify-center text-xs font-mono text-zinc-500">
                      +{images.length - 8} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Post-compression results view */
            <div className="space-y-5">
              
              {/* Size comparison card */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Compression Complete</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase">Original Size</p>
                    <p className="text-base sm:text-lg font-mono font-bold text-zinc-300 mt-1">
                      {formatMB(result.beforeBytes)} MB
                    </p>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase">Compressed</p>
                    <p className="text-base sm:text-lg font-mono font-bold text-emerald-400 mt-1">
                      {formatMB(result.afterBytes)} MB
                    </p>
                  </div>

                  <div className="bg-black/40 border border-emerald-500/20 rounded-lg p-3">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase">Saved</p>
                    <p className="text-base sm:text-lg font-mono font-bold text-white mt-1">
                      {result.beforeBytes > 0 ? Math.round(((result.beforeBytes - result.afterBytes) / result.beforeBytes) * 100) : 0}%
                    </p>
                    <p className="text-[9px] font-mono text-emerald-400 mt-0.5">
                      -{formatMB(result.totalBytesSaved)} MB
                    </p>
                  </div>
                </div>

                <p className="text-[11px] font-mono text-zinc-400 mt-3 text-center">
                  {result.imagesOptimized} of {result.totalImages} photos successfully converted to lightweight WebP.
                </p>
              </div>

              {/* Interactive Visual Quality Inspector */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Inspect Quality for Photo #{inspectIndex + 1}
                  </p>
                  
                  {/* Before / After toggle */}
                  {result.details[inspectIndex]?.wasOptimized && (
                    <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/10 text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() => setShowOriginalPreview(false)}
                        className={`px-2.5 py-1 rounded transition-all font-bold ${
                          !showOriginalPreview 
                            ? 'bg-amber-500 text-zinc-950 shadow' 
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Compressed WebP ({result.details[inspectIndex]?.bytesSaved > 0 ? `-${formatKB(result.details[inspectIndex].bytesSaved)} KB` : 'Active'})
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowOriginalPreview(true)}
                        className={`px-2.5 py-1 rounded transition-all font-bold ${
                          showOriginalPreview 
                            ? 'bg-zinc-700 text-white shadow' 
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Original Photo
                      </button>
                    </div>
                  )}
                </div>

                {/* Main comparison viewer */}
                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-inner">
                  <img 
                    src={
                      showOriginalPreview 
                        ? result.details[inspectIndex]?.originalUrl 
                        : (result.newImages[inspectIndex] || result.details[inspectIndex]?.optimizedUrl)
                    } 
                    alt="Output preview" 
                    className="w-full h-full object-cover" 
                  />
                  
                  <div className="absolute top-3 left-3 bg-zinc-950/90 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-md text-[10px] font-mono text-white flex items-center gap-2 shadow-lg">
                    {showOriginalPreview ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-zinc-400" />
                        <span>Viewing Original Photo</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Viewing Compressed WebP</span>
                      </>
                    )}
                  </div>

                  {result.details[inspectIndex]?.bytesSaved > 0 && (
                    <div className="absolute bottom-3 right-3 bg-emerald-950/85 backdrop-blur-sm border border-emerald-500/30 px-2.5 py-1 rounded-md text-[10px] font-mono text-emerald-300">
                      Saved {formatKB(result.details[inspectIndex].bytesSaved)} KB
                    </div>
                  )}
                </div>

                {/* Thumbnails row */}
                <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
                  {result.newImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInspectIndex(idx)}
                      className={`w-14 h-10 rounded-lg overflow-hidden shrink-0 border transition-all relative ${
                        inspectIndex === idx ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105' : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 px-1 text-[7px] font-mono text-white rounded">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Updates database and inventory gallery instantly.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!result ? (
              <>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing || images.length === 0}
                  onClick={handleStartCompression}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{progressMsg || 'Compressing...'}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Compress This Car ({images.length} Photos)</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isReverting}
                  onClick={handleUndoThisCar}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                  title="Undo compression and restore original images for this vehicle"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isReverting ? 'animate-spin' : ''}`} />
                  <span>{isReverting ? 'Reverting...' : 'Undo & Keep Originals'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-lg"
                >
                  Keep Compressed (Done)
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
