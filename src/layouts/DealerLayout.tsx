import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, Car, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DealerLayout() {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/dealer-login');
    } catch(err) {
      console.error(err);
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-300 font-sans">
        <Car className="w-12 h-12 text-white mb-4" />
        <h1 className="text-xl font-sans text-white tracking-widest uppercase mb-4">Unauthorized Access</h1>
        <p className="text-zinc-500 mb-8 max-w-sm text-center">You must be logged in as an administrator to view this portal.</p>
        <Link to="/dealer-login" className="bg-white text-zinc-950 px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-zinc-200 transition-colors">
          Return to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-300 flex">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <Link to="/" className="flex flex-col items-start group">
            <span className="font-serif text-2xl tracking-wider text-white font-bold leading-none uppercase">BOMBAY MOTORS</span>
            <span className="font-sans text-[0.65rem] tracking-[0.35em] text-zinc-400 font-medium leading-tight uppercase font-mono">SHOWROOM</span>
          </Link>
          <div className="mt-4 text-[10px] tracking-widest uppercase text-zinc-500">Dealer Portal</div>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-2">
          <Link to="/dealer" className="flex items-center px-4 py-3 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors rounded-sm group">
            <LayoutDashboard className="w-4 h-4 mr-3 text-zinc-500 group-hover:text-white" />
            <span className="text-xs uppercase tracking-widest font-semibold">Dashboard</span>
          </Link>
          <Link to="/dealer/inventory" className="flex items-center px-4 py-3 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors rounded-sm group">
            <Car className="w-4 h-4 mr-3 text-zinc-500 group-hover:text-white" />
            <span className="text-xs uppercase tracking-widest font-semibold">Manage Inventory</span>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-zinc-800">
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors rounded-sm group">
            <LogOut className="w-4 h-4 mr-3 text-zinc-500 group-hover:text-white" />
            <span className="text-xs uppercase tracking-widest font-semibold">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-950 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
