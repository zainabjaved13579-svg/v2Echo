import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SAPPHIRE_LOGO_URL } from '../data/constants';

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
    console.error('Sapphire caught an unhandled application error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      // Clear sessions that might have corrupted json
      localStorage.removeItem('echo_chat_sessions_v1');
      localStorage.removeItem('sapphire_chat_sessions_v2');
      localStorage.removeItem('echo_active_session_id');
      localStorage.removeItem('sapphire_guest_mode');
    } catch {}
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
              <h2 className="text-xl font-bold text-white">Application Notice</h2>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Sapphire detected a connection or storage conflict upon loading. You can immediately reload or reset cached state to restore full speed.
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
