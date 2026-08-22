import { Link } from 'react-router-dom';
import { Star, MapPin, Phone, ExternalLink, Video, Gauge, Fuel, Settings, ShieldCheck, Instagram, ArrowRight } from 'lucide-react';
import { formatPrice, MOCK_REVIEWS } from '../data/mockData';
import { useVehicles } from '../context/VehicleContext';
import { Helmet } from 'react-helmet-async';

export default function Home() {
  const { vehicles, siteConfig } = useVehicles();
  const featuredCars = vehicles.filter(v => v.status === 'Available').slice(0, 3);
  
  const siteUrl = "https://www.instagram.com/bombaymotorss/";
  const defaultDesc = "Bombay Motors | Mumbai's Premier Boutique for Certified Pre-Owned, Family & Premium Motorcars. Certified inspection, transparent pricing and fast delivery across Mumbai & Eastern Suburbs.";

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-zinc-200 font-sans">
      <Helmet>
        <title>Bombay Motors | Certified Pre-Owned Motorcars Mumbai</title>
        <meta name="description" content={defaultDesc} />
        <meta property="og:title" content="Bombay Motors | Certified Pre-Owned Motorcars Mumbai" />
        <meta property="og:description" content={defaultDesc} />
        <meta property="og:image" content={siteConfig.homeHeroImage} />
        <meta property="og:url" content={siteUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Hero Space - Full Viewport Fold with Centered Action Buttons */}
      <section className="relative h-[calc(100dvh-4.5rem)] sm:h-[calc(100dvh-5rem)] min-h-[520px] flex flex-col items-center justify-center py-12 sm:py-16 overflow-hidden px-4 sm:px-8 md:px-16 text-center z-20 pointer-events-none">
        
        <div className="w-full max-w-xl md:max-w-3xl mx-auto flex flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 pointer-events-auto">
          
          {/* Browse Inventory: Positioned with halo ring */}
          <div className="flex justify-center">
            <Link 
              to="/inventory" 
              className="flex items-center justify-center w-[145px] sm:w-[170px] md:w-[190px] h-[38px] sm:h-[44px] md:h-[48px] bg-white border border-white text-black font-sans font-bold tracking-wider uppercase text-[9.5px] sm:text-xs rounded-full ring-2 ring-white/60 ring-offset-2 ring-offset-black/80 whitespace-nowrap transition-all duration-300 shadow-[0_4px_25px_rgba(255,255,255,0.35)] hover:shadow-[0_8px_35px_rgba(255,255,255,0.6)] hover:ring-white hover:bg-zinc-100 hover:scale-105 active:scale-95"
            >
              Browse Inventory
            </Link>
          </div>

          {/* Contact Us: Positioned with matching high-contrast halo ring & identical dimensions */}
          <div className="flex justify-center">
            <a 
              href="#contact" 
              className="flex items-center justify-center w-[145px] sm:w-[170px] md:w-[190px] h-[38px] sm:h-[44px] md:h-[48px] bg-black/60 border border-white/40 text-white font-sans font-bold tracking-wider uppercase text-[9.5px] sm:text-xs rounded-full ring-2 ring-white/60 ring-offset-2 ring-offset-black/80 backdrop-blur-xl whitespace-nowrap transition-all duration-300 hover:scale-105 hover:ring-white hover:bg-white hover:text-black active:scale-95 shadow-[0_4px_25px_rgba(0,0,0,0.6)]"
            >
              Contact Us
            </a>
          </div>

        </div>
      </section>

      {/* Main Content Area - Sits Below the Fold with Opaque Showroom Backdrop */}
      <div className="relative z-20 bg-[#070709] border-t border-white/10 shadow-[0_-20px_50px_rgba(7,7,9,0.95)]">
        {/* Featured Collection Section */}
        {featuredCars.length > 0 && (
          <section className="py-12 sm:py-20 bg-transparent relative z-10">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            
            {/* Header Row */}
            <div className="flex flex-row justify-between items-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-sans font-extrabold text-white tracking-tight">
                Featured Collection
              </h2>
              <Link 
                to="/inventory" 
                className="inline-flex items-center gap-1.5 text-[10.5px] sm:text-xs uppercase font-sans font-semibold tracking-[0.18em] text-zinc-300 hover:text-white transition-colors group"
              >
                <span>VIEW ENTIRE COLLECTION</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* 3-Column Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredCars.map((car) => {
                const reelUrl = car.instagramReel || (siteConfig.instagramReels && siteConfig.instagramReels.length > 0 ? siteConfig.instagramReels[0] : "https://www.instagram.com/bombaymotorss/");

                return (
                  <div 
                    key={car.id} 
                    className="group relative bg-[#0e0e12]/90 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 flex flex-col justify-between hover:border-white/25 transition-all duration-300 shadow-2xl hover:shadow-[0_15px_40px_rgba(0,0,0,0.8)]"
                  >
                    {/* Top Image Container with Badges */}
                    <div className="relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-black/80 mb-4 sm:mb-5">
                      <img 
                        src={car.images[0] || "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800"} 
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" 
                      />
                      
                      {/* Year Badge (Top-Left) */}
                      <div className="absolute top-3 left-3 px-3 py-1 bg-black/75 backdrop-blur-md border border-white/10 text-white text-[11px] sm:text-xs font-mono font-bold rounded-lg tracking-wider shadow-md">
                        {car.year}
                      </div>

                      {/* Watch Reel Badge (Top-Right) */}
                      <a 
                        href={reelUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 text-white text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-lg shadow-pink-950/40 hover:scale-105 active:scale-95 transition-all z-10"
                        title="Watch Instagram Reel"
                      >
                        <Instagram className="w-3 h-3" />
                        <span>WATCH REEL</span>
                      </a>
                    </div>

                    {/* Content Details */}
                    <div className="flex flex-col flex-grow justify-between px-1">
                      <div>
                        {/* Title: Make (Bold) Model (Normal) */}
                        <h3 className="text-lg sm:text-xl font-sans tracking-tight text-white mb-1">
                          <span className="font-extrabold">{car.make}</span>{" "}
                          <span className="font-normal text-zinc-200">{car.model}</span>
                        </h3>

                        {/* Variant / Subtitle */}
                        <p className="text-[10.5px] sm:text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3.5">
                          {car.variant || "PREMIUM SPEC"}
                        </p>

                        {/* Price with Red Accent Indicator */}
                        <div className="flex items-center gap-2 mb-4 sm:mb-5">
                          <span className="w-1.5 h-5 sm:h-6 bg-red-600 rounded-full inline-block shrink-0"></span>
                          <span className="text-xl sm:text-2xl font-bold font-sans text-white tracking-tight">
                            {formatPrice(car.price)}
                          </span>
                        </div>
                      </div>

                      {/* 2x2 Specs Grid */}
                      <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 py-3 sm:py-3.5 border-t border-white/10 text-zinc-300 text-xs font-sans">
                        <div className="flex items-center gap-2">
                          <Gauge className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{car.mileage ? `${car.mileage.toLocaleString('en-IN')} KM` : '39,000 KM'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Fuel className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{car.fuelType || 'Petrol'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Settings className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{car.transmission || 'Automatic'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{car.ownership || 'Standard'}</span>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <Link 
                        to={`/inventory/${car.id}`}
                        className="mt-4 sm:mt-5 w-full py-2.5 sm:py-3 border border-white/15 hover:border-white/40 hover:bg-white hover:text-black rounded-xl text-center text-[10.5px] sm:text-xs uppercase tracking-widest font-bold text-zinc-300 transition-all duration-300 block"
                      >
                        VIEW DETAILS
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials & Google Business Reviews */}
      <section className="py-12 sm:py-20 bg-transparent animate-fade-in relative z-10 border-t border-white/10">
         <div className="container mx-auto max-w-7xl px-3.5 sm:px-6">
           <div className="text-center mb-8 sm:mb-12">
             <span className="text-zinc-300 tracking-[0.25em] uppercase text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2 block font-sans">Verified Feedback</span>
             <h2 className="text-2xl sm:text-3xl md:text-4xl font-cinzel text-white tracking-wider font-bold uppercase">Customer Reviews</h2>
             <div className="w-16 sm:w-20 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent mx-auto mt-2.5 sm:mt-3"></div>
             <p className="text-zinc-300 text-[11px] sm:text-xs mt-2 sm:mt-2.5 tracking-wider font-sans uppercase">Authentic experiences from families across Mumbai & Eastern Suburbs</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6">
             {MOCK_REVIEWS.map((review) => (
               <div key={review.id} className="frost-card p-4 sm:p-5 rounded-2xl flex flex-col justify-between h-full">
                 <div>
                   <div className="flex mb-3 space-x-1">
                     {[...Array(review.rating)].map((_, idx) => (
                       <Star key={idx} className="w-3.5 h-3.5 fill-current text-white" />
                     ))}
                   </div>
                   <p className="text-zinc-200 text-xs leading-relaxed mb-4 flex-grow font-normal font-sans">"{review.text}"</p>
                 </div>
                 <div className="border-t border-white/10 pt-3 flex justify-between items-center font-sans">
                   <div>
                     <p className="font-cinzel font-bold text-white uppercase tracking-wider text-xs mb-0.5">{review.name}</p>
                     <p className="text-[10px] text-zinc-300 tracking-wider font-medium">{review.date}</p>
                   </div>
                   <span className="text-[9px] frost-pill text-zinc-100 font-semibold px-2 py-0.5 rounded-full font-sans">✓ Verified</span>
                 </div>
               </div>
             ))}
           </div>

           <div className="mt-8 sm:mt-10 flex justify-center px-4">
             <a 
               href="https://share.google/VGXKDMtikeDYt2Lcn" 
               target="_blank" 
               rel="noreferrer" 
               className="group flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white text-black font-sans font-bold rounded-full text-[10.5px] sm:text-xs tracking-wider uppercase transition-all duration-300 shadow-md hover:bg-zinc-100 active:scale-95 max-w-[240px] sm:max-w-none w-full sm:w-auto"
             >
               <Star className="w-3.5 h-3.5 fill-current text-black shrink-0" />
               <span>View Google Reviews</span>
               <span className="text-xs font-light transition-transform duration-300 group-hover:translate-x-1">→</span>
             </a>
           </div>

         </div>
      </section>

      {/* Instagram Reels Showcase Section */}
      {siteConfig.instagramReels && siteConfig.instagramReels.length > 0 && (
        <section className="py-12 sm:py-20 bg-transparent relative z-10 border-t border-white/10">
          <div className="container mx-auto max-w-7xl px-3.5 sm:px-6">
            <div className="text-center mb-8 sm:mb-12">
              <span className="text-zinc-300 tracking-[0.2em] uppercase text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2 block font-sans">Social Feed</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-cinzel text-white tracking-wide font-bold uppercase">Featured Instagram Reels</h2>
              <div className="w-16 sm:w-20 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent mx-auto mt-2 sm:mt-3"></div>
              <p className="text-zinc-300 text-[11px] sm:text-xs mt-2 sm:mt-2.5 uppercase tracking-wider font-sans">
                Interactive video reels direct from{" "}
                <a 
                  href="https://www.instagram.com/bombaymotorss/" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-white underline hover:text-zinc-300 transition-all font-bold"
                >
                  @bombaymotorss
                </a>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-center items-stretch">
              {siteConfig.instagramReels.map((url, idx) => {
                const match = url.match(/(?:\/p\/|\/reel\/|\/tv\/)([A-Za-z0-9_-]+)/);
                const reelId = match ? match[1] : null;
                
                if (!reelId) return null;
  
                return (
                  <div key={idx} className="frost-card rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
                    <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-black shadow-inner">
                      <iframe 
                        src={`https://www.instagram.com/reel/${reelId}/embed`}
                        className="absolute inset-0 w-full h-full border-0 rounded-xl"
                        allowtransparency="true"
                        allow="encrypted-media"
                        scrolling="no"
                      />
                    </div>
                    <div className="mt-3 sm:mt-4 pt-2 sm:pt-2.5 border-t border-white/10 flex items-center justify-between font-sans text-[10px] text-zinc-300 uppercase tracking-widest px-1">
                      <span className="flex items-center gap-1.5 text-zinc-100 font-semibold"><Video className="w-3.5 h-3.5 text-white" /> Reel #{idx + 1}</span>
                      <a href={url} target="_blank" rel="noreferrer" className="text-white hover:text-zinc-300 flex items-center gap-1 font-bold">
                        OPEN REEL <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Showroom & Contact Section with Google Maps Link */}
      <section id="contact" className="pt-10 pb-4 sm:pt-16 sm:pb-8 flex flex-col justify-center items-center bg-transparent border-t border-white/10 relative overflow-hidden z-10 scroll-mt-20">
        <div className="w-full max-w-4xl flex flex-col justify-center px-4 sm:px-6 text-center relative z-10">
          <span className="text-zinc-300 tracking-[0.25em] uppercase text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2 block font-sans">Showroom Location</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-cinzel text-white font-bold mb-8 sm:mb-12 tracking-wide uppercase">Visit Bombay Motors</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div className="flex flex-col items-center frost-card p-5 sm:p-7 md:p-8 rounded-2xl text-zinc-200">
              <div className="w-11 h-11 sm:w-13 sm:h-13 frost-pill rounded-full flex items-center justify-center mb-3.5 sm:mb-5">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[1.5]" />
              </div>
              <h3 className="font-cinzel tracking-widest text-[11px] sm:text-xs uppercase text-white mb-2 sm:mb-3 font-bold">Showroom Address</h3>
              <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed tracking-wide font-normal font-sans">
                1-A, Ekta Apartment, L.B.S. Marg,<br/>
                opposite Santoshimata Mandir, Mulund West,<br/>
                Mumbai, Maharashtra 400080
              </p>
              <a 
                href="https://maps.app.goo.gl/maCnSZA5JyHEEMNv8" 
                target="_blank" 
                rel="noreferrer" 
                className="mt-4 sm:mt-6 text-white hover:text-zinc-300 text-[11px] sm:text-xs tracking-widest uppercase font-sans border-b border-white/40 hover:border-white pb-0.5 transition-all inline-flex items-center gap-1.5 font-bold"
              >
                <span>Get Directions & Reviews</span>
                <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              </a>
            </div>
            <div className="flex flex-col items-center frost-card p-5 sm:p-7 md:p-8 rounded-2xl text-zinc-200">
              <div className="w-11 h-11 sm:w-13 sm:h-13 frost-pill rounded-full flex items-center justify-center mb-3.5 sm:mb-5">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[1.5]" />
              </div>
              <h3 className="font-cinzel tracking-widest text-[11px] sm:text-xs uppercase text-white mb-2 sm:mb-3 font-bold">Direct Inquiries</h3>
              <a href="tel:+917400113999" className="text-white text-lg sm:text-xl md:text-2xl tracking-wide hover:text-zinc-300 transition-all font-sans font-bold my-auto">+91 74001 13999</a>
              <div className="flex items-center gap-4 mt-4 sm:mt-6 font-sans">
                <a 
                  href="tel:+917400113999" 
                  className="text-zinc-200 hover:text-white text-[11px] sm:text-xs tracking-widest uppercase border-b border-zinc-400 pb-0.5 transition-all font-bold"
                >
                  Call Now
                </a>
                <span className="text-zinc-400">•</span>
                <a 
                  href="https://wa.me/917400113999" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-white hover:text-zinc-300 text-[11px] sm:text-xs tracking-widest uppercase border-b border-white/40 pb-0.5 transition-all font-bold"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
