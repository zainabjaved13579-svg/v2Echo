import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Code2,
  Eye,
  Layers,
  Folder,
  FileCode,
  Play,
  Download,
  Copy,
  Check,
  RefreshCw,
  Plus,
  ExternalLink,
  Laptop,
  Smartphone,
  Zap,
  Key,
  Trash2,
  X
} from 'lucide-react';
import { WorkspaceFile, AppSettings } from '../types';
import {
  loadWorkspaceFiles,
  saveWorkspaceFiles,
  autoSaveFile,
  deleteWorkspaceFile,
  exportAllFilesAsZip
} from '../services/fileStorageService';
import { parseGeneratedProjectFiles, buildUnifiedLivePreviewBundle } from '../services/appEngineService';
import { streamGeminiChat } from '../services/geminiService';

interface CodexWorkspaceViewProps {
  settings: AppSettings;
  onUpdateSettings?: (settings: AppSettings) => void;
  onClose?: () => void;
}

export const CodexWorkspaceView: React.FC<CodexWorkspaceViewProps> = ({
  settings,
  onUpdateSettings,
  onClose
}) => {
  const [files, setFiles] = useState<WorkspaceFile[]>(() => loadWorkspaceFiles());
  const [selectedFileId, setSelectedFileId] = useState<string>(() => {
    const loaded = loadWorkspaceFiles();
    return loaded[0]?.id || '';
  });
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'split'>('split');
  const [copied, setCopied] = useState(false);
  const [deviceFrame, setDeviceFrame] = useState<'desktop' | 'mobile'>('desktop');
  const [statusMessage, setStatusMessage] = useState('');
  const [previewKey, setPreviewKey] = useState(0);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(settings.customApiKey || '');
  const [firebaseConfigInput, setFirebaseConfigInput] = useState('');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const selectedFile = files.find((f) => f.id === selectedFileId) || files[0];

  // Refresh files list
  const refreshFiles = () => {
    const loaded = loadWorkspaceFiles();
    setFiles(loaded);
    if (!selectedFileId && loaded.length > 0) {
      setSelectedFileId(loaded[0].id);
    }
  };

  useEffect(() => {
    refreshFiles();
  }, []);

  const handleCreateEmptyFile = () => {
    const filename = window.prompt('Enter new filename (e.g. styles.css, app.js, index.html):', 'component.tsx');
    if (!filename) return;
    const newFile = autoSaveFile({
      name: filename,
      path: `/workspace/${filename}`,
      content: filename.endsWith('.html')
        ? '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>App</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>'
        : `// ${filename}\nexport default function Module() {\n  return null;\n}\n`,
      language: filename.split('.').pop() || 'typescript',
      source: 'user-created'
    });
    refreshFiles();
    setSelectedFileId(newFile.id);
  };

  const handleUpdateFileContent = (newContent: string) => {
    if (!selectedFile) return;
    autoSaveFile({
      name: selectedFile.name,
      path: selectedFile.path,
      content: newContent,
      language: selectedFile.language,
      source: selectedFile.source
    });
    setFiles(loadWorkspaceFiles());
    setPreviewKey((k) => k + 1);
  };

  const handleDeleteFile = (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    deleteWorkspaceFile(id);
    const updated = loadWorkspaceFiles();
    setFiles(updated);
    if (selectedFileId === id) {
      setSelectedFileId(updated[0]?.id || '');
    }
    setPreviewKey((k) => k + 1);
  };

  // Google AI Studio App Generator (Autonomous Codex Engine)
  const handleGenerateApp = async () => {
    const query = prompt.trim();
    if (!query || isGenerating) return;

    setIsGenerating(true);
    setStatusMessage('Google AI Studio Codex: Architecting modular app...');

    const systemPrompt = `You are Google AI Studio Codex Engine, an elite principal software engineer and web app architect.
Your job is to generate complete, modern, fully functional, ready-to-run web applications.
Adhere strictly to:
1. Provide coordinated modular files (index.html, styles.css, app.js).
2. Each file must be enclosed in its own distinct Markdown code block with filename:
\`\`\`html index.html
<!DOCTYPE html>
<html>
...
</html>
\`\`\`
\`\`\`css styles.css
...
\`\`\`
\`\`\`javascript app.js
...
\`\`\`
3. Use Tailwind CSS CDN, modern typography, sleek gradients, event handlers, and full interactive logic.
4. Do NOT use stub functions, placeholders, or "TODO". Every feature must work.`;

    let accumulated = '';

    try {
      await streamGeminiChat({
        messages: [
          {
            id: `ai_gen_${Date.now()}`,
            role: 'user',
            text: `Build a complete, fully featured web application for: "${query}". Provide all necessary files (index.html, styles.css, app.js) in complete modular code blocks.`,
            timestamp: Date.now()
          }
        ],
        systemInstruction: systemPrompt,
        temperature: 0.2,
        model: 'gemini-3.8-flash',
        customApiKey: settings.customApiKey,
        onChunk: (chunk) => {
          accumulated = chunk;
        },
        onDone: (full) => {
          const generatedFiles = parseGeneratedProjectFiles(full || accumulated);
          if (generatedFiles.length > 0) {
            generatedFiles.forEach((f) => {
              autoSaveFile({
                name: f.name,
                path: f.path,
                content: f.content,
                language: f.language,
                source: 'ai-generated'
              });
            });
            const updated = loadWorkspaceFiles();
            setFiles(updated);
            setSelectedFileId(updated[0]?.id || '');
            setPreviewKey((k) => k + 1);
            setStatusMessage(`Created ${generatedFiles.length} files successfully!`);
          } else {
            autoSaveFile({
              name: 'index.html',
              path: '/workspace/index.html',
              content: full || accumulated,
              language: 'html',
              source: 'ai-generated'
            });
            const updated = loadWorkspaceFiles();
            setFiles(updated);
            setSelectedFileId(updated[0]?.id || '');
            setPreviewKey((k) => k + 1);
            setStatusMessage('App generated in index.html');
          }
          setIsGenerating(false);
          setPrompt('');
        },
        onError: (err) => {
          console.error('Codex Engine Generation Error:', err);
          setStatusMessage(`Error: ${typeof err === 'string' ? err : (err as any)?.message || 'Generation failed.'}`);
          setIsGenerating(false);
        }
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Failed: ${err.message}`);
      setIsGenerating(false);
    }
  };

  const previewHtml = buildUnifiedLivePreviewBundle(files);

  const handleCopyCode = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCredentials = () => {
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        customApiKey: apiKeyInput.trim()
      });
    }
    try {
      localStorage.setItem('gemini_api_key', apiKeyInput.trim());
      if (firebaseConfigInput.trim()) {
        localStorage.setItem('sapphire_firebase_custom', firebaseConfigInput.trim());
      }
    } catch (e) {}
    setShowConfigModal(false);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#191817] text-[#ede8e1] font-['Plus_Jakarta_Sans',sans-serif] select-none sm:select-auto overflow-hidden">
      {/* Top Bar for Codex Engine */}
      <div className="h-14 border-b border-[#2a2926] bg-[#201f1d] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[#282724] text-[#86837c] hover:text-[#ede8e1] transition-colors cursor-pointer border border-[#383633]"
              title="Return to Chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#282724] border border-[#383633] text-[#d97757] flex items-center justify-center font-bold text-xs shadow-xs">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#f5f2eb] tracking-tight">Codex Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d97757]/15 text-[#d97757] border border-[#d97757]/30 font-medium">
                  Google AI Studio Engine
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Setup / API Key Button */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#282724] hover:bg-[#32302c] border border-[#383633] text-xs text-[#ede8e1] transition-colors cursor-pointer"
            title="Configure Google AI Studio API Key & Firebase"
          >
            <Key className="w-3.5 h-3.5 text-[#d97757]" />
            <span className="hidden sm:inline">Studio Key</span>
            {settings.customApiKey && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Device toggle */}
          <div className="hidden sm:flex items-center bg-[#201f1d] border border-[#33312e] rounded-xl p-0.5">
            <button
              onClick={() => setDeviceFrame('desktop')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                deviceFrame === 'desktop' ? 'bg-[#d97757] text-white' : 'text-[#86837c] hover:text-[#ede8e1]'
              }`}
              title="Desktop Viewport"
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceFrame('mobile')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                deviceFrame === 'mobile' ? 'bg-[#d97757] text-white' : 'text-[#86837c] hover:text-[#ede8e1]'
              }`}
              title="Mobile Viewport (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Modes */}
          <div className="flex items-center bg-[#201f1d] border border-[#33312e] rounded-xl p-0.5">
            <button
              onClick={() => setActiveTab('code')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'code' ? 'bg-[#282724] text-[#ede8e1] shadow-xs' : 'text-[#86837c] hover:text-[#ede8e1]'
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Code</span>
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`hidden md:flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'split' ? 'bg-[#282724] text-[#ede8e1] shadow-xs' : 'text-[#86837c] hover:text-[#ede8e1]'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'preview' ? 'bg-[#d97757] text-white shadow-xs' : 'text-[#86837c] hover:text-[#ede8e1]'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>

          {/* Export Zip */}
          <button
            onClick={() => exportAllFilesAsZip(files)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#282724] hover:bg-[#32302c] border border-[#383633] text-[#ede8e1] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download ZIP"
          >
            <Download className="w-3.5 h-3.5 text-[#d97757]" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Split Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Explorer Sidebar */}
        <div className="w-56 sm:w-64 border-r border-[#2a2926] bg-[#201f1d] flex flex-col shrink-0">
          <div className="p-3 border-b border-[#2a2926] flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[#a19e97] flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-[#d97757]" />
              Workspace Files ({files.length})
            </span>
            <button
              onClick={handleCreateEmptyFile}
              className="p-1 rounded-md text-[#86837c] hover:text-[#ede8e1] hover:bg-[#282724] transition-colors cursor-pointer"
              title="Add new file"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {files.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#86837c]">
                Workspace is empty. Enter an app description below or click + to add files.
              </div>
            ) : (
              files.map((file) => {
                const isSelected = file.id === selectedFileId;
                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#282724] text-[#ede8e1] border border-[#383633] font-medium'
                        : 'text-[#a19e97] hover:text-[#ede8e1] hover:bg-[#242320] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#d97757]' : 'text-[#86837c]'}`} />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.id, file.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-[#86837c] hover:text-rose-400 transition-opacity cursor-pointer"
                      title="Delete file"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* AI Prompt Input Bar for Codex App Creation */}
          <div className="p-3 border-t border-[#2a2926] bg-[#191817] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-[#d97757] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Prompt App Builder
              </span>
              {isGenerating && (
                <span className="text-[10px] text-emerald-400 animate-pulse font-mono">Building...</span>
              )}
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Build a sleek dashboard with audio synthesizer, interactive canvas, and dark theme..."
              className="w-full h-20 p-2.5 text-xs bg-[#201f1d] border border-[#33312e] rounded-xl text-[#ede8e1] placeholder-[#86837c] focus:outline-none focus:border-[#d97757] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleGenerateApp();
                }
              }}
            />
            <button
              onClick={handleGenerateApp}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-2 bg-[#d97757] hover:bg-[#c86b4c] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-98"
            >
              {isGenerating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isGenerating ? 'Building App...' : 'Generate App'}</span>
            </button>
            {statusMessage && (
              <p className="text-[10px] text-[#86837c] font-mono truncate">{statusMessage}</p>
            )}
          </div>
        </div>

        {/* Center/Right: Code Editor and Live Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor Panel */}
          {(activeTab === 'code' || activeTab === 'split') && (
            <div className={`flex-1 flex flex-col bg-[#191817] border-r border-[#2a2926] min-w-0 ${activeTab === 'split' ? 'w-1/2' : 'w-full'}`}>
              <div className="h-10 border-b border-[#2a2926] bg-[#201f1d] px-4 flex items-center justify-between text-xs text-[#a19e97]">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-[#ede8e1] font-medium">{selectedFile?.name || 'No file selected'}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#282724] text-[#86837c] font-mono uppercase">
                    {selectedFile?.language || 'plain'}
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-[#86837c] hover:text-[#ede8e1] transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                value={selectedFile?.content || ''}
                onChange={(e) => handleUpdateFileContent(e.target.value)}
                placeholder="// Enter code or select a file..."
                className="flex-1 w-full bg-[#191817] text-[#ede8e1] font-mono text-xs sm:text-sm p-4 focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}

          {/* Interactive Live Preview Panel */}
          {(activeTab === 'preview' || activeTab === 'split') && (
            <div className={`flex-1 flex flex-col bg-[#191817] overflow-hidden relative ${activeTab === 'split' ? 'w-1/2' : 'w-full'}`}>
              <div className="h-10 border-b border-[#2a2926] bg-[#201f1d] px-4 flex items-center justify-between text-xs text-[#a19e97]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-[#ede8e1]">Live App Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewKey((k) => k + 1)}
                    className="p-1 text-[#86837c] hover:text-[#ede8e1] rounded transition-colors cursor-pointer"
                    title="Reload Preview"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Viewport Frame */}
              <div className="flex-1 flex items-center justify-center p-2 sm:p-4 bg-[#141312] overflow-auto">
                <div
                  className={`h-full transition-all duration-300 bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#33312e] ${
                    deviceFrame === 'mobile' ? 'w-[375px] max-h-[720px] rounded-3xl ring-8 ring-[#282724]' : 'w-full'
                  }`}
                >
                  <iframe
                    key={previewKey}
                    ref={iframeRef}
                    srcDoc={previewHtml}
                    title="Sapphire Codex Live App Preview"
                    sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API Key and Firebase Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#201f1d] border border-[#33312e] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2926] pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#d97757]" />
                <h3 className="font-semibold text-[#f5f2eb] text-base">Google AI Studio Setup</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-[#86837c] hover:text-[#ede8e1] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#ede8e1] mb-1">
                  Google AI Studio (Gemini) API Key
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 bg-[#191817] border border-[#33312e] rounded-xl text-[#ede8e1] font-mono focus:border-[#d97757] focus:outline-none"
                />
                <p className="text-[10px] text-[#86837c] mt-1">
                  Powers autonomous Codex App Building and multi-file code generation.
                </p>
              </div>

              <div>
                <label className="block font-medium text-[#ede8e1] mb-1">
                  Firebase Web Configuration (Optional)
                </label>
                <textarea
                  value={firebaseConfigInput}
                  onChange={(e) => setFirebaseConfigInput(e.target.value)}
                  placeholder='{"apiKey": "...", "projectId": "..."}'
                  className="w-full h-20 px-3 py-2 bg-[#191817] border border-[#33312e] rounded-xl text-[#ede8e1] font-mono focus:border-[#d97757] focus:outline-none resize-none"
                />
                <p className="text-[10px] text-[#86837c] mt-1">
                  Connect your custom Firebase project for persistence if desired.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2a2926]">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-xs text-[#86837c] hover:text-[#ede8e1] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCredentials}
                className="px-4 py-2 text-xs font-semibold bg-[#d97757] hover:bg-[#c86b4c] text-white rounded-xl shadow-md cursor-pointer"
              >
                Save Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodexWorkspaceView;
