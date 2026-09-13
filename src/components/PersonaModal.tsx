import React, { useState } from 'react';
import { X, Sparkles, Check, Info } from 'lucide-react';
import { PERSONAS } from '../data/personas';
import { PersonaPreset } from '../types';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPersonaId: string;
  customInstruction: string;
  onSave: (personaId: string, customInstruction: string) => void;
}

export const PersonaModal: React.FC<PersonaModalProps> = ({
  isOpen,
  onClose,
  selectedPersonaId,
  customInstruction,
  onSave
}) => {
  const [activeId, setActiveId] = useState(selectedPersonaId);
  const [customText, setCustomText] = useState(customInstruction || '');

  if (!isOpen) return null;

  const handleSelect = (p: PersonaPreset) => {
    setActiveId(p.id);
    if (!customText.trim() || customText === PERSONAS.find(x => x.id === activeId)?.systemInstruction) {
      setCustomText(p.systemInstruction);
    }
  };

  const handleApply = () => {
    onSave(activeId, customText.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Echo Persona & Instructions</h2>
              <p className="text-xs text-slate-500">Choose how Echo should respond, think, and format answers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Preset list */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Preset Modes
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PERSONAS.map((p) => {
                const isSelected = p.id === activeId;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    className={`text-left p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300 text-indigo-900'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold text-xs ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>{p.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Instruction Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                System Instructions
              </label>
              <button
                onClick={() => {
                  const preset = PERSONAS.find(p => p.id === activeId);
                  if (preset) setCustomText(preset.systemInstruction);
                }}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 underline font-medium"
              >
                Reset to preset default
              </button>
            </div>
            <textarea
              rows={4}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter custom instructions to guide Echo's tone, role, format or constraints..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Directs Echo on every message in this conversation.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-95"
          >
            Apply Persona
          </button>
        </div>
      </div>
    </div>
  );
};
