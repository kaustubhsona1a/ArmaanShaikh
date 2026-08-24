import { Star, X, ChevronLeft, ChevronRight, MapPin, Clock, Bookmark, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useVehicles } from '../context/VehicleContext';
import { MOCK_REVIEWS } from '../data/mockData';
import React, { useState } from 'react';
import { SmartImage } from '../components/SmartImage';

export default function About() {
  const { siteConfig } = useVehicles();
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const deliveries = siteConfig.clientDeliveries || [];
  const heroShowcaseImage = siteConfig.aboutImage || (deliveries.length > 0 ? deliveries[0] : "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=1400");

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deliveries.length === 0) return;
    setActivePhotoIndex((prev) => (prev !== null ? (prev + 1) % deliveries.length : 0));
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deliveries.length === 0) return;
    setActivePhotoIndex((prev) => (prev !== null ? (prev - 1 + deliveries.length) % deliveries.length : 0));
  };

  return (
    <div className="bg-transparent text-zinc-300 font-sans min-h-screen">
      {/* Top Header & Milestone Section */}
      <section className="pt-4 sm:pt-8 pb-6 sm:pb-10 bg-transparent relative z-10">
        <div className="container mx-auto max-w-7xl px-3.5 sm:px-6">
          
          {/* Header Title Block */}
          <div className="text-center max-w-3xl mx-auto mb-5 sm:mb-7 animate-fade-in">
            <span className="text-zinc-400 font-sans tracking-[0.25em] uppercase text-[10px] sm:text-xs font-semibold mb-1.5 sm:mb-2 block">
              BOUTIQUE HISTORY
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-sans tracking-tight text-white uppercase mb-2 sm:mb-3">
              BOMBAY MOTORS
            </h1>
            
            {/* Established Badge - Pure Monochrome Frost Pill */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-white/20 bg-white/[0.06] backdrop-blur-md text-zinc-200 text-[9px] sm:text-xs uppercase tracking-wider font-sans font-semibold shadow-sm mb-3 sm:mb-4">
              <Bookmark className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white fill-white shrink-0" />
              <span>ESTD. 1986 • CELEBRATING 40 YEARS OF FAMILY TRUST</span>
            </div>

            <p className="text-zinc-300 text-xs sm:text-sm md:text-base leading-relaxed font-normal max-w-2xl mx-auto px-2">
              Mumbai's highly trusted destination for certified, high-quality family hatchbacks, SUVs, and sedans on L.B.S. Marg, Mulund West.
            </p>
          </div>

          {/* Milestones Container Card */}
          <div className="frost-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 shadow-xl border border-white/15 animate-fade-in">
            {/* Milestone Header */}
            <div className="flex items-center gap-2 pb-3 sm:pb-4 border-b border-white/10 mb-4 sm:mb-6 text-[10px] sm:text-xs md:text-sm font-sans tracking-wider uppercase font-bold flex-wrap">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
                <span className="text-zinc-300 font-semibold">FOUR DECADES ON LBS MARG</span>
              </div>
              <span className="text-zinc-500 hidden sm:inline">•</span>
              <span className="text-white font-bold">MILESTONES OF INTEGRITY (1986 - 2026)</span>
            </div>

            {/* Milestones 4-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {/* 1986 */}
              <div className="bg-black/40 border border-white/10 hover:border-white/30 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-5 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold font-cinzel text-white mb-1">1986</div>
                  <h3 className="text-white font-bold text-[10px] sm:text-xs md:text-sm tracking-wider uppercase font-sans mb-1.5 sm:mb-2">
                    THE IGNITION CORNER
                  </h3>
                  <p className="text-zinc-300 text-xs leading-relaxed font-sans font-normal">
                    Started as a humble single-car display on L.B.S. Marg. Minimal glitz—just clean mechanics and 100% honest agreements.
                  </p>
                </div>
              </div>

              {/* 1998 */}
              <div className="bg-black/40 border border-white/10 hover:border-white/30 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-5 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold font-cinzel text-white mb-1">1998</div>
                  <h3 className="text-white font-bold text-[10px] sm:text-xs md:text-sm tracking-wider uppercase font-sans mb-1.5 sm:mb-2">
                    2,500TH VEHICLE KEY
                  </h3>
                  <p className="text-zinc-300 text-xs leading-relaxed font-sans font-normal">
                    As the classic Maruti Zen and Honda City ruled Mumbai roads, we became Mulund's local authority on hassle-free RTO paperwork.
                  </p>
                </div>
              </div>

              {/* 2012 */}
              <div className="bg-black/40 border border-white/10 hover:border-white/30 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-5 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold font-cinzel text-white mb-1">2012</div>
                  <h3 className="text-white font-bold text-[10px] sm:text-xs md:text-sm tracking-wider uppercase font-sans mb-1.5 sm:mb-2">
                    GENERATIONAL TRUST
                  </h3>
                  <p className="text-zinc-300 text-xs leading-relaxed font-sans font-normal">
                    The children of our 1980s buyers began returning for automatic family sedans, cementing three decades of peerless goodwill.
                  </p>
                </div>
              </div>

              {/* 2026 */}
              <div className="bg-black/40 border border-white/10 hover:border-white/30 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-5 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold font-cinzel text-white mb-1">2026</div>
                  <h3 className="text-white font-bold text-[10px] sm:text-xs md:text-sm tracking-wider uppercase font-sans mb-1.5 sm:mb-2">
                    40-YEAR JUBILEE
                  </h3>
                  <p className="text-zinc-300 text-xs leading-relaxed font-sans font-normal">
                    15,000+ family journeys launched! Celebrating four decades of pristine digital checklists, zero-discrepancy miles, and happy smiles.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Featured Delivery Showcase Banner */}
      <section className="py-4 sm:py-8 bg-transparent relative z-10">
        <div className="container mx-auto max-w-7xl px-3.5 sm:px-6">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/15 aspect-[16/11] sm:aspect-[16/9] md:aspect-[21/9] w-full bg-black/60 group">
            <SmartImage 
              src={heroShowcaseImage} 
              alt="Where Trust Meets Integrity - Bombay Motors Showroom" 
              fallbackSrc="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=1400"
              className="w-full h-full object-cover object-center brightness-90 group-hover:scale-[1.02] transition-all duration-700 ease-out"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-8 md:p-12 pointer-events-none">
              <span className="text-zinc-300 font-sans font-bold text-[10px] sm:text-xs md:text-sm tracking-[0.2em] sm:tracking-[0.25em] uppercase mb-1 sm:mb-1.5 block">
                LBS MARG SHOWROOM
              </span>
              <h2 className="text-white font-sans text-xl sm:text-3xl md:text-5xl font-black uppercase tracking-tight">
                WHERE TRUST MEETS INTEGRITY
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* Story & Showroom Vitals Section */}
      <section className="py-10 sm:py-16 bg-transparent relative z-10">
        <div className="container mx-auto max-w-7xl px-3.5 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            
            {/* Left Column: Narrative Story */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6 animate-fade-in">
              <h2 className="text-xl sm:text-2xl md:text-4xl font-sans font-black text-white tracking-tight uppercase leading-tight">
                YOUR FAMILY'S SAFEST & MOST RELIABLE DRIVE RUNS HERE
              </h2>
              
              <p className="text-zinc-200 text-xs sm:text-sm md:text-base leading-relaxed font-normal">
                At Bombay Motors, we understand that buying a pre-owned car is a milestone for your family. We are not interested in overhyping luxury. Instead, we focus on delivering high-quality, practical mass-market family cars—like Toyota, Hyundai, Maruti Suzuki, Honda, and Tata—at honest, transparent prices. Every family car in our inventory opposing Santoshimata Mandir undergoes an exhaustive multi-point check covering engine longevity, safety airbags, braking efficiency, and complete structural integrity so your loved ones remain safe.
              </p>

              <div className="border-l-2 border-white pl-4 sm:pl-5 py-1.5 sm:py-2 mt-3 sm:mt-4">
                <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed font-normal">
                  We specialize in providing a 100% hassle-free buying experience. From certified on-road test drives to seamless RTO name transfer, insurance renewals, and verified loan assistance, our team walks with you at every step.
                </p>
              </div>

              {/* Core Quality Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-4">
                <div className="frost-card p-3.5 sm:p-4 rounded-xl flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider">Multi-Point Check</h4>
                    <p className="text-zinc-300 text-[11px] leading-relaxed mt-0.5">Engine, transmission, chassis & flood-free guarantee.</p>
                  </div>
                </div>
                <div className="frost-card p-3.5 sm:p-4 rounded-xl flex items-start gap-3">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider">Hassle-Free RTO</h4>
                    <p className="text-zinc-300 text-[11px] leading-relaxed mt-0.5">Prompt, verified registration ownership transfers in Mumbai.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Showroom Vitals Card */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-32 font-sans animate-fade-in">
              <div className="frost-card rounded-2xl p-5 sm:p-7 md:p-8 space-y-5 sm:space-y-6 shadow-2xl border border-white/15">
                <span className="text-zinc-300 font-sans tracking-[0.25em] uppercase text-xs font-bold block">
                  SHOWROOM VITALS
                </span>

                {/* Google Rating */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base font-sans">
                    <Star className="w-4 h-4 fill-white text-white" />
                    <span>Google Rating: 4.3 ★</span>
                  </div>
                  <p className="text-zinc-300 text-[10px] sm:text-[11px] uppercase tracking-wider font-mono font-semibold">
                    VERIFIED ACROSS 109 LOCAL MUMBAI CLIENT REVIEWS.
                  </p>
                </div>

                <div className="border-t border-white/10" />

                {/* Showroom Timings */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm uppercase font-sans">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span>SHOWROOM TIMINGS</span>
                  </div>
                  <p className="text-zinc-300 text-xs font-mono font-semibold tracking-wider">
                    MON–SUN: 10AM – 8:30PM
                  </p>
                </div>

                <div className="border-t border-white/10" />

                {/* Showroom Location */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm uppercase font-sans">
                    <MapPin className="w-4 h-4 text-white" />
                    <span>SHOWROOM ADDRESS</span>
                  </div>
                  <p className="text-zinc-300 text-xs leading-relaxed font-sans">
                    1-A, Ekta Apartment, L.B.S. Marg, Mulund West, opposite Santoshimata Mandir, Mumbai, Maharashtra 400080
                  </p>
                </div>

                <div className="pt-2">
                  <a 
                    href="https://maps.app.goo.gl/maCnSZA5JyHEEMNv8" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-full frost-pill text-white hover:text-black py-2.5 sm:py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider font-sans transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>View Location on Map</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Client Deliveries Section (Patron Archive) */}
      {deliveries.length > 0 && (
        <section className="py-12 sm:py-20 bg-transparent border-t border-white/10 relative z-10">
          <div className="container mx-auto max-w-7xl px-3.5 sm:px-6">
            <div className="text-center mb-10 sm:mb-16 animate-fade-in">
              <span className="text-zinc-300 tracking-[0.25em] uppercase text-[11px] sm:text-xs font-bold mb-2 sm:mb-3 block font-sans">
                MOMENTS OF DISTINCTION
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-sans font-black text-white tracking-tight uppercase mb-3 sm:mb-4">
                MEMORIES <span className="text-zinc-400 font-normal">ON</span> THE ROAD
              </h2>
              <p className="text-zinc-200 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-normal px-2">
                Real, candid snapshots of happy keys and vehicle handovers outside our Mumbai showroom.
              </p>
            </div>

            {/* Photo Wall Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-2">
              {deliveries.map((img, i) => {
                const captions = [
                  "🔑 Milestone Handover",
                  "✨ Premium Acquisition",
                  "🚗 Driving Dream Home",
                  "🌟 Exceptional Delivery",
                  "🖤 Bespoke Client Celebration",
                  "🔥 Pure Motoring Passion"
                ];

                const currentCaption = captions[i % captions.length];

                return (
                  <div 
                    key={i} 
                    id={`patron-card-${i}`}
                    onClick={() => setActivePhotoIndex(i)}
                    className="group relative frost-card p-3 sm:p-4 rounded-2xl transition-all duration-500 ease-out cursor-pointer flex flex-col justify-between hover:-translate-y-1.5"
                  >
                    {/* Photo Canvas Frame with Zoom Effect */}
                    <div className="relative overflow-hidden rounded-xl bg-black/50 aspect-[4/3] w-full">
                      <SmartImage 
                        src={img} 
                        alt={`Client Delivery ${i + 1}`} 
                        fallbackSrc="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                      />
                      
                      <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 frost-pill text-white text-[9px] font-bold tracking-wider uppercase px-2.5 sm:px-3 py-1 rounded-full shadow-sm select-none font-sans">
                        ✓ DELIVERED
                      </div>
                    </div>

                    {/* Metadata & Caption */}
                    <div className="pt-3 sm:pt-4 px-1 flex flex-col justify-between flex-grow">
                      <div>
                        <span className="text-[10px] font-sans text-zinc-400 font-semibold tracking-widest uppercase block mb-1">
                          PATRON ARCHIVE #{i + 1}
                        </span>
                        <p className="font-sans text-white text-xs sm:text-sm md:text-base font-semibold tracking-wide select-none group-hover:text-zinc-200 transition-colors">
                          {currentCaption}
                        </p>
                      </div>

                      <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/10 flex justify-between items-center text-[10px] font-sans text-zinc-300 select-none">
                        <span className="font-semibold text-zinc-300">40+ YEARS LEGACY</span>
                        <span className="text-zinc-200 font-bold">MULUND, MUMBAI</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {activePhotoIndex !== null && (
        <div 
          id="patron-lightbox-backdrop"
          onClick={() => setActivePhotoIndex(null)}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-4 md:p-8"
        >
          {/* Top Control Bar */}
          <div className="absolute top-5 inset-x-0 px-6 flex justify-between items-center text-zinc-300 font-sans text-xs z-10 max-w-7xl mx-auto">
            <div>
              <span className="text-white font-bold">BOMBAY MOTORS</span>
              <span className="mx-2 font-light text-zinc-400">|</span>
              <span className="text-zinc-300">PATRON ARCHIVE {activePhotoIndex + 1} OF {deliveries.length}</span>
            </div>
            
            <button 
              onClick={() => setActivePhotoIndex(null)}
              className="p-3 bg-black border border-white/20 rounded-full text-zinc-200 hover:text-white hover:border-white transition-all flex items-center justify-center cursor-pointer shadow-lg hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Visual Centerpiece */}
          <div className="relative w-full max-w-5xl aspect-[16/10] md:max-h-[70vh] flex items-center justify-center group/lightbox my-auto">
            <button
              onClick={handlePrevPhoto}
              className="absolute left-4 p-4 rounded-2xl bg-black/70 border border-white/20 hover:border-white hover:bg-black text-white transition-all transform -translate-x-12 opacity-0 group-hover/lightbox:translate-x-0 group-hover/lightbox:opacity-100 z-20 cursor-pointer hidden md:flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <SmartImage 
              src={deliveries[activePhotoIndex]} 
              alt="Archival Patron Delivery" 
              fallbackSrc="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800"
              className="w-full h-full object-contain max-h-[70vh] rounded-2xl shadow-2xl border border-white/20 select-none bg-black/50"
            />

            <button
              onClick={handleNextPhoto}
              className="absolute right-4 p-4 rounded-2xl bg-black/70 border border-white/20 hover:border-white hover:bg-black text-white transition-all transform translate-x-12 opacity-0 group-hover/lightbox:translate-x-0 group-hover/lightbox:opacity-100 z-20 cursor-pointer hidden md:flex items-center justify-center"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Navigation Buttons */}
          <div className="flex md:hidden items-center justify-center gap-6 mt-6 z-10">
            <button
              onClick={handlePrevPhoto}
              className="px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-sans text-xs font-bold tracking-widest uppercase flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> PREV
            </button>
            <button
              onClick={handleNextPhoto}
              className="px-6 py-3 rounded-full bg-white text-black font-sans text-xs font-bold tracking-widest uppercase flex items-center gap-2"
            >
              NEXT <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <section className="py-12 sm:py-20 bg-transparent border-t border-white/10 font-sans relative z-10">
        <div className="container mx-auto max-w-7xl px-3.5 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-zinc-300 tracking-[0.2em] uppercase text-[11px] sm:text-xs font-semibold mb-2 sm:mb-3 block font-sans">Verified Endorsements</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-sans font-bold text-white tracking-wide mb-3 sm:mb-4 uppercase">Google Business Ratings</h2>
            <div className="w-20 h-[1px] bg-white/20 mx-auto mt-3 mb-3"></div>
            <p className="text-zinc-300 text-xs max-w-2xl mx-auto tracking-widest font-sans uppercase font-semibold">
              Direct verification from our esteemed client community across Mumbai.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6">
            {MOCK_REVIEWS.map((review) => {
              return (
                <div key={review.id} className="frost-card p-4 sm:p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-1">
                        {[...Array(review.rating)].map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-white text-white" />
                        ))}
                      </div>
                    </div>
                    <p className="text-zinc-200 text-xs leading-relaxed mb-4 font-normal font-sans">"{review.text}"</p>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-xs shrink-0">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-xs tracking-wide">{review.name}</h3>
                      <p className="text-[10px] text-zinc-300 mt-0.5">{review.date}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 sm:mt-10 flex justify-center px-4">
            <a 
              href="https://share.google/VGXKDMtikeDYt2Lcn" 
              target="_blank" 
              rel="noreferrer" 
              className="group flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 frost-pill text-white hover:text-black font-bold rounded-full text-[10.5px] sm:text-xs tracking-wider uppercase font-sans transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-md max-w-[240px] sm:max-w-none w-full sm:w-auto"
            >
              <Star className="w-3.5 h-3.5 fill-white text-white group-hover:text-black shrink-0 transition-colors" />
              <span>View Google Reviews</span>
              <span className="text-xs font-light transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-transparent text-center border-t border-white/10 relative z-10 animate-fade-in overflow-hidden font-sans">
        <div className="container mx-auto max-w-3xl px-4 relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-sans font-black text-white mb-2.5 sm:mb-3 tracking-wide uppercase">Experience Honest Procurement</h2>
          <p className="text-zinc-200 mb-6 sm:mb-7 font-normal tracking-wide text-xs sm:text-sm md:text-base">We welcome you to inspect our verified, certified pre-owned family vehicles in Mumbai.</p>
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-center text-[11px] sm:text-xs tracking-wider uppercase font-sans font-bold max-w-[240px] sm:max-w-none mx-auto">
            <Link to="/inventory" className="bg-white text-black hover:bg-zinc-200 px-5 sm:px-7 py-2.5 sm:py-3 transition-all duration-300 rounded-full shadow-md text-center">
              Browse Collection
            </Link>
            <Link to="/sell" className="frost-pill text-white hover:text-black px-5 sm:px-7 py-2.5 sm:py-3 transition-all duration-300 rounded-full shadow-sm text-center">
              Sell Your Car
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
