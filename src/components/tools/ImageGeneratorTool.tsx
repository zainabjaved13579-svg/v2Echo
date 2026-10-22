import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Palette,
  Send,
  Upload,
  Image as ImageIcon,
  Wand2,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppTheme } from '../../context/ThemeContext';
import {
  generateAiImage,
  editAiImage,
  enhanceImagePrompt,
  getImageDailyQuota,
  ImageGenResult
} from '../../services/imageService';

const STYLES = [
  { id: 'photorealistic', name: 'Photorealistic', icon: '📷' },
  { id: 'cinematic', name: 'Cinematic Movie', icon: '🎬' },
  { id: 'anime', name: 'Anime Visual', icon: '✨' },
  { id: '3d-render', name: '3D Render', icon: '🔮' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', icon: '🌆' },
  { id: 'digital-art', name: 'Digital Art', icon: '🎨' }
];

const RATIOS = [
  { id: '1:1', label: '1:1 Square' },
  { id: '16:9', label: '16:9 Landscape' },
  { id: '9:16', label: '9:16 Portrait' },
  { id: '4:3', label: '4:3 Classic' },
  { id: '3:4', label: '3:4 Photo' }
];

const QUICK_PROMPTS = [
  'A majestic snow leopard resting on Himalayan peaks at sunrise',
  'A neon-lit futuristic cafe in Tokyo with holographic signs, rain reflections',
  'A cozy courtyard with jasmine flowers, steaming tea and warm sunlight',
  'A sleek electric hypercar cruising an ocean coastal highway at dusk'
];

export const ImageGeneratorTool: React.FC<{
  onSendToChat?: (text: string) => void;
}> = ({ onSendToChat }) => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');
  const [createPrompt, setCreatePrompt] = useState('');
  const [createAspectRatio, setCreateAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [createStyle, setCreateStyle] = useState<'photorealistic' | 'cinematic' | 'anime' | '3d-render' | 'cyberpunk' | 'digital-art'>('photorealistic');
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<ImageGenResult | null>(null);

  // Edit state
  const [editSourceImage, setEditSourceImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editResult, setEditResult] = useState<ImageGenResult | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bgMain = isMoon ? 'bg-[#151515]' : 'bg-[#f8fafc]';
  const bgCard = isMoon ? 'bg-[#20201f]' : 'bg-white';
  const bgInput = isMoon ? 'bg-[#181818]' : 'bg-[#f1f5f9]';
  const border = isMoon ? 'border-[#2b2b2a]' : 'border-[#e2e8f0]';
  const textBright = isMoon ? 'text-white' : 'text-slate-900';
  const textSub = isMoon ? 'text-[#a3a3a3]' : 'text-slate-500';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleGenerate = async () => {
    if (!createPrompt.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const res = await generateAiImage({
        prompt: createPrompt,
        aspectRatio: createAspectRatio,
        style: createStyle
      });
      setCreateResult(res);
      showToast('Image generated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Generation failed');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!editSourceImage || !editPrompt.trim() || isEditing) return;
    setIsEditing(true);
    try {
      const res = await editAiImage({ image: editSourceImage, prompt: editPrompt });
      setEditResult(res);
      showToast('Image edited successfully!');
    } catch (err: any) {
      showToast(err.message || 'Edit failed');
    } finally {
      setIsEditing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditSourceImage(reader.result);
        setActiveTab('edit');
        showToast('Source image loaded');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className={`flex-1 flex flex-col h-full ${bgMain} overflow-y-auto p-4 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif]`}>
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#d97757] text-white text-xs px-4 py-2 rounded-xl shadow-lg font-bold">
          {toastMessage}
        </div>
      )}

      {/* Header bar */}
      <div className="max-w-5xl mx-auto w-full mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-extrabold ${textBright} flex items-center gap-2`}>
            <Sparkles className="w-6 h-6 text-[#d97757]" />
            <span>Sapphire Image Studio</span>
          </h1>
          <p className={`text-xs ${textSub} mt-1`}>
            Create photorealistic art, cinematic visuals, and edit images instantly using advanced AI diffusion.
          </p>
        </div>

        {/* Tab switcher */}
        <div className={`flex items-center ${bgInput} rounded-xl p-1 border ${border} text-xs`}>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'create' ? 'bg-[#d97757] text-white shadow-xs' : textSub
            }`}
          >
            Create Art
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'edit' ? 'bg-[#d97757] text-white shadow-xs' : textSub
            }`}
          >
            Edit & Transform
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Controls */}
        <div className={`lg:col-span-5 ${bgCard} border ${border} rounded-2xl p-5 flex flex-col gap-4 shadow-sm`}>
          {activeTab === 'create' ? (
            <>
              <div>
                <label className={`block text-xs font-bold ${textBright} mb-1.5`}>Prompt & Description</label>
                <textarea
                  value={createPrompt}
                  onChange={(e) => setCreatePrompt(e.target.value)}
                  placeholder="Describe the image you want to create in detail..."
                  rows={4}
                  className={`w-full ${bgInput} border ${border} rounded-xl p-3 text-xs ${textBright} focus:outline-none focus:border-[#d97757] resize-none`}
                />
              </div>

              {/* Quick suggestions */}
              <div>
                <span className={`text-[11px] font-semibold ${textSub} mb-1 block`}>Quick Inspiration:</span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.slice(0, 3).map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCreatePrompt(qp)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg ${bgInput} border ${border} ${textSub} hover:${textBright} transition-colors text-left truncate max-w-full cursor-pointer`}
                    >
                      {qp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className={`block text-xs font-bold ${textBright} mb-1.5`}>Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {RATIOS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setCreateAspectRatio(r.id as any)}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        createAspectRatio === r.id
                          ? 'border-[#d97757] bg-[#d97757]/15 text-[#d97757]'
                          : `${border} ${bgInput} ${textSub}`
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style preset */}
              <div>
                <label className={`block text-xs font-bold ${textBright} mb-1.5`}>Art Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setCreateStyle(s.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                        createStyle === s.id
                          ? 'border-[#d97757] bg-[#d97757]/15 text-[#d97757]'
                          : `${border} ${bgInput} ${textSub}`
                      }`}
                    >
                      <span>{s.icon}</span>
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isCreating || !createPrompt.trim()}
                className="w-full mt-2 py-3 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-md"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating Artwork...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Image</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className={`block text-xs font-bold ${textBright} mb-1.5`}>Source Image</label>
                {editSourceImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-[#2b2b2a] bg-black h-48 flex items-center justify-center">
                    <img src={editSourceImage} alt="Source" className="max-h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setEditSourceImage(null)}
                      className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed ${border} rounded-xl p-6 text-center cursor-pointer hover:border-[#d97757] transition-colors`}
                  >
                    <Upload className="w-6 h-6 text-[#d97757] mx-auto mb-2" />
                    <span className={`text-xs font-bold ${textBright} block`}>Upload Source Image</span>
                    <span className={`text-[10px] ${textSub} mt-0.5 block`}>PNG, JPG, WebP up to 20MB</span>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </div>

              <div>
                <label className={`block text-xs font-bold ${textBright} mb-1.5`}>Edit Instructions</label>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="E.g., Add golden hour sunset lighting, change background to cyberpunk city..."
                  rows={4}
                  className={`w-full ${bgInput} border ${border} rounded-xl p-3 text-xs ${textBright} focus:outline-none focus:border-[#d97757] resize-none`}
                />
              </div>

              <button
                type="button"
                onClick={handleEdit}
                disabled={isEditing || !editSourceImage || !editPrompt.trim()}
                className="w-full mt-2 py-3 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-md"
              >
                {isEditing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transforming Image...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Apply AI Edit</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Right Output Display */}
        <div className={`lg:col-span-7 ${bgCard} border ${border} rounded-2xl p-5 flex flex-col items-center justify-center min-h-[420px] shadow-sm relative overflow-hidden`}>
          {(activeTab === 'create' ? createResult : editResult) ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <div className="relative rounded-2xl overflow-hidden border border-[#2b2b2a] bg-black max-w-full max-h-[500px] shadow-2xl flex items-center justify-center">
                <img
                  src={(activeTab === 'create' ? createResult?.images[0] : editResult?.images[0]) || ''}
                  alt="Generated Result"
                  className="max-w-full max-h-[480px] object-contain"
                />
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={(activeTab === 'create' ? createResult?.images[0] : editResult?.images[0]) || '#'}
                  download="sapphire-ai-artwork.png"
                  className="px-4 py-2 rounded-xl bg-[#d97757] hover:bg-[#c86b4c] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Image</span>
                </a>

                {onSendToChat && (
                  <button
                    type="button"
                    onClick={() => {
                      const imgUrl = (activeTab === 'create' ? createResult?.images[0] : editResult?.images[0]);
                      const p = (activeTab === 'create' ? createPrompt : editPrompt);
                      if (imgUrl) {
                        onSendToChat(`![${p}](${imgUrl})\n*Generated Image: ${p}*`);
                        showToast('Sent image to chat!');
                      }
                    }}
                    className={`px-4 py-2 rounded-xl ${bgInput} border ${border} ${textBright} text-xs font-bold flex items-center gap-1.5 hover:bg-neutral-800 transition-colors cursor-pointer`}
                  >
                    <Send className="w-4 h-4 text-[#d97757]" />
                    <span>Send to Chat</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-[#d97757]/15 text-[#d97757] border border-[#d97757]/30 flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className={`text-sm font-bold ${textBright} mb-1`}>No Artwork Generated Yet</h3>
              <p className={`text-xs ${textSub} max-w-xs mx-auto`}>
                Enter your prompt and click Generate to create stunning AI visuals instantly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGeneratorTool;
