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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none sm:select-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-xl bg-[#201f1d] border border-[#33312e] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#ede8e1]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#2a2926] bg-[#191817] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#282724] border border-[#383633] text-[#d97757] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#f5f2eb]">Sapphire Persona & Instructions</h2>
              <p className="text-xs text-[#86837c]">Choose how Sapphire should respond, format, and reason</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#86837c] hover:text-[#ede8e1] rounded-xl hover:bg-[#282724] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {/* Preset list */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#86837c]">
              Preset Modes
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PERSONAS.map((p) => {
                const isSelected = p.id === activeId;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#282724] border-[#d97757] ring-1 ring-[#d97757]/40 text-[#ede8e1]'
                        : 'bg-[#191817] border-[#2a2926] hover:border-[#383633] hover:bg-[#201f1d] text-[#a19e97]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold text-xs ${isSelected ? 'text-[#f5f2eb]' : 'text-[#ede8e1]'}`}>{p.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#d97757]" />}
                    </div>
                    <p className="text-[11px] text-[#86837c] line-clamp-2 leading-relaxed">
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
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#86837c]">
                System Instructions
              </label>
              <button
                onClick={() => {
                  const preset = PERSONAS.find(p => p.id === activeId);
                  if (preset) setCustomText(preset.systemInstruction);
                }}
                className="text-[11px] text-[#d97757] hover:underline font-medium cursor-pointer"
              >
                Reset to preset default
              </button>
            </div>
            <textarea
              rows={4}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter custom instructions to guide Sapphire's tone, role, format or constraints..."
              className="w-full bg-[#191817] border border-[#33312e] rounded-2xl p-3.5 text-xs text-[#ede8e1] placeholder-[#86837c] focus:outline-none focus:border-[#d97757] leading-relaxed resize-none"
            />
            <p className="text-[11px] text-[#86837c] flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#86837c]" />
              Directs Sapphire on every message in this conversation.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#2a2926] bg-[#191817] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#86837c] hover:text-[#ede8e1] hover:bg-[#282724] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#d97757] hover:bg-[#c86b4c] text-white shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Apply Persona
          </button>
        </div>
      </div>
    </div>
  );
};
export default PersonaModal;
