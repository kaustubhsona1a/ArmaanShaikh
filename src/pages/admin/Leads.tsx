import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useVehicles } from '../../context/VehicleContext';
import { Trash2 } from 'lucide-react';
import { SmartImage } from '../../components/SmartImage';

export default function AdminLeads() {
  const { leads, updateLeadStatus, deleteLead } = useVehicles();
  const [leadToDelete, setLeadToDelete] = useState<any | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-white tracking-widest uppercase">Lead Management</h1>
        <p className="text-zinc-400 text-xs mt-2 font-mono uppercase tracking-wider font-semibold">Track and manage customer inquiries.</p>
      </div>

      <div className="bg-zinc-950/65 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg overflow-hidden">
        {leads.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 font-mono text-xs uppercase tracking-wider">No customer leads found active.</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-white/5 text-white text-[10px] uppercase font-bold tracking-widest font-mono border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Lead Info</th>
                    <th className="px-6 py-4">Vehicle Details</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-250">
                  {leads.map(lead => (
                    <tr key={lead.id} className="hover:bg-white/5 transition-colors font-mono">
                      <td className="px-6 py-4">
                        <p className="font-sans font-bold text-white text-sm">{lead.name}</p>
                        <p className="text-[10px] text-zinc-400 mt-1">{lead.phone} {lead.email && `• ${lead.email}`}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-zinc-300 font-bold whitespace-pre-line">{lead.car}</div>
                        {lead.images && lead.images.length > 0 && (
                          <div className="flex gap-2 mt-2.5 pt-2 border-t border-white/5 flex-wrap">
                            {lead.images.map((img, idx) => (
                              <button 
                                key={idx} 
                                type="button"
                                onClick={() => setActiveImage(img)}
                                className="block h-12 w-12 rounded-lg overflow-hidden border border-white/10 hover:border-white transition-colors bg-zinc-900 group"
                              >
                                <SmartImage src={img} alt={`Attached doc ${idx + 1}`} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider border outline-none cursor-pointer bg-zinc-950 focus:border-white transition-all ${
                            lead.status === 'New Lead' ? 'border-white/20 text-white bg-white/10' :
                            lead.status === 'Contacted' ? 'border-zinc-700 text-zinc-400' :
                            lead.status === 'Negotiating' ? 'border-zinc-700 text-zinc-300 bg-zinc-900/40' :
                            'border-zinc-800 text-zinc-500'
                          }`}
                        >
                          <option value="New Lead" className="bg-zinc-950 text-white">New Lead</option>
                          <option value="Contacted" className="bg-zinc-950 text-zinc-400">Contacted</option>
                          <option value="Interested" className="bg-zinc-950 text-emerald-400">Interested</option>
                          <option value="Negotiating" className="bg-zinc-950 text-purple-400">Negotiating</option>
                          <option value="Closed/Won" className="bg-zinc-950 text-emerald-500">Closed/Won</option>
                          <option value="Closed/Lost" className="bg-zinc-950 text-red-400">Closed/Lost</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{lead.date}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <a href={`tel:${lead.phone}`} className="text-[10px] text-white hover:text-zinc-300 font-semibold font-mono uppercase tracking-wider transition-colors border border-white/20 hover:border-white px-2 py-1 rounded">Call</a>
                        <button 
                          onClick={() => setLeadToDelete(lead)}
                          className="text-red-500 hover:text-red-400 font-semibold font-mono uppercase tracking-wider transition-colors inline-block align-middle"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="block md:hidden divide-y divide-white/5 font-mono text-xs">
              {leads.map(lead => (
                <div key={lead.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-sans font-extrabold text-white text-base">{lead.name}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">{lead.phone}</p>
                      {lead.email && <p className="text-[10px] text-zinc-500 mt-0.5 lowercase">{lead.email}</p>}
                    </div>
                    <span className="text-[10px] text-zinc-500 shrink-0">{lead.date}</span>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-400 block mb-0.5">Vehicle Interest</span>
                    <span className="text-white font-bold whitespace-pre-line">{lead.car}</span>
                    {lead.images && lead.images.length > 0 && (
                      <div className="flex gap-2 mt-2 pt-2 border-t border-white/5 flex-wrap">
                        {lead.images.map((img, idx) => (
                          <button 
                            key={idx} 
                            type="button"
                            onClick={() => setActiveImage(img)}
                            className="block h-10 w-10 rounded-lg overflow-hidden border border-white/10 bg-zinc-900 shrink-0"
                          >
                            <SmartImage src={img} alt={`Attached doc ${idx + 1}`} className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions & Status Dropdown Row */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <div className="flex-1 min-w-0">
                      <select 
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                        className={`w-full py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border outline-none cursor-pointer bg-zinc-950 focus:border-white transition-all font-mono ${
                          lead.status === 'New Lead' ? 'border-white/20 text-white bg-white/10' :
                          lead.status === 'Contacted' ? 'border-zinc-700 text-zinc-400' :
                          lead.status === 'Negotiating' ? 'border-zinc-700 text-zinc-300' :
                          'border-zinc-800 text-zinc-500'
                        }`}
                      >
                        <option value="New Lead" className="bg-zinc-950 text-white">New Lead</option>
                        <option value="Contacted" className="bg-zinc-950 text-zinc-400">Contacted</option>
                        <option value="Interested" className="bg-zinc-950 text-emerald-400">Interested</option>
                        <option value="Negotiating" className="bg-zinc-950 text-purple-400">Negotiating</option>
                        <option value="Closed/Won" className="bg-zinc-950 text-emerald-500">Closed/Won</option>
                        <option value="Closed/Lost" className="bg-zinc-950 text-red-400">Closed/Lost</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <a 
                        href={`tel:${lead.phone}`} 
                        className="px-3.5 py-2 bg-white/10 hover:bg-white border border-white/20 text-white hover:text-zinc-950 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all"
                      >
                        Call
                      </a>
                      <button 
                        onClick={() => setLeadToDelete(lead)}
                        className="p-2 text-zinc-400 hover:text-red-400 bg-zinc-900/40 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 rounded-lg transition-all"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {/* Premium Custom Confirmation Modal */}
      {leadToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => setLeadToDelete(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
          />
          
          {/* Modal Container */}
          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 mx-auto sm:mx-0">
                <Trash2 className="w-5 h-5" />
              </div>
              
              <div className="text-center sm:text-left space-y-2">
                <h3 className="text-lg font-serif font-bold text-white tracking-wider uppercase">Remove Customer Lead</h3>
                <p className="text-xs text-zinc-400 font-mono uppercase tracking-wider leading-relaxed">
                  Are you absolutely sure you want to permanently delete the lead for <span className="text-white font-bold font-sans normal-case">{leadToDelete.name}</span>?
                </p>
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-xs text-zinc-400 text-left font-mono">
                  <span className="text-[9px] uppercase tracking-wider text-white block mb-1">Lead Interest</span>
                  <p className="text-zinc-300 font-bold leading-relaxed truncate">{leadToDelete.car}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLeadToDelete(null)}
                  className="flex-1 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-800/80 border border-white/5 text-zinc-300 hover:text-white rounded-xl text-xs font-bold tracking-widest font-mono uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteLead(leadToDelete.id);
                    setLeadToDelete(null);
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold tracking-widest font-mono uppercase transition-all shadow-lg shadow-red-900/10"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Premium custom attachment Lightbox Modal */}
      {activeImage && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => setActiveImage(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity" 
          />
          
          {/* Modal Container */}
          <div className="bg-zinc-950 border border-white/10 rounded-2xl relative z-10 shadow-2xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Meta */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-white/5 bg-zinc-900/40">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Attachment Document Preview</span>
              <button 
                onClick={() => setActiveImage(null)}
                className="text-zinc-400 hover:text-white font-mono text-[9px] uppercase tracking-widest font-bold border border-white/10 hover:border-white/20 py-1.5 px-3 bg-zinc-950 rounded-lg transition-all"
              >
                Close ESC
              </button>
            </div>
            
            {/* Expanded Image Area */}
            <div className="p-4 flex items-center justify-center bg-zinc-950 min-h-[300px] max-h-[70vh] overflow-auto">
              <SmartImage 
                src={activeImage} 
                alt="Expanded Attachment" 
                className="max-w-full max-h-[60vh] object-contain rounded-xl select-none shadow-lg border border-white/5"
              />
            </div>

            {/* Downloader Footer bar */}
            <div className="px-6 py-4 border-t border-white/5 bg-zinc-900/20 text-center flex justify-between items-center">
              <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">Encrypted transmission</span>
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = activeImage;
                  link.download = `lead_attachment_${Date.now()}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="text-[10px] text-white hover:text-zinc-300 font-mono uppercase tracking-widest font-bold transition-all border border-white/20 hover:border-white py-1.5 px-3 rounded-lg"
              >
                Download File ↗
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
