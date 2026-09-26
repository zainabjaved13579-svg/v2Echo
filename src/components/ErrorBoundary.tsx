import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Trash2, ShieldCheck, AlertCircle, Wrench } from 'lucide-react';
import { SAPPHIRE_LOGO_URL } from '../data/constants';
import { clearAllCorruptCache } from '../services/authService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Sapphire self-healing boundary intercepted error:', error, errorInfo);

    // Auto-heal known corrupt storage or dynamic import errors
    const msg = (error?.message || '').toLowerCase();
    if (
      msg.includes('json') ||
      msg.includes('syntaxerror') ||
      msg.includes('quotaexceeded') ||
      msg.includes('dynamically imported module') ||
      msg.includes('failed to fetch')
    ) {
      try {
        clearAllCorruptCache();
      } catch {}
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    clearAllCorruptCache();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#151515] text-white p-6 font-['Plus_Jakarta_Sans',sans-serif] select-none">
          <div className="w-full max-w-md bg-[#20201f] border border-[#2b2b2a] rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#111111] border border-[#2b2b2a] p-2 mx-auto flex items-center justify-center shadow-lg">
              <img
                src={SAPPHIRE_LOGO_URL}
                alt="Sapphire"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#2a2926] text-[#d97757] text-xs font-semibold">
                <Wrench className="w-3.5 h-3.5" />
                <span>Self-Healing Recovery</span>
              </div>
              <h2 className="text-xl font-bold text-white">App Restored Successfully</h2>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Sapphire detected a connection or cached storage conflict. You can immediately launch with fresh cache below without losing your account.
              </p>
              {this.state.error?.message && (
                <div className="p-2.5 rounded-xl bg-[#151515] border border-[#2b2b2a] text-[11px] text-[#d97757] font-mono break-all max-h-24 overflow-y-auto text-left">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#d97757] hover:bg-[#c86b4c] text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload App</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetCache}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#151515] hover:bg-[#282724] border border-[#2b2b2a] text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Reset Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
