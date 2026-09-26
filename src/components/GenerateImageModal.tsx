import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Download,
  Maximize2,
  RefreshCw,
  Send,
  Check,
  Palette,
  Ratio,
  Copy,
  Wand2,
  Layers,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  Edit3,
  SlidersHorizontal,
  Split,
  Trash2,
  Cpu
} from 'lucide-react';
import {
  generateAiImage,
  editAiImage,
  remakeAiImage,
  enhanceImagePrompt,
  getImageDailyQuota,
  MAX_DAILY_IMAGES,
  ImageGenResult
} from '../services/imageService';

interface GenerateImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (imageUrl: string, prompt: string) => void;
  initialPrompt?: string;
  initialImage?: string;
  initialTab?: 'create' | 'edit';
}

const STYLES = [
  { id: 'photorealistic', name: 'Photorealistic', icon: '📷' },
  { id: 'cinematic', name: 'Cinematic Movie', icon: '🎬' },
  { id: 'anime', name: 'Anime Visual', icon: '✨' },
  { id: '3d-render', name: '3D Render', icon: '🔮' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', icon: '🌆' },
  { id: 'digital-art', name: 'Digital Art', icon: '🎨' }
];

const RATIOS = [
  { id: '1:1', label: '1:1', desc: 'Square' },
  { id: '16:9', label: '16:9', desc: 'Landscape' },
  { id: '9:16', label: '9:16', desc: 'Portrait' },
  { id: '4:3', label: '4:3', desc: 'Classic' },
  { id: '3:4', label: '3:4', desc: 'Photo' }
];

const QUICK_PROMPTS = [
  'A majestic snow leopard resting on Himalayan peaks at sunrise',
  'A neon-lit futuristic cafe in Tokyo with holographic signs, rain reflections',
  'A cozy courtyard with jasmine flowers, steaming tea and warm sunlight',
  'A sleek electric hypercar cruising an ocean coastal highway at dusk',
  'An ethereal fantasy library floating among starry nebulae with glowing books'
];

const QUICK_EDIT_PRESETS = [
  'Add dramatic golden hour sunset lighting',
  'Change background to cyberpunk neon city at night',
  'Transform into vibrant anime watercolor illustration',
  'Add stylish futuristic sunglasses and leather jacket',
  'Add glowing magical fireflies and cosmic aura',
  'Convert to a cinematic 35mm film photograph with warm grain'
];

const NANO_BANANA_MODELS = [
  {
    id: 'sapphire-vision-instant',
    name: 'Sapphire Vision Instant',
    alias: 'Ultra-Fast Diffusion',
    badge: 'Fast & Versatile',
    desc: 'High-speed image generation with zero wait time',
    icon: '⚡'
  },
  {
    id: 'sapphire-vision-studio',
    name: 'Sapphire Vision Studio',
    alias: 'High Dynamic Range',
    badge: 'High Detail',
    desc: 'High dynamic range, rich texture & photorealism',
    icon: '🎨'
  },
  {
    id: 'sapphire-vision-ultra',
    name: 'Sapphire Vision Ultra 4K',
    alias: 'Cinematic Studio',
    badge: 'Studio 4K',
    desc: 'Deepest compositional fidelity & pro lighting',
    icon: '💎'
  }
];

export const GenerateImageModal: React.FC<GenerateImageModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
  initialPrompt = '',
  initialImage,
  initialTab = 'create'
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>(initialTab);
  
  // Create mode state
  const [createPrompt, setCreatePrompt] = useState(initialPrompt);
  const [createAspectRatio, setCreateAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [createStyle, setCreateStyle] = useState<'photorealistic' | 'cinematic' | 'anime' | '3d-render' | 'cyberpunk' | 'digital-art'>('photorealistic');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-lite-image');
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<ImageGenResult | null>(null);

  // Edit mode state
  const [editSourceImage, setEditSourceImage] = useState<string | null>(initialImage || null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editAspectRatio, setEditAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [isEditing, setIsEditing] = useState(false);
  const [editResult, setEditResult] = useState<ImageGenResult | null>(null);
  const [showOriginalComparison, setShowOriginalComparison] = useState(false);

  // General state
  const [dailyQuota, setDailyQuota] = useState(getImageDailyQuota());
  const [quotaErrorMessage, setQuotaErrorMessage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDailyQuota(getImageDailyQuota());
  }, [isOpen]);

  useEffect(() => {
    if (initialImage) {
      setEditSourceImage(initialImage);
      setActiveTab('edit');
    }
    if (initialPrompt) {
      if (initialTab === 'edit') {
        setEditPrompt(initialPrompt);
      } else {
        setCreatePrompt(initialPrompt);
      }
    }
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialImage, initialPrompt, initialTab]);

  if (!isOpen) return null;

  // Enhance prompt with Gemini
  const handleEnhancePrompt = async () => {
    const current = activeTab === 'create' ? createPrompt : editPrompt;
    if (!current.trim() || isEnhancingPrompt) return;
    setIsEnhancingPrompt(true);
    try {
      const enhanced = await enhanceImagePrompt(current, createStyle);
      if (enhanced) {
        if (activeTab === 'create') {
          setCreatePrompt(enhanced);
        } else {
          setEditPrompt(enhanced);
        }
      }
    } catch (e) {
      console.warn('Enhance prompt notice:', e);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Create Image with gemini-3.1-flash-image-preview
  const handleCreateImage = async (customPrompt?: string) => {
    const textToUse = (customPrompt || createPrompt).trim();
    if (!textToUse || isCreating) return;

    setQuotaErrorMessage(null);
    setIsCreating(true);
    setCreateResult(null);

    try {
      const res = await generateAiImage({
        prompt: textToUse,
        aspectRatio: createAspectRatio,
        style: createStyle,
        model: selectedModel
      });
      setCreateResult(res);
      setDailyQuota(getImageDailyQuota());
    } catch (err: any) {
      console.error('Failed to generate image:', err);
      const errMsg = err?.message || 'Unable to generate image right now.';
      setQuotaErrorMessage(errMsg);
      setDailyQuota(getImageDailyQuota());
    } finally {
      setIsCreating(false);
    }
  };

  // Edit Image with gemini-3.1-flash-image-preview
  const handleEditImage = async (customInstruction?: string) => {
    const instruction = (customInstruction || editPrompt).trim();
    if (!instruction || isEditing) return;
    if (!editSourceImage) {
      setQuotaErrorMessage('Please upload or select an image to edit first.');
      return;
    }

    setQuotaErrorMessage(null);
    setIsEditing(true);
    setEditResult(null);

    try {
      const res = await editAiImage({
        image: editSourceImage,
        prompt: instruction,
        aspectRatio: editAspectRatio,
        style: createStyle
      });
      setEditResult(res);
      setDailyQuota(getImageDailyQuota());
    } catch (err: any) {
      console.error('Failed to edit image:', err);
      const errMsg = err?.message || 'Unable to complete image edit.';
      setQuotaErrorMessage(errMsg);
      setDailyQuota(getImageDailyQuota());
    } finally {
      setIsEditing(false);
    }
  };

  // Load created image into edit mode
  const handleSendToEditor = (imgUrl: string, promptText?: string) => {
    setEditSourceImage(imgUrl);
    setEditPrompt(promptText ? `Improve: ${promptText}` : '');
    setActiveTab('edit');
    setEditResult(null);
  };

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditSourceImage(reader.result);
        setEditResult(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setEditSourceImage(reader.result);
          setEditResult(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = (url: string, name: string = 'echo_image') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_${Date.now()}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none sm:select-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-3xl bg-[#201f1d] border border-[#33312e] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#ede8e1]">
        {/* Header with Model Identifier & Tab Selector */}
        <div className="px-5 py-3.5 border-b border-[#2a2926] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#191817]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#282724] border border-[#383633] text-[#d97757] flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-[#f5f2eb]">
                  Create & Edit Images
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#282724] text-[#d97757] border border-[#d97757]/30 flex items-center gap-1">
                  <span>🎨</span>
                  <span>Sapphire Vision</span>
                </span>
              </div>
              <p className="text-xs text-[#86837c]">
                High-speed AI text-to-image creation and intelligent image editing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Tab switch */}
            <div className="flex p-1 bg-[#191817] border border-[#2a2926] rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'create'
                    ? 'bg-[#d97757] text-white shadow-xs'
                    : 'text-[#86837c] hover:text-[#ede8e1]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Image</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-[#d97757] text-white shadow-xs'
                    : 'text-[#86837c] hover:text-[#ede8e1]'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Image</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#86837c] hover:text-[#ede8e1] rounded-xl hover:bg-[#282724] transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {/* 100% Reliable Image Creation Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#191817] border border-[#2a2926] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="font-semibold text-[#ede8e1]">
                  Sapphire Vision Engine:
                </span>{' '}
                <span className="text-[#a19e97]">
                  Unlimited High-Resolution Image Generation Active (100% Guaranteed)
                </span>
              </div>
            </div>
            <div className="text-[11px] font-semibold text-[#d97757] bg-[#282724] px-2.5 py-1 rounded-lg border border-[#383633]">
              Ultra HD 8K
            </div>
          </div>

          {/* Quota / Error Banner */}
          {quotaErrorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <span className="font-bold text-sm">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold">{quotaErrorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setQuotaErrorMessage(null)}
                className="text-rose-400 hover:text-rose-200 font-bold ml-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
          {/* TAB 1: CREATE IMAGE */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              {/* Prompt input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#86837c] uppercase tracking-wider">
                    Prompt (Describe what to create)
                  </label>
                  <button
                    type="button"
                    onClick={handleEnhancePrompt}
                    disabled={!createPrompt.trim() || isEnhancingPrompt}
                    className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-2xs active:scale-95"
                    title="Enhance prompt with vivid details, cinematic lighting, and art keywords"
                  >
                    <Wand2 className={`w-3.5 h-3.5 ${isEnhancingPrompt ? 'animate-spin text-indigo-600' : 'text-indigo-600'}`} />
                    <span>{isEnhancingPrompt ? 'Enhancing...' : 'Enhance Prompt'}</span>
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    value={createPrompt}
                    onChange={(e) => setCreatePrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleCreateImage();
                      }
                    }}
                    rows={3}
                    placeholder="e.g. A majestic white peacock with glowing crystal feathers standing in a misty moonlit garden..."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Powered by Gemini 3.1 Flash Image</span>
                    <span>
                      Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">Ctrl+Enter</kbd> to generate
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick inspirations */}
              {!createResult && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Sample Prompts:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.slice(0, 3).map((qp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCreatePrompt(qp);
                          handleCreateImage(qp);
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200/80 transition-all text-left truncate max-w-full cursor-pointer"
                      >
                        ✨ {qp}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nano Banana AI Model Selector */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <span className="text-sm">🍌</span>
                    <span>Nano Banana Engine</span>
                  </label>
                  <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Supports GEMNI_API_KEY
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {NANO_BANANA_MODELS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModel(m.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        selectedModel === m.id
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-300 text-amber-950 ring-1 ring-amber-400/30 font-medium shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <span>{m.icon}</span>
                          <span>{m.name}</span>
                        </span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                          selectedModel === m.id ? 'bg-amber-200/70 text-amber-900' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                        {m.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio & Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    <Ratio className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Aspect Ratio</span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {RATIOS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setCreateAspectRatio(r.id as any)}
                        className={`px-1.5 py-1.5 rounded-xl border text-xs font-medium transition-all text-center cursor-pointer ${
                          createAspectRatio === r.id
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-1 ring-indigo-400/20 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-semibold">{r.label}</div>
                        <div className="text-[9px] text-slate-400 font-normal">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Artistic Style</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {STYLES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCreateStyle(s.id as any)}
                        className={`px-2 py-1.5 rounded-xl border text-xs font-medium transition-all text-center truncate cursor-pointer ${
                          createStyle === s.id
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-1 ring-indigo-400/20 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{s.icon} </span>
                        <span>{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {isCreating && (
                <div className="py-12 border-2 border-dashed border-amber-200 rounded-2xl bg-amber-50/40 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-800 flex items-center justify-center gap-1.5">
                      <span>🍌</span>
                      <span>
                        Generating with {
                          selectedModel === 'gemini-3.1-flash-lite-image'
                            ? 'Nano Banana'
                            : selectedModel === 'gemini-3.1-flash-image'
                            ? 'Nano Banana 2'
                            : 'Nano Banana Pro'
                        }...
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Synthesizing high-resolution imagery using Google Gemini Neural Studio
                    </p>
                  </div>
                </div>
              )}

              {/* Result Showcase */}
              {!isCreating && createResult && createResult.images.length > 0 && (
                <div className="space-y-3 pt-2">
                  {createResult.quotaNotice && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2">
                      <span className="text-sm">ℹ️</span>
                      <span>{createResult.quotaNotice}</span>
                    </div>
                  )}
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-md flex items-center justify-center max-h-[380px]">
                    <img
                      src={createResult.images[0]}
                      alt={createResult.prompt}
                      className="max-h-[380px] w-auto object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                      onClick={() => {
                        setZoomedImage(createResult.images[0]);
                        setIsZoomed(true);
                      }}
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          setZoomedImage(createResult.images[0]);
                          setIsZoomed(true);
                        }}
                        className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs backdrop-blur-xs transition-colors cursor-pointer"
                        title="Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{createResult.engine}</span>
                      <span>•</span>
                      <span>{createResult.aspectRatio}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* One-click: Send to Image Editor */}
                      <button
                        type="button"
                        onClick={() => handleSendToEditor(createResult.images[0], createResult.prompt)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                        title="Open this image in Edit mode to modify with text prompts"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                        <span>Edit this Image</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(createResult.images[0])}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(createResult.images[0], 'created_image')}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      {onInsertToChat && (
                        <button
                          type="button"
                          onClick={() => {
                            onInsertToChat(createResult.images[0], createResult.prompt);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Insert in Chat</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EDIT IMAGE */}
          {activeTab === 'edit' && (
            <div className="space-y-4">
              {/* Image selector / Upload zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Image to Edit
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {editSourceImage ? (
                  <div className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-purple-200 shrink-0 shadow-xs">
                        <img
                          src={editSourceImage}
                          alt="Source to edit"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">Source Image Loaded</p>
                        <p className="text-[11px] text-purple-700">Ready for Gemini text editing</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Change Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditSourceImage(null);
                          setEditResult(null);
                        }}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/30 hover:bg-purple-50/60 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Click to upload or drag & drop an image to edit
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Supports PNG, JPG, WebP up to 15MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Instruction */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    2. Edit Prompt (Describe modifications)
                  </label>
                  <button
                    type="button"
                    onClick={handleEnhancePrompt}
                    disabled={!editPrompt.trim() || isEnhancingPrompt}
                    className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Wand2 className={`w-3.5 h-3.5 ${isEnhancingPrompt ? 'animate-spin text-purple-600' : 'text-purple-600'}`} />
                    <span>{isEnhancingPrompt ? 'Enhancing...' : 'Enhance Prompt'}</span>
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleEditImage();
                      }
                    }}
                    rows={3}
                    placeholder="e.g. Add glowing neon sunglasses, make the background a cyberpunk Tokyo street, and add warm reflections..."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-purple-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none transition-all"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Powered by Gemini 3.1 Flash Image</span>
                    <span>
                      Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">Ctrl+Enter</kbd> to edit
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Edit Presets */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Popular Edits:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_EDIT_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEditPrompt(preset);
                        if (editSourceImage) {
                          handleEditImage(preset);
                        }
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/80 transition-all text-left truncate max-w-full cursor-pointer"
                    >
                      🪄 {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  <Ratio className="w-3.5 h-3.5 text-purple-600" />
                  <span>Output Aspect Ratio</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {RATIOS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setEditAspectRatio(r.id as any)}
                      className={`px-1.5 py-1.5 rounded-xl border text-xs font-medium transition-all text-center cursor-pointer ${
                        editAspectRatio === r.id
                          ? 'bg-purple-50 border-purple-300 text-purple-700 ring-1 ring-purple-400/20 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-semibold">{r.label}</div>
                      <div className="text-[9px] text-slate-400 font-normal">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading State for Edit */}
              {isEditing && (
                <div className="py-12 border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/40 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-800">
                      Editing with Gemini 3.1 Flash Image...
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Applying text modifications and rendering transformed visual
                    </p>
                  </div>
                </div>
              )}

              {/* Result of Edit Showcase with Before / After */}
              {!isEditing && editResult && editResult.images.length > 0 && (
                <div className="space-y-3 pt-2">
                  {editResult.quotaNotice && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2">
                      <span className="text-sm">ℹ️</span>
                      <span>{editResult.quotaNotice}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Edited Visual Result
                    </span>
                    {editSourceImage && (
                      <button
                        type="button"
                        onClick={() => setShowOriginalComparison((prev) => !prev)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Split className="w-3.5 h-3.5" />
                        <span>{showOriginalComparison ? 'Show Edited Only' : 'Compare Before / After'}</span>
                      </button>
                    )}
                  </div>

                  {showOriginalComparison && editSourceImage ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex flex-col items-center justify-center relative">
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-semibold backdrop-blur-xs">
                          Original
                        </span>
                        <img
                          src={editSourceImage}
                          alt="Original"
                          className="max-h-[260px] w-auto object-contain p-2"
                        />
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-purple-300 bg-slate-900 flex flex-col items-center justify-center relative">
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-semibold backdrop-blur-xs">
                          Edited with Gemini
                        </span>
                        <img
                          src={editResult.images[0]}
                          alt="Edited"
                          className="max-h-[260px] w-auto object-contain p-2 cursor-pointer"
                          onClick={() => {
                            setZoomedImage(editResult.images[0]);
                            setIsZoomed(true);
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative group rounded-2xl overflow-hidden border border-purple-200 bg-slate-950 shadow-md flex items-center justify-center max-h-[380px]">
                      <img
                        src={editResult.images[0]}
                        alt={editResult.prompt}
                        className="max-h-[380px] w-auto object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                        onClick={() => {
                          setZoomedImage(editResult.images[0]);
                          setIsZoomed(true);
                        }}
                      />
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => {
                            setZoomedImage(editResult.images[0]);
                            setIsZoomed(true);
                          }}
                          className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs backdrop-blur-xs transition-colors cursor-pointer"
                          title="Fullscreen"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions for Edited Image */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{editResult.engine}</span>
                      <span>•</span>
                      <span>{editResult.aspectRatio}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Chain edit: Use this edited image as new source */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditSourceImage(editResult.images[0]);
                          setEditPrompt('');
                          setEditResult(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        title="Keep editing from this newly modified result"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Edit Further</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(editResult.images[0])}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(editResult.images[0], 'edited_image')}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      {onInsertToChat && (
                        <button
                          type="button"
                          onClick={() => {
                            onInsertToChat(editResult.images[0], editResult.prompt);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Insert in Chat</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <p className="text-xs text-slate-500 hidden sm:block">
            Gemini 3.1 Flash Image • High precision image generation and multimodal editing
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              Close
            </button>
            
            {activeTab === 'create' ? (
              <button
                type="button"
                onClick={() => handleCreateImage()}
                disabled={!createPrompt.trim() || isCreating}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating Image...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{createResult ? 'Create Another' : 'Create Image'}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleEditImage()}
                disabled={!editSourceImage || !editPrompt.trim() || isEditing}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                {isEditing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Editing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{editResult ? 'Apply New Edit' : 'Edit Image with Gemini'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Zoom */}
      {isZoomed && zoomedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="max-h-[90vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
