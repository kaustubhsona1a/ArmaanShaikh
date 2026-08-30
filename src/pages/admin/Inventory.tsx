import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { formatPrice, Vehicle, BODY_TYPES } from '../../data/mockData';
import { Search, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useVehicles } from '../../context/VehicleContext';
import { SmartImage } from '../../components/SmartImage';

export default function AdminInventory() {
  const { vehicles, updateVehicle, removeVehicle } = useVehicles();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [bodyTypeFilter, setBodyTypeFilter] = useState('All Body Types');
  const [carToDelete, setCarToDelete] = useState<Vehicle | null>(null);
  
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = (v.make + ' ' + v.model + ' ' + (v.bodyType || '') + ' ' + (v.registration || '')).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || v.status === statusFilter;
    const matchesBodyType = bodyTypeFilter === 'All Body Types' || v.bodyType === bodyTypeFilter;
    return matchesSearch && matchesStatus && matchesBodyType;
  });

  const handleDeleteConfirm = () => {
    if (carToDelete) {
      removeVehicle(carToDelete.id);
      setCarToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-widest uppercase">Inventory Management</h1>
          <p className="text-zinc-400 text-xs mt-2 font-mono uppercase tracking-wider">Manage all vehicles in your premium dealership.</p>
        </div>
        <Link to="/dealer-management/inventory/add" className="inline-flex items-center px-6 py-3.5 bg-white hover:bg-zinc-900 text-zinc-950 hover:text-white border border-transparent hover:border-white/20 rounded-xl text-xs font-bold tracking-widest font-mono uppercase transition-all shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Vehicle
        </Link>
      </div>

      <div className="bg-zinc-950/65 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 bg-white/5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search vehicles by make, model, or registry code..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/30 border border-white/5 rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-white transition-all font-mono"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="bg-zinc-900/30 border border-white/5 text-zinc-300 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-white transition-all font-mono uppercase tracking-wider"
          >
            <option className="bg-zinc-950 text-white">All Statuses</option>
            <option className="bg-zinc-950 text-white">Available</option>
            <option className="bg-zinc-950 text-white">Sold</option>
            <option className="bg-zinc-950 text-white">Booked</option>
          </select>
          <select 
            value={bodyTypeFilter} 
            onChange={(e) => setBodyTypeFilter(e.target.value)} 
            className="bg-zinc-900/30 border border-white/5 text-zinc-300 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-white transition-all font-mono uppercase tracking-wider"
          >
            <option className="bg-zinc-950 text-white">All Body Types</option>
            {BODY_TYPES.map(bt => (
              <option key={bt} value={bt} className="bg-zinc-950 text-white">{bt}</option>
            ))}
          </select>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-white/5 text-white text-[10px] uppercase font-bold tracking-widest font-mono border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Reg. No</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-250 font-mono">
              {filteredVehicles.map(car => (
                <tr key={car.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-12 rounded-lg border border-white/5 overflow-hidden shrink-0">
                        <SmartImage 
                          src={car.images?.[0] || ""} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <p className="font-sans font-bold text-white text-sm">{car.make} {car.model}</p>
                        <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider">{car.year} • {car.bodyType ? `${car.bodyType} • ` : ''}{car.fuelType}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-300 font-bold">{car.registration}</td>
                  <td className="px-6 py-4 font-sans font-bold text-white text-sm">{formatPrice(car.price)}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={car.status}
                      onChange={(e) => updateVehicle(car.id, { status: e.target.value as any })}
                      className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider border outline-none cursor-pointer bg-zinc-950 focus:border-white transition-all ${
                        car.status === 'Available' ? 'border-white/20 text-white bg-white/10' :
                        car.status === 'Sold' ? 'border-zinc-700 text-zinc-400' :
                        'border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <option value="Available" className="bg-zinc-950 text-white">Available</option>
                      <option value="Booked" className="bg-zinc-950 text-zinc-300">Booked</option>
                      <option value="Sold" className="bg-zinc-950 text-zinc-400">Sold</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link to={`/dealer-management/inventory/edit/${car.id}`} className="p-2 text-zinc-400 hover:text-white bg-zinc-900/30 hover:bg-white/5 border border-white/5 hover:border-white/30 rounded-xl transition-all">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => setCarToDelete(car)} className="p-2 text-zinc-400 hover:text-red-400 bg-zinc-900/30 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded-xl transition-all" title="Delete Car">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Grid Layout - optimized for portrait & small devices */}
        <div className="block md:hidden divide-y divide-white/5">
          {filteredVehicles.map(car => (
            <div key={car.id} className="p-4 flex flex-col space-y-4">
              <div className="flex space-x-4 items-start">
                <div className="w-20 h-16 rounded-lg border border-white/5 overflow-hidden shrink-0">
                  <SmartImage 
                    src={car.images?.[0] || ""} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-sans font-extrabold text-white text-sm truncate">{car.make} {car.model}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-mono uppercase tracking-wider">{car.year} • {car.bodyType ? `${car.bodyType} • ` : ''}{car.fuelType}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-zinc-500">{car.registration || "N/A"}</span>
                    <span className="text-xs font-sans font-bold text-white">{formatPrice(car.price)}</span>
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons row */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/[0.03]">
                <div className="flex-1">
                  <select 
                    value={car.status}
                    onChange={(e) => updateVehicle(car.id, { status: e.target.value as any })}
                    className={`w-full py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border outline-none cursor-pointer bg-zinc-950 focus:border-white transition-all font-mono ${
                      car.status === 'Available' ? 'border-white/20 text-white bg-white/10' :
                      car.status === 'Sold' ? 'border-zinc-700 text-zinc-400' :
                      'border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <option value="Available" className="bg-zinc-950 text-white">Available</option>
                    <option value="Booked" className="bg-zinc-950 text-zinc-300">Booked</option>
                    <option value="Sold" className="bg-zinc-950 text-zinc-400">Sold</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <Link to={`/dealer-management/inventory/edit/${car.id}`} className="p-2 text-zinc-300 hover:text-white bg-zinc-900/40 hover:bg-white/5 border border-white/5 hover:border-white/25 rounded-xl transition-all" title="Edit Car">
                    <Edit className="w-4.5 h-4.5" />
                  </Link>
                  <button onClick={() => setCarToDelete(car)} className="p-2 text-zinc-300 hover:text-red-400 bg-zinc-900/40 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 rounded-xl transition-all" title="Delete Car">
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVehicles.length === 0 && (
          <div className="p-12 text-center text-zinc-500 font-mono text-xs uppercase tracking-wider">No luxury vehicles found matching criteria.</div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {carToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            onClick={() => setCarToDelete(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
          />
          
          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 mx-auto sm:mx-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="text-center sm:text-left space-y-2">
                <h3 className="text-lg font-serif font-bold text-white tracking-wider uppercase">Confirm Deletion</h3>
                <p className="text-sm text-zinc-300 font-sans leading-relaxed">
                  Do you surely want to delete the listing?
                </p>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 mt-3 text-xs text-zinc-400 text-left font-mono">
                  <p className="text-white font-bold font-sans text-sm">{carToDelete.year} {carToDelete.make} {carToDelete.model}</p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">{carToDelete.registration || 'Reg: N/A'} • {formatPrice(carToDelete.price)}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCarToDelete(null)}
                  className="flex-1 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-800/80 border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-bold tracking-widest font-mono uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold tracking-widest font-mono uppercase transition-colors shadow-lg shadow-red-900/30"
                >
                  Delete Listing
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
