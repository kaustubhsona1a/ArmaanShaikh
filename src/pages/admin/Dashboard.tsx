import { Car, TrendingUp, Plus, List, Settings, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useVehicles } from '../../context/VehicleContext';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { vehicles, leads, migrateLocalStorage } = useVehicles();

  const activeCars = vehicles.filter(v => v.status === 'Available').length;
  const soldCars = vehicles.filter(v => v.status === 'Sold').length;
  const totalCars = vehicles.length;

  return (
    <div className="space-y-10 animate-fadeIn max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wider uppercase">
          DEALER DASHBOARD
        </h1>
        <p className="text-zinc-400 text-xs mt-1.5 font-mono uppercase tracking-wider">
          Direct management options for vehicle listings and studio site settings.
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Upload Car */}
          <Link
            to="/dealer-management/inventory/add"
            className="group bg-zinc-900/60 hover:bg-zinc-900/90 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between h-full shadow-lg"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:bg-white group-hover:text-zinc-950 transition-colors">
                <Plus className="w-5 h-5 text-white group-hover:text-zinc-950 transition-colors" />
              </div>
              <h3 className="font-serif font-bold text-white text-base tracking-widest uppercase mb-1">
                UPLOAD CAR
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                Add a new vehicle with specs, pricing, and high-res photos.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">
              <span>ADD VEHICLE</span>
              <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* View Inventory */}
          <Link
            to="/dealer-management/inventory"
            className="group bg-zinc-900/60 hover:bg-zinc-900/90 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between h-full shadow-lg"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:bg-white group-hover:text-zinc-950 transition-colors">
                <List className="w-5 h-5 text-white group-hover:text-zinc-950 transition-colors" />
              </div>
              <h3 className="font-serif font-bold text-white text-base tracking-widest uppercase mb-1">
                VIEW INVENTORY
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                Browse, edit details, update status, or remove current vehicles.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">
              <span>MANAGE LIST</span>
              <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Site Settings */}
          <Link
            to="/dealer-management/settings"
            className="group bg-zinc-900/60 hover:bg-zinc-900/90 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between h-full shadow-lg"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:bg-white group-hover:text-zinc-950 transition-colors">
                <Settings className="w-5 h-5 text-white group-hover:text-zinc-950 transition-colors" />
              </div>
              <h3 className="font-serif font-bold text-white text-base tracking-widest uppercase mb-1">
                SITE SETTINGS
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                Upload cover photos, service photos, accessory photos, & logo.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">
              <span>EDIT SETTINGS</span>
              <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Inventory Summary */}
      <div>
        <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Inventory Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-zinc-900/40 backdrop-blur-md p-5 rounded-xl border border-white/5 flex items-center shadow-md">
            <div className="bg-white/5 w-11 h-11 rounded-lg flex items-center justify-center mr-4 border border-white/10 shrink-0">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[9px] text-zinc-400 font-mono uppercase tracking-widest font-bold">Active Vehicles</p>
              <p className="text-2xl font-serif font-bold text-white mt-0.5">{activeCars}</p>
            </div>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-md p-5 rounded-xl border border-white/5 flex items-center shadow-md">
            <div className="bg-white/5 w-11 h-11 rounded-lg flex items-center justify-center mr-4 border border-white/10 shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[9px] text-zinc-400 font-mono uppercase tracking-widest font-bold">Cars Sold</p>
              <p className="text-2xl font-serif font-bold text-white mt-0.5">{soldCars}</p>
            </div>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-md p-5 rounded-xl border border-white/5 flex items-center shadow-md">
            <div className="bg-white/5 w-11 h-11 rounded-lg flex items-center justify-center mr-4 border border-white/10 shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[9px] text-zinc-400 font-mono uppercase tracking-widest font-bold">Total Catalog</p>
              <p className="text-2xl font-serif font-bold text-white mt-0.5">{totalCars}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="font-serif font-bold text-white text-base tracking-widest uppercase">Recent Leads</h2>
            <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider mt-0.5">Latest customer inquiries and test drive requests</p>
          </div>
          <Link to="/dealer-management/leads" className="text-[11px] text-white hover:text-zinc-300 font-semibold font-mono uppercase tracking-wider flex items-center transition-colors">
            View All ({leads.length}) <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="p-0">
          {leads.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 font-mono text-xs uppercase tracking-wider">
              No recent leads recorded yet.
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white/5 text-white text-[10px] uppercase font-bold tracking-widest font-mono border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Phone / Email</th>
                      <th className="px-6 py-4">Vehicle Interest</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {leads.slice(0, 4).map(lead => (
                      <tr key={lead.id} className="hover:bg-white/5 transition-colors font-mono">
                        <td className="px-6 py-4 font-sans font-bold text-white">{lead.name}</td>
                        <td className="px-6 py-4 text-zinc-400">{lead.phone || lead.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-zinc-200">{lead.car}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider border ${
                            lead.status === 'New Lead' ? 'bg-white/10 text-white border-white/20' :
                            lead.status === 'Contacted' ? 'bg-zinc-800 text-zinc-300 border-zinc-700' :
                            'bg-zinc-950 text-zinc-500 border-zinc-900'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">{lead.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="block md:hidden divide-y divide-white/5 font-mono text-xs">
                {leads.slice(0, 4).map(lead => (
                  <div key={lead.id} className="p-4 flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-extrabold text-white text-sm">{lead.name}</span>
                      <span className="text-[9px] text-zinc-500">{lead.date}</span>
                    </div>
                    <div className="text-zinc-300 text-[10px] uppercase tracking-wide truncate">
                      🚘 {lead.car}
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${
                        lead.status === 'New Lead' ? 'bg-white/10 text-white border-white/20' :
                        lead.status === 'Contacted' ? 'bg-zinc-800 text-zinc-300 border-zinc-700' :
                        'bg-zinc-900 text-zinc-500 border-zinc-900'
                      }`}>
                        {lead.status}
                      </span>
                      {lead.phone && <span className="text-[9px] text-zinc-400">{lead.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Auxiliary Utilities */}
      <div className="pt-4 border-t border-white/5 flex justify-end">
        <button 
          onClick={async () => {
            const updated = await migrateLocalStorage();
            if (updated) {
              alert('Successfully recovered your local vehicle data!');
            } else {
              alert('No local data to migrate or already synced.');
            }
          }}
          className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors"
        >
          Sync / Recover Local Storage
        </button>
      </div>
    </div>
  );
}


