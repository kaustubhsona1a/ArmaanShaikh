import { Link } from 'react-router-dom';
import { ShieldCheck, Banknote, FileText, Star, MapPin, Phone, Car, Gauge, Fuel, ExternalLink, Instagram, Video, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatPrice, MOCK_REVIEWS } from '../data/mockData';
import { useVehicles } from '../context/VehicleContext';
import { Helmet } from 'react-helmet-async';

export default function Home() {
  const { vehicles, siteConfig } = useVehicles();
  const featuredCars = vehicles.filter(v => v.status === 'Available').slice(0, 3);
  
  const siteUrl = "https://www.instagram.com/bombaymotorss/";
  const defaultDesc = "Bombay Motors | Mumbai's Premier Boutique for Exotic, Luxury & High-Performance Motorcars. Certified inspection, transparent pricing and bespoke delivery.";

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-zinc-200 font-sans">
      <Helmet>
        <title>Bombay Motors | Exotic & Luxury Motorcars Mumbai</title>
        <meta name="description" content={defaultDesc} />
        <meta property="og:title" content="Bombay Motors | Exotic & Luxury Motorcars Mumbai" />
        <meta property="og:description" content={defaultDesc} />
        <meta property="og:image" content={siteConfig.homeHeroImage} />
        <meta property="og:url" content={siteUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Hero Space - Ultra Clean, Minimalist Plain Hero */}
      <section className="relative min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-5.5rem)] flex flex-col items-center justify-center pt-6 pb-12 overflow-hidden px-4 text-center z-20">
        
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center w-full">
          {/* Action Buttons: Close together as they were with compact dimensions and rich frost effect */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-xs sm:max-w-md mx-auto">
            
            {/* Browse Inventory */}
            <Link 
              to="/inventory" 
              className="flex items-center justify-center w-full sm:w-[175px] h-11 sm:h-12 bg-white text-black font-sans font-bold tracking-wider uppercase text-[11px] sm:text-xs rounded-full transition-all duration-300 shadow-[0_4px_25px_rgba(255,255,255,0.25)] hover:shadow-[0_8px_35px_rgba(255,255,255,0.45)] hover:bg-zinc-100 hover:scale-[1.03] active:scale-98"
            >
              Browse Inventory
            </Link>

            {/* Contact Us */}
            <a 
              href="#contact" 
              className="flex items-center justify-center w-full sm:w-[175px] h-11 sm:h-12 frost-pill text-white font-sans font-semibold tracking-wider uppercase text-[11px] sm:text-xs rounded-full transition-all duration-300 hover:scale-[1.03] active:scale-98"
            >
              Contact Us
            </a>

          </div>

        </div>
      </section>

      {/* Featured Fleet Preview */}
      {featuredCars.length > 0 && (
        <section className="py-12 sm:py-24 bg-transparent relative z-10 border-t border-white/10">
          <div className="container mx-auto max-w-7xl px-3.5 sm:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 sm:mb-14">
              <div>
                <span className="text-zinc-300 tracking-[0.25em] uppercase text-[10px] sm:text-[11px] font-bold mb-1.5 sm:mb-2 block font-sans">Curated Selection</span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-cinzel text-white tracking-wide font-bold uppercase">Featured In The Showroom</h2>
              </div>
              <Link to="/inventory" className="mt-3 md:mt-0 inline-flex items-center gap-2 text-[11px] sm:text-xs uppercase font-sans font-semibold tracking-widest text-zinc-200 hover:text-white border-b border-white/30 pb-0.5 sm:pb-1 transition-all">
                <span>View Full Vault ({vehicles.filter(v => v.status === 'Available').length} Vehicles)</span>
                <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {featuredCars.map((car) => (
                <Link 
                  key={car.id} 
                  to={`/inventory/${car.id}`}
                  className="group relative frost-card rounded-2xl overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-black/60">
                    <img 
                      src={car.images[0] || "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800"} 
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full frost-pill text-[9px] sm:text-[10px] font-sans uppercase tracking-wider text-zinc-100 font-semibold">
                      {car.year} • {car.fuelType}
                    </div>
                    <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full frost-pill text-[9px] sm:text-[10px] font-sans uppercase tracking-wider text-white font-semibold">
                      {car.status}
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="font-cinzel font-bold text-base sm:text-lg text-white group-hover:text-zinc-200 transition-colors uppercase tracking-wider">
                        {car.make} {car.model}
                      </h3>
                      <p className="text-xs text-zinc-300 font-normal mt-1 font-sans">{car.variant}</p>
                    </div>

                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/10 flex items-center justify-between font-sans">
                      <div>
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-300 block font-semibold">Offer Price</span>
                        <span className="text-base sm:text-lg font-bold text-white tracking-tight font-cinzel">{formatPrice(car.price)}</span>
                      </div>
                      <span className="px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full frost-pill text-white group-hover:bg-white group-hover:text-black transition-all text-[10px] sm:text-[11px] font-bold uppercase tracking-wider font-sans">
                        Inspect →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Bombay Motors */}
      <section className="py-12 sm:py-24 bg-transparent relative z-10 border-t border-white/10">
        <div className="container mx-auto max-w-7xl px-3.5 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <span className="text-zinc-300 tracking-[0.25em] uppercase text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2 block font-sans">The Bombay Motors Standard</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-cinzel text-white tracking-wide font-bold uppercase">Engineered For Perfection</h2>
            <div className="w-16 sm:w-20 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent mx-auto mt-3 sm:mt-4"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: ShieldCheck, title: "100+ Point Audit", desc: "Rigorous mechanical, OBD diagnostics, paint-depth check, and aesthetic verification." },
              { icon: Banknote, title: "Fair Value Guarantee", desc: "Completely transparent market appraisals with zero hidden charges or commissions." },
              { icon: Car, title: "Fast Financing & EMI", desc: "Bespoke auto loan options from premier banking institutions with instant approvals." },
              { icon: FileText, title: "Seamless Paperwork", desc: "Hassle-free ownership transfer, RTO clearing, insurance endorsement and doorstep handover." }
            ].map((feature, i) => (
              <div key={i} className="group relative frost-card p-5 sm:p-8 rounded-2xl flex flex-col items-center text-center">
                <div className="w-11 h-11 sm:w-14 sm:h-14 frost-pill flex items-center justify-center mb-4 sm:mb-6 rounded-xl sm:rounded-2xl group-hover:scale-105 transition-all duration-300">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[1.5]" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold tracking-wider text-white mb-1.5 sm:mb-2 uppercase font-cinzel">{feature.title}</h3>
                <p className="text-zinc-300 text-xs leading-relaxed font-normal font-sans">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials & Google Business Reviews - Rich Frosted Glass Cards */}
      <section className="py-12 sm:py-24 bg-transparent animate-fade-in relative z-10 border-t border-white/10">
         <div className="container mx-auto max-w-7xl px-3.5 sm:px-6">
           <div className="text-center mb-10 sm:mb-16">
             <span className="text-zinc-300 tracking-[0.25em] uppercase text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2 block font-sans">Client Testimonials</span>
             <h2 className="text-2xl sm:text-3xl md:text-5xl font-cinzel text-white tracking-wider font-bold uppercase">Google Business Ratings</h2>
             <div className="w-20 sm:w-24 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent mx-auto mt-3 sm:mt-4"></div>
             <p className="text-zinc-300 text-[11px] sm:text-xs mt-2.5 sm:mt-3 tracking-widest font-sans uppercase">Verified ratings from our distinguished Mumbai patrons</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
             {MOCK_REVIEWS.map((review) => (
               <div key={review.id} className="frost-card p-5 sm:p-8 rounded-2xl flex flex-col justify-between h-full">
                 <div>
                   <div className="flex mb-4 sm:mb-5 space-x-1 sm:space-x-1.5">
                     {[...Array(review.rating)].map((_, idx) => (
                       <Star key={idx} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-white" />
                     ))}
                   </div>
                   <p className="text-zinc-100 italic text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 flex-grow font-normal font-sans">"{review.text}"</p>
                 </div>
                 <div className="border-t border-white/10 pt-3 sm:pt-4 flex justify-between items-center font-sans">
                   <div>
                     <p className="font-cinzel font-bold text-white uppercase tracking-wider text-xs mb-0.5">{review.name}</p>
                     <p className="text-[10px] text-zinc-300 tracking-wider font-medium">{review.date}</p>
                   </div>
                   <span className="text-[9px] sm:text-[10px] frost-pill text-zinc-100 font-semibold px-2.5 sm:px-3 py-1 rounded-full font-sans">✓ Verified</span>
                 </div>
               </div>
             ))}
           </div>

           <div className="mt-10 sm:mt-14 flex justify-center">
             <a 
               href="https://share.google/VGXKDMtikeDYt2Lcn" 
               target="_blank" 
               rel="noreferrer" 
               className="group flex items-center justify-between gap-4 sm:gap-6 px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-black font-sans font-bold rounded-full text-[11px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_4px_25px_rgba(255,255,255,0.25)] hover:shadow-[0_8px_35px_rgba(255,255,255,0.45)] hover:bg-zinc-100 hover:scale-[1.02] max-w-md w-full sm:w-auto"
             >
               <div className="flex items-center gap-2.5 sm:gap-3">
                 <Star className="w-4 h-4 fill-current text-black" />
                 <span>Write or View Google Reviews</span>
               </div>
               <span className="text-sm font-light transition-transform duration-300 group-hover:translate-x-1.5">→</span>
             </a>
           </div>

         </div>
      </section>

      {/* Instagram Reels Showcase Section */}
      {siteConfig.instagramReels && siteConfig.instagramReels.length > 0 && (
        <section className="py-12 sm:py-24 bg-transparent relative z-10 border-t border-white/10">
          <div className="container mx-auto max-w-7xl px-3.5 sm:px-6">
            <div className="text-center mb-10 sm:mb-16">
              <span className="text-zinc-300 tracking-[0.2em] uppercase text-[10px] sm:text-xs font-bold mb-2 sm:mb-3 block font-sans">Social Feed</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-cinzel text-white tracking-wide font-bold uppercase">Featured Instagram Reels</h2>
              <div className="w-16 sm:w-20 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent mx-auto mt-3 sm:mt-4"></div>
              <p className="text-zinc-300 text-[11px] sm:text-xs mt-2.5 sm:mt-3 uppercase tracking-wider font-sans">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center items-stretch">
              {siteConfig.instagramReels.map((url, idx) => {
                const match = url.match(/(?:\/p\/|\/reel\/|\/tv\/)([A-Za-z0-9_-]+)/);
                const reelId = match ? match[1] : null;
                
                if (!reelId) return null;
  
                return (
                  <div key={idx} className="frost-card rounded-2xl p-4 flex flex-col justify-between">
                    <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-black shadow-inner">
                      <iframe 
                        src={`https://www.instagram.com/reel/${reelId}/embed`}
                        className="absolute inset-0 w-full h-full border-0 rounded-xl"
                        allowtransparency="true"
                        allow="encrypted-media"
                        scrolling="no"
                      />
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between font-sans text-[10px] text-zinc-300 uppercase tracking-widest px-1">
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
      <section id="contact" className="py-24 flex flex-col justify-center items-center bg-transparent border-t border-white/10 relative overflow-hidden z-10 scroll-mt-20">
        <div className="w-full max-w-4xl flex flex-col justify-center px-6 sm:px-8 text-center relative z-10">
          <span className="text-zinc-300 tracking-[0.25em] uppercase text-xs font-bold mb-4 block font-sans">Boutique Location</span>
          <h2 className="text-3xl md:text-5xl font-cinzel text-white font-bold mb-16 tracking-wide uppercase">Visit Our Showroom</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="flex flex-col items-center frost-card p-10 rounded-2xl text-zinc-200">
              <div className="w-16 h-16 frost-pill rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-7 h-7 text-white stroke-[1.5]" />
              </div>
              <h3 className="font-cinzel tracking-widest text-xs uppercase text-white mb-4 font-bold">Showroom Address</h3>
              <p className="text-zinc-200 text-sm leading-relaxed tracking-wide font-normal font-sans">
                Shop No 10, Neel Empire,<br/>
                Sector 25, Nerul East,<br/>
                Navi Mumbai, Maharashtra 400706
              </p>
              <a 
                href="https://share.google/VGXKDMtikeDYt2Lcn" 
                target="_blank" 
                rel="noreferrer" 
                className="mt-8 text-white hover:text-zinc-300 text-xs tracking-widest uppercase font-sans border-b border-white/40 hover:border-white pb-1 transition-all inline-flex items-center gap-2 font-bold"
              >
                <span>Get Directions & Reviews</span>
                <ExternalLink className="w-3.5 h-3.5 text-white" />
              </a>
            </div>
            <div className="flex flex-col items-center frost-card p-10 rounded-2xl text-zinc-200">
              <div className="w-16 h-16 frost-pill rounded-full flex items-center justify-center mb-6">
                <Phone className="w-7 h-7 text-white stroke-[1.5]" />
              </div>
              <h3 className="font-cinzel tracking-widest text-xs uppercase text-white mb-4 font-bold">Direct Inquiries</h3>
              <a href="tel:+917400113999" className="text-white text-2xl tracking-wide hover:text-zinc-300 transition-all font-sans font-bold my-auto">+91 74001 13999</a>
              <div className="flex items-center gap-4 mt-8 font-sans">
                <a 
                  href="tel:+917400113999" 
                  className="text-zinc-200 hover:text-white text-xs tracking-widest uppercase border-b border-zinc-400 pb-1 transition-all font-bold"
                >
                  Call Now
                </a>
                <span className="text-zinc-400">•</span>
                <a 
                  href="https://wa.me/917400113999" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-white hover:text-zinc-300 text-xs tracking-widest uppercase border-b border-white/40 pb-1 transition-all font-bold"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

