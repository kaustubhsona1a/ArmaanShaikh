import { useParams, Link } from 'react-router-dom';
import { formatPrice } from '../data/mockData';
import { CheckCircle2, ChevronLeft, ChevronRight, MapPin, Search, Share2, Copy, Check, X, Mail, Instagram, Plus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useVehicles } from '../context/VehicleContext';
import { Helmet } from 'react-helmet-async';

export default function VehicleDetails() {
  const { vehicles, loading } = useVehicles();
  const { id } = useParams();
  const car = vehicles.find(v => v.id === id);
  const [activeImage, setActiveImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Swipe support states
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const handleNextImage = () => {
    if (!car?.images || car.images.length <= 1) return;
    setActiveImage((prev) => (prev + 1) % car.images.length);
  };

  const handlePrevImage = () => {
    if (!car?.images || car.images.length <= 1) return;
    setActiveImage((prev) => (prev - 1 + car.images.length) % car.images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNextImage();
    } else if (isRightSwipe) {
      handlePrevImage();
    }
  };

  // Synchronize isFullscreen with browser history popstate to allow closing with back swipe / button
  useEffect(() => {
    if (isFullscreen) {
      // Push state if not already there
      if (window.history.state?.lightbox !== true) {
        window.history.pushState({ lightbox: true }, '');
      }

      const handlePopState = (e: PopStateEvent) => {
        // If state changed (meaning they swiped back or pressed back)
        setIsFullscreen(false);
      };

      window.addEventListener('popstate', handlePopState);
      
      // Lock scroll
      document.body.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('popstate', handlePopState);
        document.body.style.overflow = '';
      };
    }
  }, [isFullscreen]);

  const closeFullscreen = () => {
    if (window.history.state?.lightbox === true) {
      window.history.back();
    } else {
      setIsFullscreen(false);
    }
  };

  // Listen to keyboard controls for lightbox
  useEffect(() => {
    if (isFullscreen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
          handleNextImage();
        } else if (e.key === 'ArrowLeft') {
          handlePrevImage();
        } else if (e.key === 'Escape') {
          closeFullscreen();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isFullscreen, activeImage, car?.images]);

  // EMI Calculator State Variables (hooks declared unconditionally)
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(5);
  const [loanAmount, setLoanAmount] = useState<number>(0);

  useEffect(() => {
    if (car) {
      setLoanAmount(Math.round(car.price * 0.8));
    }
  }, [car?.price]);

  const calculateEMI = () => {
    if (!car) return { monthlyEmi: 0, totalInterest: 0, totalPayable: 0 };
    const P = loanAmount || Math.round(car.price * 0.8);
    const r = (interestRate / 12) / 100;
    const n = tenureYears * 12;
    
    let emi = 0;
    if (r === 0) {
      emi = P / n;
    } else {
      emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    
    const monthlyEmi = Math.round(emi);
    const totalPayable = Math.round(monthlyEmi * n);
    const totalInterest = Math.max(0, Math.round(totalPayable - P));
    
    return { monthlyEmi, totalInterest, totalPayable };
  };

  const { monthlyEmi, totalInterest, totalPayable } = calculateEMI();

  if (!car) {
    if (loading) {
      return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-white font-sans relative">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-white mb-4"></div>
          <p className="text-xs uppercase tracking-widest font-mono text-zinc-500 font-bold animate-pulse">Loading Vehicle Details...</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-20 text-zinc-650">
        <Helmet>
          <title>Vehicle Not Found | Bombay Motors</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="text-center font-serif text-2xl font-bold text-zinc-900">Car not found</div>
      </div>
    );
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hi, I'm interested in the ${car.year} ${car.make} ${car.model} (${car.variant}) listed at ${formatPrice(car.price)} on Bombay Motors website. Please share more details.`);
    window.open(`https://wa.me/917400113999?text=${message}`, '_blank');
  };

  const handleWhatsAppPhotos = () => {
    const message = encodeURIComponent(`Hi, I'm interested in the ${car.year} ${car.make} ${car.model} (${car.variant}) listed at ${formatPrice(car.price)} on Bombay Motors website. Please share more photos of this vehicle.`);
    window.open(`https://wa.me/917400113999?text=${message}`, '_blank');
  };

  const handleCall = () => {
    window.open(`tel:+917400113999`);
  };

  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: pageTitle,
      text: pageDescription,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderGallery = (isMobile: boolean) => {
    if (!car) return null;
    return (
      <div className={`shadow-xl rounded-2xl overflow-hidden frost-card ${isMobile ? 'p-2.5 space-y-3' : 'p-4 space-y-4'}`}>
        <div 
          className={`relative overflow-hidden bg-black/50 rounded-xl group border border-white/20 cursor-zoom-in ${isMobile ? 'h-[30vh] sm:h-[40vh]' : 'h-[45vh] md:h-[55vh]'}`}
          onClick={() => setIsFullscreen(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img src={car.images?.[activeImage] || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"} alt={car.make} className="w-full h-full object-contain transition-all duration-500 opacity-95 group-hover:opacity-100" />
        </div>
        <div className={`flex overflow-x-auto pb-2 custom-scrollbar ${isMobile ? 'gap-2' : 'gap-4'}`}>
          {(car.images || []).map((img, i) => (
            <button 
              key={img} 
              onClick={() => setActiveImage(i)}
              className={`flex-shrink-0 overflow-hidden rounded-xl border transition-all duration-300 ${isMobile ? 'w-20 h-15 sm:w-24 sm:h-18' : 'w-32 h-24'} ${activeImage === i ? 'border-white scale-[1.02] opacity-100 shadow-md shadow-white/20' : 'border-white/20 opacity-60 hover:opacity-100'}`}
            >
              <img src={img} alt="Thumbnail" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
          
          <button 
            onClick={handleWhatsAppPhotos}
            className={`flex-shrink-0 rounded-xl border border-dashed border-white/40 hover:border-white bg-black/40 hover:bg-white/10 flex flex-col items-center justify-center p-2 text-center transition-all duration-300 hover:scale-[1.02] cursor-pointer group ${isMobile ? 'w-20 h-15 sm:w-24 sm:h-18' : 'w-32 h-24'}`}
            title="Enquire on WhatsApp for more photos"
          >
            <Plus className={`${isMobile ? 'w-4 h-4 mb-0.5' : 'w-5 h-5 mb-1'} text-white transition-colors`} />
            <span className={`${isMobile ? 'text-[6px] sm:text-[7px]' : 'text-[8px]'} leading-tight font-semibold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-widest font-sans`}>
              More Photos
            </span>
          </button>
        </div>
      </div>
    );
  };

  const renderTechnicalDetails = (isMobile: boolean) => {
    if (!car) return null;
    return (
      <div className={`frost-card rounded-2xl shadow-xl animate-fade-in font-sans ${isMobile ? 'p-4 space-y-4' : 'p-8 md:p-10 space-y-8'}`}>
        <div>
          <h2 className={`font-cinzel font-bold text-white border-b border-white/15 uppercase tracking-wider ${isMobile ? 'text-lg mb-4 pb-3' : 'text-2xl mb-8 pb-5'}`}>Technical Specifications</h2>
          <div className={`grid grid-cols-2 ${isMobile ? 'gap-2' : 'md:grid-cols-4 gap-4'} text-zinc-200`}>
            <div className={`frost-card rounded-xl ${isMobile ? 'p-2.5' : 'p-4'}`}>
              <p className={`${isMobile ? 'text-[9px]' : 'text-[11px]'} tracking-wider uppercase text-zinc-300 mb-1 font-semibold font-sans`}>Make</p>
              <p className="text-white font-bold text-xs sm:text-sm md:text-base tracking-wide uppercase font-cinzel">{car.make}</p>
            </div>
            <div className={`frost-card rounded-xl ${isMobile ? 'p-2.5' : 'p-4'}`}>
              <p className={`${isMobile ? 'text-[9px]' : 'text-[11px]'} tracking-wider uppercase text-zinc-300 mb-1 font-semibold font-sans`}>Model</p>
              <p className="text-white font-bold text-xs sm:text-sm md:text-base tracking-wide uppercase font-sans">{car.model}</p>
            </div>
            <div className={`frost-card rounded-xl ${isMobile ? 'p-2.5' : 'p-4'}`}>
              <p className={`${isMobile ? 'text-[9px]' : 'text-[11px]'} tracking-wider uppercase text-zinc-300 mb-1 font-semibold font-sans`}>Year</p>
              <p className="text-white font-bold text-xs sm:text-sm md:text-base tracking-wide uppercase font-sans">{car.year}</p>
            </div>
            <div className={`frost-card rounded-xl ${isMobile ? 'p-2.5' : 'p-4'}`}>
              <p className={`${isMobile ? 'text-[9px]' : 'text-[11px]'} tracking-wider uppercase text-zinc-300 mb-1 font-semibold font-sans`}>Mileage</p>
              <p className="text-white font-black text-xs sm:text-sm md:text-base tracking-wide uppercase font-sans">{car.mileage.toLocaleString()} KM</p>
            </div>
            <div className={`frost-card rounded-xl ${isMobile ? 'p-2.5' : 'p-4'}`}>
              <p className={`${isMobile ? 'text-[9px]' : 'text-[11px]'} tracking-wider uppercase text-zinc-300 mb-1 font-semibold font-sans`}>Fuel Type</p>
              <p className="text-white font-bold text-xs sm:text-sm md:text-base tracking-wide uppercase font-sans">{car.fuelType}</p>
            </div>
            {car.bodyType && (
              <div className={`frost-card rounded-xl ${isMobile ? 'p-2.5' : 'p-4'}`}>
                <p className={`${isMobile ? 'text-[9px]' : 'text-[11px]'} tracking-wider uppercase text-zinc-300 mb-1 font-semibold font-sans`}>Body Type</p>
                <p className="text-white font-bold text-xs sm:text-sm md:text-base tracking-wide uppercase font-sans">{car.bodyType}</p>
              </div>
            )}
            <div className={`frost-card rounded-xl ${isMobile ? 'p-2.5' : 'p-4'}`}>
              <p className={`${isMobile ? 'text-[9px]' : 'text-[11px]'} tracking-wider uppercase text-zinc-300 mb-1 font-semibold font-sans`}>Transmission</p>
              <p className="text-white font-bold text-xs sm:text-sm md:text-base tracking-wide uppercase font-sans">{car.transmission}</p>
            </div>
            <div className={`frost-card rounded-xl ${isMobile ? 'p-2.5' : 'p-4'}`}>
              <p className={`${isMobile ? 'text-[9px]' : 'text-[11px]'} tracking-wider uppercase text-zinc-300 mb-1 font-semibold font-sans`}>Ownership</p>
              <p className="text-white font-bold text-xs sm:text-sm md:text-base tracking-wide uppercase font-sans">{car.ownership}</p>
            </div>
            <div className={`frost-card rounded-xl ${isMobile ? 'p-2.5' : 'p-4'}`}>
              <p className={`${isMobile ? 'text-[9px]' : 'text-[11px]'} tracking-wider uppercase text-zinc-300 mb-1 font-semibold font-sans`}>Color</p>
              <p className="text-white font-bold text-xs sm:text-sm md:text-base tracking-wide uppercase font-sans">{car.color}</p>
            </div>
          </div>
        </div>

        {car.description && (
          <div className={`border-t border-white/15 ${isMobile ? 'pt-4' : 'pt-8'}`}>
            <h3 className="text-xs sm:text-sm font-bold font-cinzel text-white mb-2 sm:mb-4 uppercase tracking-widest">Showroom Notes & Heritage</h3>
            <p className={`text-zinc-200 font-normal leading-relaxed whitespace-pre-line font-sans ${isMobile ? 'text-xs' : 'text-sm'}`}>{car.description}</p>
          </div>
        )}
      </div>
    );
  };

  const renderPriceBox = (isMobile: boolean) => {
    if (!car) return null;
    return (
      <div className={`frost-card relative rounded-2xl shadow-xl font-sans ${isMobile ? 'p-5' : 'p-8 md:p-10'}`}>
        <div className={`absolute top-0 right-0 bg-white text-black font-cinzel font-bold tracking-widest uppercase ${isMobile ? 'text-[8px] px-3 py-1.5 rounded-bl-xl rounded-tr-2xl' : 'text-[10px] px-4 py-2 rounded-bl-xl rounded-tr-2xl'}`}>
          Certified Motorcar
        </div>
        <h1 className={`font-cinzel font-bold text-white tracking-tight leading-tight uppercase ${isMobile ? 'text-xl mt-1' : 'text-3xl mt-4'}`}>
          {car.make} <br/>
          <span className="font-normal text-zinc-300">{car.model}</span>
        </h1>
        <p className={`tracking-widest uppercase text-zinc-300 font-sans font-semibold ${isMobile ? 'text-[9px] mt-1.5 mb-4' : 'text-[10px] mt-3 mb-8'}`}>{car.variant}</p>
        <div className={`font-bold text-white border-b border-white/15 font-cinzel ${isMobile ? 'text-2xl pb-4 mb-4' : 'text-3xl pb-6 mb-4'}`}>{formatPrice(car.price)}</div>

        {car.instagramReel && (
          <div className={`rounded-2xl bg-white/5 border border-white/15 flex flex-col ${isMobile ? 'mb-4 p-3 gap-2' : 'mb-8 p-4.5 gap-3.5'}`}>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center justify-center rounded-full bg-white text-black ${isMobile ? 'w-6 h-6' : 'w-7 h-7'}`}>
                <Instagram className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
              </span>
              <div>
                <p className={`font-bold text-white tracking-widest uppercase font-sans ${isMobile ? 'text-[9px]' : 'text-[10px]'}`}>Instagram Reel Highlight</p>
                <p className={`text-zinc-300 uppercase tracking-wider font-sans ${isMobile ? 'text-[8px]' : 'text-[9px]'}`}>Watch immersive video review</p>
              </div>
            </div>
            <button
              onClick={() => window.open(car.instagramReel, '_blank', 'noopener,noreferrer')}
              className={`w-full text-center frost-pill text-white hover:text-black font-bold rounded-full uppercase tracking-widest font-sans transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-95 ${isMobile ? 'py-2.5 text-[9px]' : 'py-3.5 text-[10px]'}`}
            >
              Watch on Instagram ↗
            </button>
          </div>
        )}
        
        <p className={`tracking-wider text-zinc-200 flex items-center font-sans font-semibold ${isMobile ? 'text-[10px] mb-4' : 'text-xs mb-8'}`}>
          <a href="https://share.google/VGXKDMtikeDYt2Lcn" target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-300 inline-flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-white" /> Bombay Motors Showroom, Mumbai
          </a>
        </p>

        <div className={`space-y-2 font-sans uppercase font-bold ${isMobile ? 'text-[10px]' : 'text-[11px]'}`}>
          <button onClick={handleCall} className={`w-full bg-white hover:bg-zinc-100 text-black rounded-full transition-all duration-300 shadow-md font-sans font-bold cursor-pointer active:scale-98 ${isMobile ? 'py-2.5' : 'py-3.5'}`}>
            Call Us (+91 74001 13999)
          </button>
          <button onClick={handleWhatsApp} className={`w-full frost-pill text-white hover:text-black rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${isMobile ? 'py-2.5' : 'py-3.5'}`}>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397 0 12.008 0c3.205.001 6.216 1.25 8.484 3.52 2.268 2.27 3.516 5.283 3.515 8.491-.005 6.655-5.344 12.003-11.95 12.003-.111 0-.221 0-.332-.005l-5.69 2.12c-.22.08-.454.04-.63-.12l-.35-.35zM6.57 17.51l.36.21c1.55.93 3.32 1.42 5.15 1.42a9.92 9.92 0 0 0 9.95-9.94c0-2.65-1.03-5.15-2.9-7.02C17.26 3.2 14.77 2.17 12.1 2.17 6.64 2.17 2.2 6.61 2.2 12.07c0 1.93.53 3.82 1.54 5.43l.23.37-1.01 3.69 3.61-.95zM17.43 14.93c-.29-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07a8.1 8.1 0 0 1-2.39-1.48 8.94 8.94 0 0 1-1.65-2.05c-.17-.3-.02-.46.13-.61.13-.13.29-.34.44-.51.15-.17.2-.29.3-.49.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.59-.49-.51-.67-.52l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.89 1.22 3.1 1.05 1.41 1.74 1.74 3.1 2.45a9.5 9.5 0 0 0 3.7.8c1.3-.01 2.44-.45 2.74-1 .3-.53.3-1 .22-1.12-.08-.12-.3-.19-.59-.34z"/></svg>
            Inquire via WhatsApp
          </button>
          <button onClick={handleShare} className={`w-full frost-pill text-zinc-200 hover:text-black rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98 ${isMobile ? 'py-2.5' : 'py-3.5'}`}>
            <Share2 className="w-3.5 h-3.5 text-white" />
            Share Listing
          </button>
        </div>
      </div>
    );
  };

  const renderEMICalculator = (isMobile: boolean) => {
    if (!car) return null;
    return (
      <div className={`frost-card relative rounded-2xl shadow-xl font-sans ${isMobile ? 'p-5 space-y-4' : 'p-8 space-y-6'}`}>
        <h2 className={`font-cinzel font-bold text-white uppercase tracking-widest border-b border-white/15 flex items-center justify-between ${isMobile ? 'pb-2 text-xs' : 'pb-3 text-sm'}`}>
          <span>EMI ESTIMATE CALCULATOR</span>
          <span className="text-[9px] uppercase tracking-widest font-sans text-zinc-300 font-bold">Live Rates</span>
        </h2>
        
        {/* Loan Amount Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="text-zinc-300 font-semibold uppercase tracking-wider font-sans">Loan Amount</label>
            <span className="text-white font-bold font-sans">{formatPrice(loanAmount || Math.round(car.price * 0.8))}</span>
          </div>
          <input 
            type="range"
            min={Math.round(car.price * 0.1)}
            max={car.price}
            step={Math.round(car.price * 0.01) || 1000}
            value={loanAmount || Math.round(car.price * 0.8)}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
          />
          <div className="flex justify-between text-[8px] sm:text-[9px] text-zinc-400 font-sans tracking-wider uppercase font-semibold">
            <span>Min {formatPrice(Math.round(car.price * 0.1))} (10%)</span>
            <span>Max {formatPrice(car.price)}</span>
          </div>
        </div>

        {/* Interest Rate Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="text-zinc-300 font-semibold uppercase tracking-wider font-sans">Interest Rate</label>
            <span className="text-white font-bold font-sans">{interestRate.toFixed(2)}% p.a.</span>
          </div>
          <input 
            type="range"
            min="5"
            max="20"
            step="0.25"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
          />
          <div className="flex justify-between text-[8px] sm:text-[9px] text-zinc-400 font-sans tracking-wider uppercase font-semibold">
            <span>5.0% Min</span>
            <span>20.0% Max</span>
          </div>
        </div>

        {/* Tenure Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="text-zinc-300 font-semibold uppercase tracking-wider font-sans">Tenure (Years)</label>
            <span className="text-white font-bold font-sans">{tenureYears} {tenureYears === 1 ? 'Year' : 'Years'} ({tenureYears * 12} Months)</span>
          </div>
          <input 
            type="range"
            min="1"
            max="7"
            step="1"
            value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
          />
          <div className="flex justify-between text-[8px] sm:text-[9px] text-zinc-400 font-sans tracking-wider uppercase font-semibold">
            <span>1 Year</span>
            <span>7 Years</span>
          </div>
        </div>

        {/* EMI Output Breakdown */}
        <div className={`frost-card rounded-xl text-center shadow-inner relative overflow-hidden ${isMobile ? 'p-4 space-y-3' : 'p-5 space-y-4'}`}>
          <div className="space-y-0.5">
            <span className="text-[9px] sm:text-[10px] tracking-widest uppercase text-zinc-300 block font-sans font-bold">Estimated Monthly EMI</span>
            <span className={`font-cinzel font-extrabold text-white block ${isMobile ? 'text-2xl' : 'text-3xl'}`}>{formatPrice(monthlyEmi)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/15 text-[9px] sm:text-[10px] text-zinc-300 font-sans tracking-wider uppercase font-semibold">
            <div className="text-left space-y-0.5">
              <span className="text-zinc-400 text-[8px] sm:text-[9px]">Total Interest</span>
              <span className="block text-white font-sans font-bold text-xs">{formatPrice(totalInterest)}</span>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-zinc-400 text-[8px] sm:text-[9px]">Total Cost</span>
              <span className="block text-white font-sans font-bold text-xs">{formatPrice(totalPayable)}</span>
            </div>
          </div>
        </div>

        {/* Legend/Note */}
        <p className={`${isMobile ? 'text-[7px]' : 'text-[8px]'} text-zinc-400 font-sans uppercase text-center leading-relaxed font-semibold`}>
          *Approximate figures based on standard monthly calculations. Actual loan rates and eligibility might vary according to bank parameters.
        </p>
      </div>
    );
  };

  const pageTitle = `${car.year} ${car.make} ${car.model} ${car.variant} | Bombay Motors`;

  const pageDescription = `Exquisite luxury pre-owned ${car.year} ${car.make} ${car.model}. Contact us today to arrange a viewing at our Showroom. ${car.description ? car.description.substring(0, 100) + '...' : ''}`;
  const ogImageUrl = car.images?.[0] || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800";

  return (
    <div className="min-h-screen bg-transparent text-zinc-750 py-5 sm:py-8 font-sans selection:bg-white selection:text-zinc-950 z-10 relative">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Helmet>
      
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-zinc-950/98 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out select-none animate-fade-in"
          onClick={closeFullscreen}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Main image container */}
          <div className="relative w-full max-w-5xl h-[80vh] flex items-center justify-center">
            
            {/* Left navigation overlay button */}
            {car.images && car.images.length > 1 && (
              <button 
                className="absolute left-2 sm:left-4 z-55 p-3 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95 hidden md:flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                title="Previous Image (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img 
              src={car.images?.[activeImage] || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"} 
              alt={`Fullscreen ${car.make} ${car.model}`} 
              className="max-w-full max-h-full object-contain cursor-default select-none transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Right navigation overlay button */}
            {car.images && car.images.length > 1 && (
              <button 
                className="absolute right-2 sm:right-4 z-55 p-3 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95 hidden md:flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                title="Next Image (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Close button & image counter indicators */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-50 pointer-events-none">
            {car.images && car.images.length > 1 ? (
              <div className="bg-black/60 border border-white/10 rounded-full px-4 py-1.5 font-mono text-[10px] tracking-widest text-zinc-400 uppercase font-bold">
                {activeImage + 1} / {car.images.length}
              </div>
            ) : (
              <div />
            )}
            <button 
              className="pointer-events-auto text-zinc-400 hover:text-white bg-black/60 hover:bg-black/90 border border-white/10 rounded-full px-4 py-2.5 transition-all font-mono text-[10px] tracking-widest uppercase font-bold flex items-center gap-1.5 hover:scale-105"
              onClick={(e) => { e.stopPropagation(); closeFullscreen(); }}
            >
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>

          {/* Mobile Swipe hint */}
          {car.images && car.images.length > 1 && (
            <div className="absolute bottom-6 text-center pointer-events-none md:hidden bg-black/40 border border-white/5 rounded-full px-4 py-1 text-[9px] font-mono tracking-widest text-zinc-500 uppercase">
              Swipe Left/Right to Browse
            </div>
          )}
        </div>
      )}

      <div className="container mx-auto max-w-7xl px-4">
        
        <Link to="/inventory" className="inline-flex items-center text-zinc-300 hover:text-white uppercase tracking-wider text-xs font-bold mb-4 sm:mb-6 transition-colors font-sans">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Collection
        </Link>

        {/* DESKTOP LAYOUT (lg:flex, hidden on mobile) */}
        <div className="hidden lg:flex gap-12 text-zinc-200">
          {/* Left Column - Gallery & Details */}
          <div className="w-full lg:w-2/3 space-y-10">
            {renderGallery(false)}
            {renderTechnicalDetails(false)}
          </div>

          {/* Right Column - Price & EMI */}
          <div className="w-full lg:w-1/3 space-y-8 sticky top-24 self-start">
            {renderPriceBox(false)}
            {renderEMICalculator(false)}
          </div>
        </div>

        {/* MOBILE LAYOUT (flex lg:hidden) */}
        <div className="flex lg:hidden flex-col gap-6 text-zinc-200">
          {renderGallery(true)}
          {renderPriceBox(true)}
          {renderTechnicalDetails(true)}
          {renderEMICalculator(true)}
        </div>

        {/* Certified preowned section */}
        <div className="mt-6 md:mt-10 frost-card p-5 md:p-10 rounded-2xl relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
            <Search className="w-40 h-40 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-cinzel font-bold text-white mb-2 sm:mb-3 uppercase tracking-wide">Certified Pre-Owned Selection</h2>
          <p className="text-zinc-200 mb-2 max-w-xl text-xs md:text-sm font-normal leading-relaxed font-sans">
            Every vehicle listed by the Bombay Motors platform undertakes a specialized physical inspection covering diagnostic checks, accident/flood history, mileage validation, and comprehensive ownership verification.
          </p>
        </div>

      </div>

      {/* Deluxe Share Listing Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Blur Backdrop */}
          <div 
            onClick={() => setShowShareModal(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity" 
          />
          
          {/* Modal Card */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 max-w-md w-full relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl text-zinc-300">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-full bg-zinc-950 border border-zinc-805 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-sm font-serif font-bold text-white tracking-widest uppercase">Share Collection Asset</h3>
                <p className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase mt-1">Spread the luxury word</p>
              </div>

              {/* Asset Preview info Box */}
              <div className="bg-zinc-950/40 border border-zinc-805 rounded-xl p-4 flex gap-4 items-center">
                <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0 bg-zinc-950">
                  <img 
                    src={car.images?.[0] || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=100"} 
                    alt={car.make} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-serif font-bold text-white uppercase truncate">{car.year} {car.make}</h4>
                  <p className="text-[9px] text-white font-sans font-bold mt-0.5">{formatPrice(car.price)}</p>
                </div>
              </div>

              {/* Quick links grid */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    const msg = `Check out this gorgeous ${car.year} ${car.make} ${car.model} listed at ${formatPrice(car.price)} on Bombay Motors!`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg + ' ' + window.location.href)}`, '_blank');
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-xl transition-all group"
                >
                  <svg className="w-5 h-5 text-white transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.431 2.5 1.157 3.471L6.78 19.83l4.562-1.202c.904.494 1.944.777 3.05.777 3.182 0 5.769-2.587 5.769-5.768 0-3.18-2.587-5.765-5.769-5.765zm3.61 8.18c-.13.364-.75.71-1.042.75-.292.04-.584.07-.876.03-.292-.04-.555-.1-.848-.2-.35-.12-.76-.324-1.21-.58-.876-.496-1.554-1.246-2.05-2.12-.13-.23-.21-.497-.24-.764-.04-.265.03-.526.17-.745.21-.293.447-.648.555-.838.11-.19.16-.31.25-.506.09-.197.05-.373-.02-.52-.07-.146-.62-1.49-.85-2.044-.224-.54-.45-.467-.62-.476l-.527-.008c-.184 0-.482.062-.733.34-.251.278-.962.94-.962 2.292 0 1.353.984 2.658 1.121 2.843.136.185 1.93 2.947 4.673 4.133.653.282 1.162.45 1.56.577.656.208 1.253.179 1.725.109.526-.078 1.62-.662 1.848-1.267.228-.605.228-1.125.16-1.233-.068-.108-.25-.173-.526-.31z"/>
                  </svg>
                  <span className="text-[9px] text-zinc-450 font-mono tracking-wider font-bold uppercase transition-colors group-hover:text-white">WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    const msg = `Check out this gorgeous ${car.year} ${car.make} ${car.model} listed at ${formatPrice(car.price)} on Bombay Motors!`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-xl transition-all group"
                >
                  <svg className="w-5 h-5 text-white transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  <span className="text-[9px] text-zinc-450 font-mono tracking-wider font-bold uppercase transition-colors group-hover:text-white">Twitter</span>
                </button>

                <button
                  onClick={() => {
                    const subj = `Interested in the ${car.year} ${car.make} ${car.model}`;
                    const body = `Hey, take a look at this exceptional pre-owned ${car.year} ${car.make} ${car.model} listed at ${formatPrice(car.price)} on the Bombay Motors website: ${window.location.href}`;
                    window.open(`mailto:?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 bg-zinc-950/50 hover:bg-zinc-950 border border-zinc-805 rounded-xl transition-all group"
                >
                  <Mail className="w-5 h-5 text-zinc-500 transition-transform group-hover:scale-110" />
                  <span className="text-[9px] text-zinc-450 font-mono tracking-wider font-bold uppercase transition-colors group-hover:text-white">Email</span>
                </button>
              </div>

              {/* Clipboard link copy box */}
              <div className="space-y-2 pt-2 border-t border-zinc-805">
                <label className="text-[9px] font-mono font-bold tracking-widest text-white uppercase block">Copy Link Reference</label>
                <div className="flex bg-zinc-950 hover:bg-zinc-950 border border-zinc-805 rounded-xl overflow-hidden focus-within:border-white/35 transition-all">
                  <input 
                    type="text" 
                    readOnly 
                    value={window.location.href}
                    className="flex-1 min-w-0 bg-transparent text-xs text-zinc-500 font-mono px-4 py-3 outline-none"
                  />
                  <button 
                    onClick={handleCopyLink}
                    className={`px-4 flex items-center justify-center gap-1 border-l border-zinc-800 text-xs font-mono font-bold transition-all ${copied ? 'bg-emerald-600/20 text-emerald-700 text-[10px]' : 'bg-white/5 text-zinc-300 hover:bg-white hover:text-zinc-950 uppercase'}`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
