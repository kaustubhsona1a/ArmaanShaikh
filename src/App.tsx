import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { VehicleProvider } from './context/VehicleContext';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

// Direct Page Imports to prevent dynamic chunk loading MIME type errors
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import VehicleDetails from './pages/VehicleDetails';
import SellCar from './pages/SellCar';
import About from './pages/About';

import AdminDashboard from './pages/admin/Dashboard';
import AdminInventory from './pages/admin/Inventory';
import AdminAddVehicle from './pages/admin/AddVehicle';
import AdminLeads from './pages/admin/Leads';
import AdminSettings from './pages/admin/Settings';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);

    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    const flexColEl = document.querySelector('.flex-col');
    if (flexColEl) {
      flexColEl.scrollTop = 0;
    }

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
            </BrowserRouter>
          </VehicleProvider>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}



