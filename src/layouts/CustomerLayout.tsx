import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, MessageCircle, Instagram, Twitter, Menu, X, Star, Upload, Image, Check, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import { useVehicles, sanitizeHeroImage } from '../context/VehicleContext';
import { useAuth } from '../context/AuthContext';

let globalVideoFinished = false;

export default function CustomerLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notification, setNotification] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  const { siteConfig } = useVehicles();
  const { loginAsDealer } = useAuth();
  const isHomePage = location.pathname === '/';
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const desktopVideoRef = React.useRef<HTMLVideoElement>(null);
  const mobileVideoRef = React.useRef<HTMLVideoElement>(null);
  const hasPlayedRef = React.useRef(false);
  const [isFading, setIsFading] = React.useState(false);

  const handleVideoEnded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    globalVideoFinished = true;
    setIsFading(false);
    video.pause();
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (globalVideoFinished && video.duration && !isNaN(video.duration)) {
      video.currentTime = video.duration;
    }
  };

  React.useEffect(() => {
    if (isHomePage) {
      if (globalVideoFinished) {
        if (desktopVideoRef.current && !isNaN(desktopVideoRef.current.duration)) {
          desktopVideoRef.current.pause();
          desktopVideoRef.current.currentTime = desktopVideoRef.current.duration;
        }
        if (mobileVideoRef.current && !isNaN(mobileVideoRef.current.duration)) {
          mobileVideoRef.current.pause();
          mobileVideoRef.current.currentTime = mobileVideoRef.current.duration;
        }
        return;
      }

      if (scrollY > 5) {
        if (!hasPlayedRef.current) {
          hasPlayedRef.current = true;
          desktopVideoRef.current?.play().catch(() => {});
          mobileVideoRef.current?.play().catch(() => {});
        }
      }
    }
  }, [scrollY, isHomePage]);

  // Custom multi-tap tracker for dealer console access on mobile (esp. iPhone Safari)
  const tapCountRef = React.useRef(0);
  const lastTapTimeRef = React.useRef(0);
  const isTouchRef = React.useRef(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const handleSecretLogin = () => {
    setNotification('Opening Dealer Login...');
    setTimeout(() => {
      navigate('/dealer-management');
      setNotification('');
    }, 800);
  };

  const registerTap = () => {
    const now = Date.now();
    const lastTapTime = lastTapTimeRef.current;
    const currentTapCount = tapCountRef.current;

    if (now - lastTapTime < 1500) {
      const nextCount = currentTapCount + 1;
      if (nextCount >= 3) {
        handleSecretLogin();
        tapCountRef.current = 0;
      } else {
        tapCountRef.current = nextCount;
      }
    } else {
      tapCountRef.current = 1;
    }
    lastTapTimeRef.current = now;
  };

  const handleCopyrightClick = (e: React.MouseEvent) => {
    if (isTouchRef.current) {
      // Handled by touch event, reset flag and skip click to avoid double registering
      isTouchRef.current = false;
      return;
    }
    registerTap();
  };

  const handleCopyrightTouch = (e: React.TouchEvent) => {
    isTouchRef.current = true;
    registerTap();
  };

  const showVideo = false;
  const showMobileVideo = false;

  return (
    <div className="min-h-screen flex flex-col font-sans text-zinc-300 relative bg-transparent">
      {/* Dynamic secret greeting/bypass notification */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[10000] bg-zinc-900 text-white font-semibold text-xs tracking-widest uppercase font-mono px-8 py-5 rounded-full shadow-2xl border border-zinc-800 flex items-center space-x-3 transition-all animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span>{notification}</span>
        </div>
      )}

          {/* Global Background - Showroom Backdrop with Rich Frosted Glass Ambient Theme */}
      <div className="fixed top-0 bottom-0 left-0 right-0 z-0 bg-[#070709] overflow-hidden pointer-events-none">
        {/* Desktop Showcase Backdrop */}
        {showVideo ? (
          <video 
            ref={desktopVideoRef}
            src={siteConfig.homeHeroVideo}
            className={`hidden md:block absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ease-in-out ${
              isFading ? 'opacity-0' : 'opacity-100'
            }`}
            muted
            playsInline
            onEnded={handleVideoEnded}
            onLoadedMetadata={handleLoadedMetadata}
          />
        ) : (
          siteConfig.homeHeroImage && (
            <img 
              src={siteConfig.homeHeroImage}
              alt="Showroom Desktop Backdrop"
              className={`hidden md:block absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ease-in-out ${
                isFading ? 'opacity-0' : 'opacity-100'
              }`}
            />
          )
        )}
        
        {/* Mobile-specific Showcase Backdrop */}
        {showMobileVideo ? (
          <video 
            ref={mobileVideoRef}
            src={siteConfig.homeHeroMobileVideo || siteConfig.homeHeroVideo}
            className={`block md:hidden absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ease-in-out ${
              isFading ? 'opacity-0' : 'opacity-100'
            }`}
            muted
            playsInline
            onEnded={handleVideoEnded}
            onLoadedMetadata={handleLoadedMetadata}
          />
        ) : (
          (siteConfig.homeHeroMobileImage || siteConfig.homeHeroImage) && (
            <img 
              src={siteConfig.homeHeroMobileImage || siteConfig.homeHeroImage}
              alt="Showroom Mobile Backdrop"
              className={`block md:hidden absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ease-in-out ${
                isFading ? 'opacity-0' : 'opacity-100'
              }`}
            />
          )
        )}
        {/* Crystal-clear Base Gradient for Hero */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none" />

        {/* Complete Frosted Glass Layer - Activated on scroll or on non-home pages */}
        <div 
          className={`absolute inset-0 bg-[#070709]/60 backdrop-blur-xl md:backdrop-blur-2xl transition-all duration-700 ease-out pointer-events-none ${
            (!isHomePage || isScrolled) ? 'opacity-100' : 'opacity-0'
          }`} 
        />

         {/* Clean Subtle Monochrome Ambient Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-white/[0.02] rounded-full blur-[160px] pointer-events-none z-2"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] bg-white/[0.015] rounded-full blur-[180px] pointer-events-none z-2"></div>
      </div>

      <div className="relative z-10 flex flex-col flex-grow min-h-screen">
        {/* Main Navbar - Ultra-Rich Frosted Glass Header with Exact Visual Elements from Screenshot */}
        <nav className={`sticky top-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'frost-nav-scrolled' 
            : 'frost-nav'
        } text-zinc-100`}>

          <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-3.5 sm:py-4 flex justify-between items-center">
            
            {/* Left Side: Branding Logo or Text */}
            <Link to="/" className="flex items-center shrink-0 select-none group">
              {siteConfig.logo ? (
                <img src={siteConfig.logo} alt="Bombay Motors" className="h-9 sm:h-11 md:h-12 w-auto max-w-[200px] object-contain transition-all duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl md:text-2xl font-cinzel font-bold tracking-[0.15em] text-white group-hover:text-zinc-300 transition-colors uppercase">
                    BOMBAY MOTORS
                  </span>
                  <span className="text-[7.5px] sm:text-[8px] font-mono tracking-[0.35em] text-zinc-400 uppercase font-semibold">Exotic & Luxury Motorcars</span>
                </div>
              )}
            </Link>

            {/* Right/Middle Side: Frosted Glass Icons & Navigation Links matching user screenshot */}
            <div className="flex items-center space-x-3 sm:space-x-5 md:space-x-7">
              
              {/* Desktop Phone Number with Circular Frosted Icon */}
              <div className="hidden md:flex items-center space-x-3 text-xs tracking-wider font-sans text-zinc-200">
                <a 
                  href="tel:+917400113999" 
                  className="flex items-center group font-medium hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-full frost-pill flex items-center justify-center mr-2.5 shrink-0 text-zinc-200 group-hover:text-white">
                    <Phone className="w-3.5 h-3.5 stroke-[1.5]" />
                  </div>
                  <span className="text-zinc-200 font-medium tracking-wide text-[13px] font-sans">+91 74001 13999</span>
                </a>
              </div>

              {/* Vertical Subtle Divider */}
              <div className="hidden md:block h-5 w-[1px] bg-white/20"></div>

              {/* Frosted Rounded Pill Social & Location Icon Buttons */}
              <div className="hidden md:flex items-center space-x-2.5">
                <a 
                  href="https://www.instagram.com/bombaymotorss/" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-8 h-8 rounded-full frost-pill flex items-center justify-center text-zinc-200 hover:text-white"
                  title="Instagram @bombaymotorss"
                >
                  <Instagram className="w-3.5 h-3.5 stroke-[1.5]" />
                </a>
                <a 
                  href="https://wa.me/917400113999" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-8 h-8 rounded-full frost-pill flex items-center justify-center text-zinc-200 hover:text-white"
                  title="WhatsApp Assistant"
                >
                  <MessageCircle className="w-3.5 h-3.5 stroke-[1.5]" />
                </a>
                <a 
                  href="https://share.google/VGXKDMtikeDYt2Lcn" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-8 h-8 rounded-full frost-pill flex items-center justify-center text-zinc-200 hover:text-white"
                  title="Google Location & Showroom"
                >
                  <MapPin className="w-3.5 h-3.5 stroke-[1.5]" />
                </a>
              </div>

              {/* Desktop Navigation Links matching exact typography & underline in screenshot */}
              <div className="hidden md:flex items-center space-x-7 lg:space-x-8 text-[12.5px] tracking-[0.14em] uppercase font-sans font-semibold">
                <Link 
                  to="/" 
                  className={`relative py-1.5 transition-all duration-300 ${
                    location.pathname === '/' 
                      ? 'text-white font-bold' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  HOME
                  {location.pathname === '/' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"></span>
                  )}
                </Link>
                <Link 
                  to="/inventory" 
                  className={`relative py-1.5 transition-all duration-300 ${
                    location.pathname.startsWith('/inventory') 
                      ? 'text-white font-bold' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  SHOWROOM
                  {location.pathname.startsWith('/inventory') && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"></span>
                  )}
                </Link>
                <Link 
                  to="/sell" 
                  className={`relative py-1.5 transition-all duration-300 ${
                    location.pathname === '/sell' 
                      ? 'text-white font-bold' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  SELL CAR
                  {location.pathname === '/sell' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"></span>
                  )}
                </Link>
                <Link 
                  to="/about" 
                  className={`relative py-1.5 transition-all duration-300 ${
                    location.pathname === '/about' 
                      ? 'text-white font-bold' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ABOUT
                  {location.pathname === '/about' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"></span>
                  )}
                </Link>
                <a 
                  href="#contact" 
                  className="relative py-1.5 text-zinc-400 hover:text-white transition-all duration-300"
                >
                  CONTACT
                </a>
              </div>

              {/* Mobile Quick Action Buttons & Menu Toggle */}
              <div className="flex md:hidden items-center space-x-2">
                <a 
                  href="tel:+917400113999" 
                  className="w-8 h-8 rounded-full frost-pill flex items-center justify-center text-zinc-200 hover:text-white"
                  title="Call Showroom"
                >
                  <Phone className="w-3.5 h-3.5 stroke-[1.5]" />
                </a>
                <a 
                  href="https://wa.me/917400113999" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-8 h-8 rounded-full frost-pill flex items-center justify-center text-zinc-200 hover:text-white"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 stroke-[1.5]" />
                </a>
                <button 
                  className="w-8 h-8 rounded-full frost-pill flex items-center justify-center text-zinc-200 hover:text-white ml-0.5" 
                  onClick={() => setIsMenuOpen(!isMenuOpen)} 
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>

            </div>
          </div>

          {/* Mobile Navigation Drawer with Translucent Frosted Glass Styling */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-black/75 backdrop-blur-2xl border-b border-white/15 border-t border-white/10 px-5 py-5 flex flex-col space-y-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 animate-fade-in">
              <Link 
                to="/" 
                onClick={closeMenu} 
                className={`px-4 py-3 rounded-xl transition-all duration-200 text-xs font-semibold tracking-widest uppercase font-sans flex items-center justify-between ${
                  location.pathname === '/' 
                    ? 'bg-white/15 text-white font-bold border border-white/20' 
                    : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>Home</span>
                {location.pathname === '/' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
              </Link>
              
              <Link 
                to="/inventory" 
                onClick={closeMenu} 
                className={`px-4 py-3 rounded-xl transition-all duration-200 text-xs font-semibold tracking-widest uppercase font-sans flex items-center justify-between ${
                  location.pathname.startsWith('/inventory') 
                    ? 'bg-white/15 text-white font-bold border border-white/20' 
                    : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>Showroom</span>
                {location.pathname.startsWith('/inventory') && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
              </Link>
              
              <Link 
                to="/sell" 
                onClick={closeMenu} 
                className={`px-4 py-3 rounded-xl transition-all duration-200 text-xs font-semibold tracking-widest uppercase font-sans flex items-center justify-between ${
                  location.pathname === '/sell' 
                    ? 'bg-white/15 text-white font-bold border border-white/20' 
                    : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>Sell Your Car</span>
                {location.pathname === '/sell' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
              </Link>
              
              <Link 
                to="/about" 
                onClick={closeMenu} 
                className={`px-4 py-3 rounded-xl transition-all duration-200 text-xs font-semibold tracking-widest uppercase font-sans flex items-center justify-between ${
                  location.pathname === '/about' 
                    ? 'bg-white/15 text-white font-bold border border-white/20' 
                    : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>About</span>
                {location.pathname === '/about' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
              </Link>
              
              <a 
                href="#contact" 
                onClick={closeMenu} 
                className="px-4 py-3 rounded-xl transition-all duration-200 text-xs font-semibold tracking-widest uppercase font-sans text-zinc-300 hover:bg-white/10 hover:text-white flex items-center justify-between"
              >
                <span>Contact</span>
              </a>

              {/* Mobile Menu Footer Details */}
              <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-sans text-zinc-400 px-2">
                <span>+91 74001 13999</span>
                <span>MULUND, MUMBAI</span>
              </div>
            </div>
          )}
        </nav>

      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer - Frosted Glass Container */}
      <footer id="contact" className="bg-black/40 backdrop-blur-2xl border-t border-white/10 text-zinc-400 pt-24 pb-12 px-4 mt-20 relative overflow-hidden font-sans">
        {/* Ambient pulse */}
        <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-white/[0.015] rounded-full blur-[160px] pointer-events-none"></div>

        <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10 text-zinc-300">
          <div className="space-y-6 md:col-span-1">
            <div className="flex items-center inline-flex mb-4">
              <img 
                src={siteConfig.logo} 
                alt="Bombay Motors" 
                className="h-10 w-auto object-contain mr-3 max-w-[150px]" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden flex-col items-start nv-logo-text">
                <h1 className="text-xl font-cinzel tracking-[0.18em] leading-none font-bold uppercase text-white">
                  BOMBAY MOTORS
                </h1>
                <p className="text-[8px] uppercase tracking-[0.5em] text-zinc-400 font-sans mt-1 font-bold">40+ YEARS IN MULUND • MUMBAI</p>
              </div>
            </div>
            <p className="text-sm tracking-wide leading-relaxed text-zinc-300 font-light font-sans">
              Exotic & Luxury Motorcars. Founded 40 years ago in Mulund, Bombay Motors delivers uncompromising certification, transparent transactions, and bespoke automotive excellence.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <a href="https://www.instagram.com/bombaymotorss/" target="_blank" rel="noreferrer" className="p-2.5 rounded-full frost-pill hover:bg-white hover:text-black transition-all text-white" title="Instagram @bombaymotorss">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://wa.me/917400113999" target="_blank" rel="noreferrer" className="p-2.5 rounded-full frost-pill hover:bg-white hover:text-black transition-all text-white" title="WhatsApp">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="tel:+917400113999" className="p-2.5 rounded-full frost-pill hover:bg-white hover:text-black transition-all text-white" title="Call Showroom">
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-white font-cinzel tracking-wider text-xs font-bold uppercase border-b border-white/10 pb-2">Quick Navigation</h3>
            <ul className="space-y-3.5 text-xs tracking-widest uppercase font-semibold font-sans text-zinc-300">
              <li><Link to="/inventory" className="hover:text-white transition-colors duration-300">Browse Collection</Link></li>
              <li><Link to="/sell" className="hover:text-white transition-colors duration-300">Sell Your Car</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors duration-300">About Bombay Motors</Link></li>
              <li><a href="https://www.instagram.com/bombaymotorss/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-300">Instagram @bombaymotorss ↗</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-white font-cinzel tracking-wider text-xs font-bold uppercase border-b border-white/10 pb-2">Showroom & Inquiries</h3>
            <ul className="space-y-4 text-sm tracking-wide text-zinc-200 font-normal font-sans">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 text-white mr-3 shrink-0 mt-1" />
                <a href="https://share.google/VGXKDMtikeDYt2Lcn" target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-300 leading-relaxed font-normal text-zinc-200 font-sans">
                  Shop No 10, Neel Empire, Sector 25, Nerul East, Navi Mumbai, Maharashtra 400706
                </a>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 text-white mr-3 shrink-0" />
                <a href="tel:+917400113999" className="hover:text-white transition-colors duration-300 font-sans font-bold text-white">+91 74001 13999</a>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 text-white mr-3 shrink-0" />
                <a href="mailto:contact@bombaymotors.in" className="hover:text-white transition-colors duration-300 font-sans font-medium text-zinc-200">contact@bombaymotors.in</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl mt-20 pt-8 border-t border-white/10 text-[10px] tracking-widest uppercase text-zinc-300 flex flex-col md:flex-row justify-between items-center font-sans font-semibold">
          <p 
            onClick={handleCopyrightClick}
            onTouchStart={handleCopyrightTouch}
            role="button"
            tabIndex={0}
            className="select-none text-zinc-300 cursor-pointer touch-manipulation hover:text-white outline-none active:text-white transition-colors"
          >
            &copy; 1986 - {new Date().getFullYear()} Bombay Motors. 40+ Years of Excellence in Mulund, Mumbai.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0 text-zinc-300 font-sans">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white flex items-center">Terms</a>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
