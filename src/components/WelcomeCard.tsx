import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Code2, Folder, Key } from 'lucide-react';
import { SAPPHIRE_APP_NAME, SAPPHIRE_LOGO_URL } from '../data/constants';

interface WelcomeCardProps {
  userName: string;
  onOpenCodex: () => void;
  onOpenWorkspace: () => void;
  onOpenSettings: () => void;
  onDismiss: () => void;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({
  userName,
  onOpenCodex,
  onOpenWorkspace,
  onOpenSettings,
  onDismiss
}) => {
  return (
    <div className="mx-auto max-w-2xl my-4 p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md relative overflow-hidden select-none animate-fadeIn">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-black border border-slate-800 p-2 shadow-md flex items-center justify-center">
            <img
              src={SAPPHIRE_LOGO_URL}
              alt={SAPPHIRE_APP_NAME}
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Welcome to {SAPPHIRE_APP_NAME}, {userName || 'Architect'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Your next-generation pitch-black AI workspace with Google AI Studio App Builder.
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors p-1"
          title="Dismiss card"
        >
          ✕
        </button>
      </div>

      {/* Feature Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5 relative z-10">
        <button
          onClick={onOpenCodex}
          className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 transition-all text-left cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
            <Code2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">Codex Engine</p>
            <p className="text-[10px] text-slate-500 truncate">Google AI Studio App Builder</p>
          </div>
        </button>

        <button
          onClick={onOpenWorkspace}
          className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 transition-all text-left cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
            <Folder className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">Workspace</p>
            <p className="text-[10px] text-slate-500 truncate">File & Folder Management</p>
          </div>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 transition-all text-left cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Key className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">AI Studio Key</p>
            <p className="text-[10px] text-slate-500 truncate">Setup Credentials</p>
          </div>
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          Zero auto-speech enabled • Typewriter streaming active
        </span>
        <button
          onClick={onDismiss}
          className="font-medium text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
        >
          <span>Start Chatting</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
