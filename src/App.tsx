import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { VehicleProvider } from './context/VehicleContext';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

// Lazy loading pages for Code Splitting (Phase 7: Performance)
const Home = React.lazy(() => import('./pages/Home'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const VehicleDetails = React.lazy(() => import('./pages/VehicleDetails'));
const SellCar = React.lazy(() => import('./pages/SellCar'));
const About = React.lazy(() => import('./pages/About'));

const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminInventory = React.lazy(() => import('./pages/admin/Inventory'));
const AdminAddVehicle = React.lazy(() => import('./pages/admin/AddVehicle'));
const AdminLeads = React.lazy(() => import('./pages/admin/Leads'));
const AdminSettings = React.lazy(() => import('./pages/admin/Settings'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white font-mono tracking-widest text-xs uppercase relative overflow-hidden">
    {/* Soft gray glow */}
    <div className="absolute top-[20%] right-[10%] w-[35vw] h-[35vw] bg-white/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-40"></div>
    <div className="absolute top-[60%] left-[20%] w-[25vw] h-[25vw] bg-zinc-400/5 rounded-full blur-[90px] pointer-events-none mix-blend-screen opacity-30"></div>
    <div className="animate-pulse flex items-center mb-4 z-10 relative">
      <div className="w-1.5 h-6 bg-white animate-bounce mr-2"></div>
      <div className="w-1.5 h-6 bg-zinc-300 animate-bounce mr-2" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-1.5 h-6 bg-zinc-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
    <p className="z-10 font-bold">Initializing Environment...</p>
  </div>
);

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Immediate scroll state reset across all primary browser interfaces
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);

    // 2. Also reset any full-height container divisions (e.g. main/layout element nodes)
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    const flexColEl = document.querySelector('.flex-col');
    if (flexColEl) {
      flexColEl.scrollTop = 0;
    }

    // 3. Sequential post-render fallbacks to combat deferred layout-shifts and late asset paints
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' as any });
      document.documentElement.scrollTo({ top: 0, behavior: 'instant' as any });
      document.body.scrollTo({ top: 0, behavior: 'instant' as any });
    }, 120);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
          <VehicleProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<CustomerLayout />}>
                    <Route index element={<Home />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="inventory/:id" element={<VehicleDetails />} />
                    <Route path="sell" element={<SellCar />} />
                    <Route path="about" element={<About />} />
                  </Route>

                  <Route path="/dealer-management" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="inventory" element={<AdminInventory />} />
                    <Route path="inventory/add" element={<AdminAddVehicle />} />
                    <Route path="inventory/edit/:id" element={<AdminAddVehicle />} />
                    <Route path="leads" element={<AdminLeads />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </VehicleProvider>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}



