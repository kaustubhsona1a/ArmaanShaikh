import React, { useState, ChangeEvent, FormEvent, useEffect, useRef } from 'react';
import { UploadCloud, X, Plus, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useVehicles } from '../../context/VehicleContext';
import { Vehicle, BODY_TYPES } from '../../data/mockData';
import { uploadMultipleImagesToStorage, deleteImagesFromStorage } from '../../lib/supabase';

export default function AdminAddVehicle() {
  const { vehicles, addVehicle, updateVehicle } = useVehicles();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const isEditing = Boolean(id);

  // Track images that were uploaded during THIS session but not yet saved
  const sessionUploadedImages = useRef<string[]>([]);
  const formSaved = useRef(false);

  useEffect(() => {
    // Cleanup orphaned uploads on unmount if user leaves without saving
    return () => {
      if (!formSaved.current && sessionUploadedImages.current.length > 0) {
        console.log("Cleaning up unsaved orphaned session images...", sessionUploadedImages.current);
        deleteImagesFromStorage(sessionUploadedImages.current, 'vehicle-images').catch(err => {
          console.warn("Failed to cleanup unsaved orphaned images on unmount", err);
        });
      }
    };
  }, []);

  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [uploadNotice, setUploadNotice] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    variant: '',
    year: new Date().getFullYear(),
    price: '',
    registration: '',
    bodyType: 'SUV',
    fuelType: 'Petrol',
    transmission: 'Manual',
    mileage: '',
    ownership: '1st Owner',
    engine: '',
    color: '',
    description: '',
    instagramReel: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    
    const newImages = [...images];
    const [removed] = newImages.splice(draggedIdx, 1);
    newImages.splice(targetIdx, 0, removed);
    setImages(newImages);
    setDraggedIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  useEffect(() => {
    if (isEditing && id) {
      const vehicle = vehicles.find(v => v.id === id);
      if (vehicle) {
        setFormData({
          make: vehicle.make,
          model: vehicle.model,
          variant: vehicle.variant || '',
          year: vehicle.year,
          price: vehicle.price.toString(),
          registration: vehicle.registration || '',
          bodyType: vehicle.bodyType || 'SUV',
          fuelType: vehicle.fuelType,
          transmission: vehicle.transmission,
          mileage: vehicle.mileage.toString(),
          ownership: vehicle.ownership,
          engine: vehicle.engine || '',
          color: vehicle.color || '',
          description: vehicle.description || '',
          instagramReel: vehicle.instagramReel || '',
        });
        setImages(vehicle.images || []);
      }
    }
  }, [id, isEditing, vehicles]);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      setIsCompressing(true);
      setUploadProgress({ current: 0, total: files.length });
      setUploadNotice(null);

      try {
        const { successful, failed } = await uploadMultipleImagesToStorage(
          files, 
          'vehicles', 
          'vehicle-images',
          (completed, total) => {
            setUploadProgress({ current: completed, total });
          }
        );
        
        if (successful.length > 0) {
          sessionUploadedImages.current.push(...successful);
          setImages(prev => {
            const newImages = [...prev, ...successful];
            if (newImages.length > 20) {
              setUploadNotice({
                type: 'warning',
                message: 'Uploaded successfully. Maximum 20 images limit reached.'
              });
              return newImages.slice(0, 20);
            }
            return newImages;
          });
        }

        if (failed.length === 0) {
          setUploadNotice({
            type: 'success',
            message: `Successfully processed and uploaded ${successful.length} photo${successful.length > 1 ? 's' : ''}.`
          });
        } else if (successful.length > 0 && failed.length > 0) {
          setUploadNotice({
            type: 'warning',
            message: `Uploaded ${successful.length} photo(s). ${failed.length} failed (${failed.map(f => f.fileName).join(', ')}). Please retry the failed images.`
          });
        } else {
          setUploadNotice({
            type: 'error',
            message: `Upload failed: ${failed[0]?.reason || 'Check Supabase vehicle-images storage bucket permissions.'}`
          });
        }
      } catch (err: any) {
        console.error('Failed to process image batch', err);
        setUploadNotice({
          type: 'error',
          message: err?.message || 'Failed to upload images. Check connection and storage permissions.'
        });
      } finally {
        setIsCompressing(false);
        setUploadProgress(null);
        // Clear file input value so re-selecting same files triggers change event
        e.target.value = '';
      }
    }
  };

  const removeImage = async (index: number) => {
    const urlToRemove = images[index];
    setImages(prev => prev.filter((_, i) => i !== index));

    // Try to immediately clean it up from Supabase to prevent orphans
    try {
      if (urlToRemove && typeof urlToRemove === 'string' && urlToRemove.includes('supabase.co')) {
        // Safe check: Only delete if it's NOT an existing image from the original vehicle we are editing
        const isEditingOriginal = isEditing && id && vehicles.find(v => v.id === id)?.images?.includes(urlToRemove);
        
        if (!isEditingOriginal) {
          const { deleteImagesFromStorage } = await import('../../lib/supabase');
          await deleteImagesFromStorage([urlToRemove], 'vehicle-images');
          
          // Remove from session tracking since we already deleted it
          sessionUploadedImages.current = sessionUploadedImages.current.filter(url => url !== urlToRemove);
        }
      }
    } catch (err) {
      console.warn("Failed to cleanup orphaned image:", err);
    }
  };


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    formSaved.current = true;
    
    if (isEditing && id) {
      updateVehicle(id, {
        make: formData.make,
        model: formData.model,
        variant: formData.variant,
        year: Number(formData.year),
        price: Number(formData.price),
        mileage: Number(formData.mileage),
        bodyType: formData.bodyType,
        fuelType: formData.fuelType as 'Petrol' | 'Diesel' | 'CNG' | 'Electric',
        transmission: formData.transmission as 'Manual' | 'Automatic',
        engine: formData.engine || 'Standard',
        color: formData.color || 'Standard',
        ownership: formData.ownership,
        registration: formData.registration,
        description: formData.description,
        instagramReel: formData.instagramReel,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800'],
      });
    } else {
      const newVehicle: Vehicle = {
        id: 'v' + Date.now().toString(),
        make: formData.make,
        model: formData.model,
        variant: formData.variant,
        year: Number(formData.year),
        price: Number(formData.price),
        mileage: Number(formData.mileage),
        bodyType: formData.bodyType,
        fuelType: formData.fuelType as 'Petrol' | 'Diesel' | 'CNG' | 'Electric',
        transmission: formData.transmission as 'Manual' | 'Automatic',
        engine: formData.engine || 'Standard',
        color: formData.color || 'Standard',
        ownership: formData.ownership,
        registration: formData.registration,
        description: formData.description,
        instagramReel: formData.instagramReel,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800'],
        features: ['Air Conditioning', 'Power Steering'], 
        status: 'Available',
      };
      addVehicle(newVehicle);
    }
    
    navigate('/dealer-management/inventory');
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-widest uppercase">{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</h1>
          <p className="text-zinc-400 text-xs mt-2 font-mono uppercase tracking-wider font-semibold">{isEditing ? 'Update the details for this listing in the gallery.' : 'Fill in the specifications to list a new car in inventory.'}</p>
        </div>
        <div className="flex gap-2.5 w-full sm:w-auto">
          <Link to="/dealer-management/inventory" className="flex-grow sm:flex-grow-0 text-center px-4 sm:px-5 py-3.5 bg-zinc-900/40 border border-white/5 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-xl text-xs font-bold tracking-widest font-mono uppercase transition-all">
            Cancel
          </Link>
          <button type="submit" className="flex-grow sm:flex-grow-0 text-center px-4 sm:px-6 py-3.5 bg-white hover:bg-zinc-900 text-zinc-950 hover:text-white border border-transparent hover:border-white/20 rounded-xl text-xs font-bold tracking-widest font-mono uppercase transition-all shadow-sm">{isEditing ? 'Save Changes' : 'Save Vehicle'}</button>
        </div>
      </div>

      <div className="bg-zinc-950/65 backdrop-blur-md p-4 sm:p-6 md:p-8 rounded-2xl border border-white/5 shadow-2xl space-y-8 text-zinc-300">
        
        {/* Basic Info */}
        <div>
          <h2 className="text-sm font-bold font-serif text-white mb-6 border-b border-white/5 pb-2 uppercase tracking-widest">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">Make *</label>
              <input required name="make" value={formData.make} onChange={handleChange} placeholder="e.g. Honda" className="w-full flex h-12 items-center rounded-xl border border-white/5 bg-zinc-900/30 px-4 py-2 text-xs text-white placeholder-zinc-700 outline-none focus:border-white transition-all font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">Model *</label>
              <input required name="model" value={formData.model} onChange={handleChange} placeholder="e.g. City" className="w-full flex h-12 items-center rounded-xl border border-white/5 bg-zinc-900/30 px-4 py-2 text-xs text-white placeholder-zinc-700 outline-none focus:border-white transition-all font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">Variant</label>
              <input name="variant" value={formData.variant} onChange={handleChange} placeholder="e.g. ZX CVT" className="w-full flex h-12 items-center rounded-xl border border-white/5 bg-zinc-900/30 px-4 py-2 text-xs text-white placeholder-zinc-700 outline-none focus:border-white transition-all font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">Manufacturing Year *</label>
              <input required type="number" name="year" value={formData.year} onChange={handleChange} placeholder="2020" className="w-full flex h-12 items-center rounded-xl border border-white/5 bg-zinc-900/30 px-4 py-2 text-xs text-white placeholder-zinc-700 outline-none focus:border-white transition-all font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">Price (₹) *</label>
              <input required type="number" name="price" value={formData.price} onChange={handleChange} placeholder="1125000" className="w-full flex h-12 items-center rounded-xl border border-white/5 bg-zinc-900/30 px-4 py-2 text-xs text-white placeholder-zinc-700 outline-none focus:border-white transition-all font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">Registration Number</label>
              <input name="registration" value={formData.registration} onChange={handleChange} placeholder="MH-04-XX-XXXX" className="w-full flex h-12 items-center rounded-xl border border-white/5 bg-zinc-900/30 px-4 py-2 text-xs text-white placeholder-zinc-700 outline-none focus:border-white transition-all font-mono" />
            </div>
          </div>
        </div>

        {/* Technical Specs */}
        <div>
          <h2 className="text-sm font-bold font-serif text-white mb-6 border-b border-white/5 pb-2 uppercase tracking-widest">Technical Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">Body Type *</label>
              <select name="bodyType" value={formData.bodyType} onChange={handleChange} className="flex h-12 w-full items-center justify-between rounded-xl border border-white/5 bg-zinc-950 px-4 py-2 text-xs text-zinc-300 outline-none focus:border-white transition-all font-mono uppercase tracking-wider">
                {BODY_TYPES.map(bt => (
                  <option key={bt} value={bt} className="bg-zinc-950 text-white">{bt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">Fuel Type</label>
              <select name="fuelType" value={formData.fuelType} onChange={handleChange} className="flex h-12 w-full items-center justify-between rounded-xl border border-white/5 bg-zinc-950 px-4 py-2 text-xs text-zinc-300 outline-none focus:border-white transition-all font-mono uppercase tracking-wider">
                <option className="bg-zinc-950 text-white">Petrol</option>
                <option className="bg-zinc-950 text-white">Diesel</option>
                <option className="bg-zinc-950 text-white">CNG</option>
                <option className="bg-zinc-950 text-white">Electric</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">Transmission</label>
              <select name="transmission" value={formData.transmission} onChange={handleChange} className="flex h-12 w-full items-center justify-between rounded-xl border border-white/5 bg-zinc-950 px-4 py-2 text-xs text-zinc-300 outline-none focus:border-white transition-all font-mono uppercase tracking-wider">
                <option className="bg-zinc-950 text-white">Manual</option>
                <option className="bg-zinc-950 text-white">Automatic</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">Mileage (km) *</label>
              <input required type="number" name="mileage" value={formData.mileage} onChange={handleChange} placeholder="45000" className="w-full flex h-12 items-center rounded-xl border border-white/5 bg-zinc-900/30 px-4 py-2 text-xs text-white placeholder-zinc-700 outline-none focus:border-white transition-all font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">Ownership</label>
              <select name="ownership" value={formData.ownership} onChange={handleChange} className="flex h-12 w-full items-center justify-between rounded-xl border border-white/5 bg-zinc-950 px-4 py-2 text-xs text-zinc-300 outline-none focus:border-white transition-all font-mono uppercase tracking-wider">
                <option className="bg-zinc-950 text-white">1st Owner</option>
                <option className="bg-zinc-950 text-white">2nd Owner</option>
                <option className="bg-zinc-950 text-white">3rd+ Owner</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">Engine CC</label>
              <input name="engine" value={formData.engine} onChange={handleChange} placeholder="e.g. 1498 cc" className="w-full flex h-12 items-center rounded-xl border border-white/5 bg-zinc-900/30 px-4 py-2 text-xs text-white placeholder-zinc-700 outline-none focus:border-white transition-all font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">Color</label>
              <input name="color" value={formData.color} onChange={handleChange} placeholder="e.g. Radiant Red" className="w-full flex h-12 items-center rounded-xl border border-white/5 bg-zinc-900/30 px-4 py-2 text-xs text-white placeholder-zinc-700 outline-none focus:border-white transition-all font-mono" />
            </div>
          </div>
        </div>

        {/* Media */}
        <div>
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-2">
            <h2 className="text-sm font-bold font-serif text-white uppercase tracking-widest">Vehicle Gallery</h2>
            {isCompressing && uploadProgress && (
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Optimizing & Uploading {uploadProgress.current} of {uploadProgress.total}...</span>
              </div>
            )}
          </div>

          {/* Upload Status Banner */}
          {uploadNotice && (
            <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2.5 text-xs font-mono ${
              uploadNotice.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' :
              uploadNotice.type === 'warning' ? 'bg-amber-950/40 border-amber-500/30 text-amber-300' :
              'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}>
              {uploadNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <div className="flex-grow">{uploadNotice.message}</div>
              <button type="button" onClick={() => setUploadNotice(null)} className="text-zinc-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {images.map((img, i) => (
              <div 
                key={`${img}-${i}`} 
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                className={`relative aspect-video rounded-xl overflow-hidden border ${draggedIdx === i ? 'border-white opacity-50' : 'border-white/5'} group cursor-move`}
              >
                <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover pointer-events-none" />
                <div className="absolute top-2 left-2 bg-zinc-950/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded font-mono border border-white/10 shadow-sm pointer-events-none">
                  {i === 0 ? 'THUMBNAIL' : `#${i + 1}`}
                </div>
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <label className={`border-2 border-dashed border-white/10 rounded-xl aspect-video flex flex-col items-center justify-center p-4 text-center bg-zinc-900/20 hover:bg-white/5 text-zinc-400 hover:text-white transition-all cursor-pointer font-mono text-xs ${isCompressing ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {isCompressing ? (
                <>
                  <Loader2 className="w-8 h-8 mb-2 animate-spin text-white" />
                  <span className="font-bold uppercase tracking-wider text-[10px]">
                    {uploadProgress ? `${uploadProgress.current}/${uploadProgress.total} Uploading` : 'Processing...'}
                  </span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 mb-2" />
                  <span className="font-bold uppercase tracking-wider text-[10px]">Add Images</span>
                </>
              )}
              <input type="file" multiple accept="image/*" disabled={isCompressing} onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-2">You can select multiple images to upload. Images are automatically compressed & optimized. Drag and drop images to reorder them.</p>
        </div>

        {/* Instagram Reel Link */}
        <div>
          <h2 className="text-sm font-bold font-serif text-white mb-6 border-b border-white/5 pb-2 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white" /> Instagram Reel Link
          </h2>
          <p className="text-zinc-[400] text-xs uppercase font-mono tracking-wider mb-4 leading-relaxed">Add a highlighted Instagram Reel showcasing this vehicle. This will be prominently shown to customers so they can view interactive social proof directly on Instagram.</p>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-bold">Instagram Reel URL</label>
            <input 
              name="instagramReel" 
              type="url" 
              value={formData.instagramReel} 
              onChange={handleChange} 
              placeholder="e.g. https://www.instagram.com/reel/C8O7w-pS9f3/" 
              className="w-full flex h-12 items-center rounded-xl border border-white/5 bg-zinc-900/30 px-4 py-2 text-xs text-white placeholder-zinc-700 outline-none focus:border-white transition-all font-mono" 
            />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold font-serif text-white mb-6 border-b border-white/5 pb-2 uppercase tracking-widest">Description & Notes</h2>
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter any specific luxury features, vehicle condition detail, or custom service information..." className="flex w-full rounded-xl border border-white/5 bg-zinc-900/30 px-4 py-3 text-xs text-zinc-200 placeholder-zinc-700 min-h-[120px] outline-none focus:border-white transition-all font-mono" />
        </div>

      </div>
    </form>
  );
}
