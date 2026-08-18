import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-300 font-sans p-6 text-center shadow-inner relative overflow-hidden">
          <div className="absolute top-[20%] right-[10%] w-[35vw] h-[35vw] bg-white/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-40"></div>
          <AlertTriangle className="w-16 h-16 text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] z-10" />
          <h1 className="text-2xl font-serif text-white tracking-widest leading-none font-bold uppercase mb-2 z-10">
            Showroom Offline
          </h1>
          <p className="text-zinc-400 font-mono text-xs max-w-md mx-auto leading-relaxed mb-6 z-10">
            A temporary disruption occurred accessing our digital inventory. We are reconnecting to the secure servers.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center px-6 py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-bold uppercase tracking-widest text-xs rounded-xl drop-shadow-md transition-all z-10"
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Gallery
          </button>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
