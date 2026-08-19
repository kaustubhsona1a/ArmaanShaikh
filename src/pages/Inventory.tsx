import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../data/mockData';
import { Search, Filter, Car, Gauge, Fuel, Cog, Instagram } from 'lucide-react';
import { useVehicles } from '../context/VehicleContext';

export default function Inventory() {
  const { vehicles, loading } = useVehicles();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  const BUDGET_OPTIONS = [
    1000000,  // Below 10L
    1500000,  // Under 15L
    2000000,  // Under 20L
    2500000,  // Under 25L
    3000000,  // Under 30L
    3500000,  // Under 35L
    4000500,  // Under 40L
    4500000,  // Under 45L
    5000000,  // Under 50L
    100000000 // 50 Lakh+ / Any
  ];
  const [budgetIndex, setBudgetIndex] = useState(BUDGET_OPTIONS.length - 1);
  const [minYear, setMinYear] = useState<number | null>(null);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [maxMileage, setMaxMileage] = useState<number | null>(null);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
  
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const availableYears = useMemo(() => {
    const years = vehicles.map(v => typeof v.year === 'number' ? v.year : Number(v.year)).filter(y => Boolean(y) && !isNaN(y));
    if (years.length === 0) return { min: 2012, max: new Date().getFullYear() };
    return {
      min: Math.min(...years, 2015),
      max: Math.max(...years, new Date().getFullYear())
    };
  }, [vehicles]);

  const filteredCars = useMemo(() => {
    let result = vehicles.filter(car => car.status === 'Available');
    
    // Search filter
    if (searchTerm) {
      result = result.filter(car => 
        car.make.toLowerCase().includes(searchTerm.toLowerCase()) || 
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (car.variant && car.variant.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Budget filter
    if (budgetIndex < BUDGET_OPTIONS.length - 1) {
      const currentMaxBudget = BUDGET_OPTIONS[budgetIndex];
      result = result.filter(car => car.price <= currentMaxBudget);
    }

    // Min Year filter
    if (minYear !== null) {
      result = result.filter(car => Number(car.year) >= minYear);
    }

    // Owners filter
    if (selectedOwners.length > 0) {
      result = result.filter(car => {
        if (!car.ownership) return false;
        const carStr = car.ownership.toLowerCase().trim();
        return selectedOwners.some(sel => {
          const selStr = sel.toLowerCase().trim();
          const selShort = selStr.replace(' owner', '').trim();
          const carShort = carStr.replace(' owner', '').trim();
          return carStr === selStr || carShort === selShort || carStr.includes(selShort) || selStr.includes(carShort);
        });
      });
    }

    // Transmission filter
    if (selectedTransmissions.length > 0) {
      result = result.filter(car => selectedTransmissions.includes(car.transmission));
    }

    // Mileage filter
    if (maxMileage !== null) {
      result = result.filter(car => car.mileage <= maxMileage);
    }
    
    // Fuel type filter
    if (selectedFuelTypes.length > 0) {
      result = result.filter(car => selectedFuelTypes.includes(car.fuelType));
    }
    
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'mileage') {
      result.sort((a, b) => a.mileage - b.mileage);
    } else if (sortBy === 'year-newest') {
      result.sort((a, b) => Number(b.year) - Number(a.year));
    } else if (sortBy === 'year-oldest') {
      result.sort((a, b) => Number(a.year) - Number(b.year));
    }
    
    return result;
  }, [vehicles, searchTerm, sortBy, budgetIndex, minYear, selectedOwners, selectedTransmissions, maxMileage, selectedFuelTypes]);

  const toggleOwner = (owner: string) => {
    setSelectedOwners(prev => prev.includes(owner) ? prev.filter(o => o !== owner) : [...prev, owner]);
  };

  const toggleTransmission = (transmission: string) => {
    setSelectedTransmissions(prev => prev.includes(transmission) ? prev.filter(t => t !== transmission) : [...prev, transmission]);
  };

  const toggleFuel = (fuel: string) => {
    setSelectedFuelTypes(prev => prev.includes(fuel) ? prev.filter(f => f !== fuel) : [...prev, fuel]);
  };

  const resetFilters = () => {
    setBudgetIndex(BUDGET_OPTIONS.length - 1);
    setMinYear(null);
    setSelectedOwners([]);
    setSelectedTransmissions([]);
    setMaxMileage(null);
    setSelectedFuelTypes([]);
    setSearchTerm('');
    setSortBy('newest');
  };

  const ALL_TRANSMISSIONS = ['Automatic', 'Manual'];
  const ALL_FUELS = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG'];

  return (
    <div className="min-h-screen bg-transparent text-zinc-300 py-4 sm:py-8 font-sans z-10 relative">
      <div className="container mx-auto max-w-7xl px-3.5 sm:px-6">
        
        {/* Header - Pure Monochrome Black & White with Rich Frosted Elements */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 md:mb-8 gap-3 sm:gap-6 border-b border-white/10 pb-4 md:pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-cinzel font-bold tracking-wider sm:tracking-widest uppercase text-white">
              Showroom Collection
            </h1>
            <p className="text-zinc-300 mt-1.5 tracking-widest uppercase text-[11px] sm:text-xs font-sans">
              Explore <span className="text-white font-bold">{filteredCars.length}</span> Certified Motorcars in <span className="text-white font-semibold">Mulund, Mumbai</span>
            </p>
          </div>
          
          <div className="w-full md:w-auto font-sans text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
              <input 
                type="text" 
                placeholder="SEARCH BRAND OR MODEL..." 
                className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3.5 bg-black/50 border border-white/20 backdrop-blur-xl rounded-full text-[11px] sm:text-xs tracking-wider uppercase text-white placeholder:text-zinc-400 focus:outline-none focus:border-white focus:bg-black/70 transition-all shadow-sm font-sans"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-5 font-sans">
          <button 
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="flex items-center justify-between w-full p-3 sm:p-4 frost-pill rounded-xl text-white font-bold tracking-wider text-xs uppercase transition-colors shadow-sm"
          >
            <div className="flex items-center"><Filter className="w-3.5 h-3.5 mr-2.5 text-white" /> Filters & Sorting</div>
            <span className="text-[10px] text-zinc-300 lowercase">{isMobileFiltersOpen ? 'collapse' : 'expand'}</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Filters Sidebar - Rich Frosted Glass Card */}
          <div className={`w-full lg:w-72 flex-shrink-0 ${isMobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="p-5 sm:p-7 frost-card rounded-2xl shadow-xl sticky top-28 font-sans">
              <div className="flex items-center justify-between mb-6 sm:mb-8 pb-4 border-b border-white/10">
                <h3 className="tracking-widest text-white flex items-center uppercase text-xs font-bold font-sans">
                  <Filter className="w-4 h-4 mr-2.5 text-white" /> Refine Search
                </h3>
                <button 
                  onClick={resetFilters} 
                  className="text-[10px] tracking-widest uppercase text-zinc-300 hover:text-white transition-colors font-semibold font-sans"
                >
                  Reset
                </button>
              </div>
              
              <div className="space-y-7 text-zinc-200">
                {/* Sort By */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-zinc-200 mb-3 font-bold font-sans border-b border-white/10 pb-1.5 flex items-center justify-between">
                    <span>Sort By</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  </h4>
                  <div className="relative">
                    <select 
                      className="w-full bg-black/60 border border-white/20 text-xs tracking-wider text-white uppercase rounded-xl px-4 py-3 outline-none focus:border-white transition-colors block shadow-sm font-sans cursor-pointer"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest" className="bg-zinc-950 text-white">Newest Listings</option>
                      <option value="year-newest" className="bg-zinc-950 text-white">Year: Newest First</option>
                      <option value="year-oldest" className="bg-zinc-950 text-white">Year: Oldest First</option>
                      <option value="price-low" className="bg-zinc-950 text-white">Price: Low to High</option>
                      <option value="price-high" className="bg-zinc-950 text-white">Price: High to Low</option>
                      <option value="mileage" className="bg-zinc-950 text-white">Mileage: Low to High</option>
                    </select>
                  </div>
                </div>

                {/* Model Year */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[10px] uppercase tracking-wider text-zinc-200 font-bold font-sans">Model Year</h4>
                    <span className="text-[11px] text-white tracking-wider font-bold font-sans">
                      {minYear === null ? 'Any Year' : `${minYear}+`}
                    </span>
                  </div>

                  {/* Year Quick Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {[
                      { label: 'All', val: null },
                      { label: '2018+', val: 2018 },
                      { label: '2020+', val: 2020 },
                      { label: '2022+', val: 2022 },
                      { label: '2023+', val: 2023 },
                    ].map((chip) => {
                      const isActive = minYear === chip.val;
                      return (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => setMinYear(chip.val)}
                          className={`px-2.5 py-1 text-[10px] font-sans rounded-lg border transition-all ${
                            isActive
                              ? 'bg-white text-black border-white font-bold shadow-md'
                              : 'bg-black/40 text-zinc-300 border-white/15 hover:border-white/40 hover:text-white'
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Year Slider */}
                  <div className="px-2">
                    <input 
                      type="range" 
                      min={availableYears.min} 
                      max={availableYears.max} 
                      step="1"
                      value={minYear === null ? availableYears.min : minYear} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val <= availableYears.min) {
                          setMinYear(null);
                        } else {
                          setMinYear(val);
                        }
                      }}
                      className="w-full accent-white h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] font-sans text-zinc-400 mt-1">
                      <span>{availableYears.min}</span>
                      <span>{availableYears.max}</span>
                    </div>
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] uppercase tracking-wider text-zinc-200 font-bold font-sans">Max Budget</h4>
                    <span className="text-[11px] text-white tracking-wider font-bold font-sans">
                      {budgetIndex === 0
                        ? 'Below ₹ 10 Lakh'
                        : budgetIndex === BUDGET_OPTIONS.length - 1
                          ? '50 Lakh+'
                          : `Under ₹ ${(BUDGET_OPTIONS[budgetIndex] / 100000).toFixed(0)} Lakh`}
                    </span>
                  </div>
                  <div className="px-2">
                    <input 
                      type="range" 
                      min="0" 
                      max={BUDGET_OPTIONS.length - 1} 
                      step="1"
                      value={budgetIndex} 
                      onChange={(e) => setBudgetIndex(parseInt(e.target.value))}
                      className="w-full accent-white h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Owners */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-zinc-200 mb-4 font-bold font-sans border-b border-white/10 pb-1.5 flex items-center justify-between">
                    <span>Ownership</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  </h4>
                  <div className="space-y-3">
                    {['1st Owner', '2nd Owner', '3rd Owner'].map(owner => {
                      const isSelected = selectedOwners.includes(owner);
                      return (
                        <label key={owner} className="flex items-center space-x-3 cursor-pointer group">
                          <div className={`relative flex items-center justify-center w-4 h-4 rounded border transition-colors ${isSelected ? 'border-white bg-white' : 'border-white/30 group-hover:border-white bg-black/40'}`}>
                              <input 
                                type="checkbox" 
                                className="opacity-0 absolute inset-0 cursor-pointer" 
                                checked={isSelected}
                                onChange={() => toggleOwner(owner)}
                              />
                              {isSelected ? <div className="w-1.5 h-1.5 bg-black rounded-full"></div> : null}
                          </div>
                          <span className={`text-xs tracking-wide transition-colors ${isSelected ? 'text-white font-semibold' : 'text-zinc-300 group-hover:text-white'}`}>{owner}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Transmission */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-zinc-200 mb-4 font-bold font-sans border-b border-white/10 pb-1.5 flex items-center justify-between">
                    <span>Transmission</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  </h4>
                  <div className="space-y-3">
                    {ALL_TRANSMISSIONS.map(trans => {
                      const isSelected = selectedTransmissions.includes(trans);
                      return (
                        <label key={trans} className="flex items-center space-x-3 cursor-pointer group">
                          <div className={`relative flex items-center justify-center w-4 h-4 rounded border transition-colors ${isSelected ? 'border-white bg-white' : 'border-white/30 group-hover:border-white bg-black/40'}`}>
                              <input 
                                type="checkbox" 
                                className="opacity-0 absolute inset-0 cursor-pointer" 
                                checked={isSelected}
                                onChange={() => toggleTransmission(trans)}
                              />
                              {isSelected ? <div className="w-1.5 h-1.5 bg-black rounded-full"></div> : null}
                          </div>
                          <span className={`text-xs tracking-wide transition-colors ${isSelected ? 'text-white font-semibold' : 'text-zinc-300 group-hover:text-white'}`}>{trans}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Mileage slider */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] uppercase tracking-wider text-zinc-200 font-bold font-sans">Max Mileage</h4>
                    <span className="text-[11px] text-white tracking-wider font-semibold font-sans">
                      {maxMileage === null ? 'Any' : `${maxMileage.toLocaleString()} KM`}
                    </span>
                  </div>
                  <div className="px-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="300000" 
                      step="5000"
                      value={maxMileage === null ? 300000 : maxMileage} 
                      onChange={(e) => setMaxMileage(parseInt(e.target.value))}
                      className="w-full accent-white h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Fuel Types */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-zinc-200 mb-4 font-bold font-sans border-b border-white/10 pb-1.5 flex items-center justify-between">
                    <span>Fuel Type</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  </h4>
                  <div className="space-y-3">
                    {ALL_FUELS.map(fuel => {
                      const isSelected = selectedFuelTypes.includes(fuel);
                      return (
                        <label key={fuel} className="flex items-center space-x-3 cursor-pointer group">
                          <div className={`relative flex items-center justify-center w-4 h-4 rounded border transition-colors ${isSelected ? 'border-white bg-white' : 'border-white/30 group-hover:border-white bg-black/40'}`}>
                              <input 
                                type="checkbox" 
                                className="opacity-0 absolute inset-0 cursor-pointer" 
                                checked={isSelected}
                                onChange={() => toggleFuel(fuel)}
                              />
                              {isSelected ? <div className="w-1.5 h-1.5 bg-black rounded-full"></div> : null}
                          </div>
                          <span className={`text-xs tracking-wide transition-colors ${isSelected ? 'text-white font-semibold' : 'text-zinc-300 group-hover:text-white'}`}>{fuel}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Listing Grid - Rich Frosted Glass Cards */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {loading ? (
                [1, 2, 3, 4].map((num) => (
                  <div key={num} className="frost-card rounded-2xl p-4 sm:p-6 h-[400px] sm:h-[460px] animate-pulse flex flex-col justify-between">
                    <div className="w-full h-44 sm:h-56 bg-white/5 rounded-xl mb-4 sm:mb-6"></div>
                    <div className="space-y-3 flex-grow">
                      <div className="h-5 sm:h-6 w-2/3 bg-white/10 rounded-md"></div>
                      <div className="h-3.5 sm:h-4 w-1/3 bg-white/10 rounded-md"></div>
                      <div className="h-4 sm:h-5 w-1/2 bg-white/10 rounded-md mt-3"></div>
                    </div>
                    <div className="h-9 sm:h-10 w-full bg-white/10 rounded-full mt-4 sm:mt-6"></div>
                  </div>
                ))
              ) : filteredCars.length > 0 ? (
                filteredCars.map((car) => {
                  return (
                    <Link key={car.id} to={`/inventory/${car.id}`} className="group block h-full">
                      <div className="frost-card hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col h-full overflow-hidden rounded-2xl">
                        <div className="relative aspect-[16/10] sm:aspect-video md:aspect-auto md:h-64 overflow-hidden bg-black/60">
                          <img 
                            src={car.images?.[0] || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"} 
                            alt={`${car.make} ${car.model}`} 
                            loading="lazy" 
                            className="w-full h-full object-contain bg-black/40 transition-transform duration-500 ease-out group-hover:scale-[1.05]" 
                          />
                          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 frost-pill text-white px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-widest font-sans shadow-sm">
                            {car.year}
                          </div>
                          {car.instagramReel && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(car.instagramReel, '_blank', 'noopener,noreferrer');
                              }}
                              className="absolute top-3 right-3 sm:top-4 sm:right-4 frost-pill text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-widest font-sans shadow-lg hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 flex items-center gap-1 z-10"
                            >
                              <Instagram className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> REEL
                            </button>
                          )}
                        </div>
                        <div className="p-4 sm:p-6 md:p-8 flex-grow flex flex-col justify-between text-zinc-200">
                          <div>
                            <div className="mb-3 sm:mb-4 text-center">
                              <h3 className="text-base sm:text-lg md:text-xl font-cinzel font-bold text-white group-hover:text-zinc-200 transition-colors mb-1 sm:mb-2">
                                {car.make} <span className="font-normal text-zinc-300">{car.model}</span>
                              </h3>
                              <p className="text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-zinc-300 font-sans font-semibold">{car.variant}</p>
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-center text-white mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-white/10 font-cinzel tracking-wide">
                              {formatPrice(car.price)}
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex flex-wrap justify-center gap-x-3 sm:gap-x-5 gap-y-1.5 sm:gap-y-2 text-[11px] sm:text-xs md:text-sm font-semibold text-zinc-200 mb-4 sm:mb-6 font-sans">
                              <div className="flex items-center"><Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-zinc-300" /> {car.mileage.toLocaleString()} KM</div>
                              <div className="flex items-center"><Fuel className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-zinc-300" /> {car.fuelType}</div>
                              <div className="flex items-center"><Cog className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-zinc-300" /> {car.transmission}</div>
                            </div>
                            
                            <div className="w-full uppercase tracking-widest text-black text-[11px] sm:text-xs font-bold text-center py-2.5 sm:py-3.5 bg-white hover:bg-zinc-100 group-hover:shadow-[0_4px_25px_rgba(255,255,255,0.2)] transition-all duration-300 rounded-full font-sans">
                              Explore Specs & Details ↗
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="col-span-full frost-card rounded-2xl py-12 sm:py-16 px-4 sm:px-6 text-center font-sans uppercase text-xs tracking-widest text-zinc-300">
                  No matching vehicles found in active showroom inventory.
                </div>
              )}
            </div>
            
            {filteredCars.length > 0 && (
              <div className="mt-16 flex justify-center border-t border-white/10 pt-12">
                 <div className="flex items-center space-x-4">
                     <button className="px-5 py-2.5 frost-pill rounded-full text-zinc-300 text-xs tracking-wider uppercase hover:border-white hover:text-white disabled:opacity-35 transition-colors font-bold font-sans" disabled>Previous</button>
                     <span className="text-white text-xs tracking-widest font-sans font-bold">1 / 1</span>
                     <button className="px-5 py-2.5 frost-pill rounded-full text-zinc-300 text-xs tracking-wider uppercase hover:border-white hover:text-white disabled:opacity-35 transition-colors font-bold font-sans" disabled>Next</button>
                 </div>
              </div>
            )}
            
            {filteredCars.length === 0 && (
              <div className="text-center py-24 frost-card rounded-2xl flex flex-col items-center shadow-sm">
                <div className="w-16 h-16 frost-pill rounded-2xl flex items-center justify-center mb-4">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-cinzel font-bold text-white mb-1">No Motorcars Found</h3>
                <p className="text-zinc-300 uppercase tracking-widest text-[10px] font-sans font-bold">Please refine your filter limits</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
