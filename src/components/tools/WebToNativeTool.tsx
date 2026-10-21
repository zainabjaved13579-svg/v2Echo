import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Globe,
  Smartphone,
  Monitor,
  Download,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Package,
  Sliders,
  Maximize2,
  X
} from 'lucide-react';
import JSZip from 'jszip';
import { useAppTheme } from '../../context/ThemeContext';

interface AppPreset {
  name: string;
  url: string;
  id: string;
  themeColor: string;
}

const PRESET_APPS: AppPreset[] = [
  { name: 'GitHub', url: 'github.com', id: 'com.github.client', themeColor: '#24292e' },
  { name: 'Notion', url: 'notion.so', id: 'so.notion.client', themeColor: '#000000' },
  { name: 'Figma', url: 'figma.com', id: 'com.figma.client', themeColor: '#f24e1e' },
  { name: 'Spotify', url: 'spotify.com', id: 'com.spotify.client', themeColor: '#1db954' }
];

export const WebToNativeTool: React.FC = () => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  // App Builder Configuration State - Empty by default, auto-guesses as user types
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [appName, setAppName] = useState<string>('');
  const [appId, setAppId] = useState<string>('');
  const [iconDataUrl, setIconDataUrl] = useState<string>('');
  const [windowWidth, setWindowWidth] = useState<number>(1280);
  const [windowHeight, setWindowHeight] = useState<number>(800);
  const [isDetectingIcon, setIsDetectingIcon] = useState<boolean>(false);

  // Build & Packaging States
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildStep, setBuildStep] = useState<string>('');
  const [buildSuccess, setBuildSuccess] = useState<string | null>(null);
  const [downloadLink, setDownloadLink] = useState<{ url: string; filename: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [simReloadKey, setSimReloadKey] = useState<number>(0);

  const iconInputRef = useRef<HTMLInputElement>(null);

  // Exact theme tokens mapped from chat
  const bgMain = isMoon ? 'bg-[#151515]' : 'bg-[#f8fafc]';
  const bgCard = isMoon ? 'bg-[#20201f]' : 'bg-white';
  const bgInput = isMoon ? 'bg-[#181818]' : 'bg-[#f1f5f9]';
  const border = isMoon ? 'border-[#2b2b2a]' : 'border-[#e2e8f0]';
  const textBright = isMoon ? 'text-white' : 'text-slate-900';
  const textSub = isMoon ? 'text-[#a3a3a3]' : 'text-slate-500';
  const btnPrimary = 'bg-[#d97757] hover:bg-[#c86b4c] text-white font-bold';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Instant Smart Autoguess from URL
  const autoDetectAppInfo = useCallback(
    async (rawUrl: string, forceName = true) => {
      if (!rawUrl || !rawUrl.trim()) return;

      let cleanUrl = rawUrl.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`;
      }

      let domain = '';
      try {
        domain = new URL(cleanUrl).hostname;
      } catch {
        return;
      }

      setIsDetectingIcon(true);
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      setIconDataUrl(googleFaviconUrl);

      // Guess clean app name from domain
      const parts = domain.replace(/^www\./, '').split('.');
      const rawBrand = parts[0] || 'App';

      const knownNames: Record<string, string> = {
        github: 'GitHub',
        youtube: 'YouTube',
        linkedin: 'LinkedIn',
        whatsapp: 'WhatsApp',
        tiktok: 'TikTok',
        reddit: 'Reddit',
        figma: 'Figma',
        linear: 'Linear',
        notion: 'Notion',
        vercel: 'Vercel',
        netflix: 'Netflix',
        spotify: 'Spotify',
        twitter: 'X (Twitter)',
        instagram: 'Instagram',
        facebook: 'Facebook',
        google: 'Google',
        apple: 'Apple'
      };

      const detectedName = knownNames[rawBrand.toLowerCase()] || (rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1));
      if (forceName || !appName) {
        setAppName(detectedName);
        setAppId(`com.${rawBrand.toLowerCase()}.client`);
      }

      // Proactive fetch from server icon detector
      try {
        const res = await fetch(`/api/tools/detect-icon?url=${encodeURIComponent(cleanUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.iconDataUrl) {
            setIconDataUrl(data.iconDataUrl);
          } else if (data.iconUrl) {
            setIconDataUrl(data.iconUrl);
          }
          if (data.siteTitle) {
            const shortTitle = data.siteTitle.split(/[–—·|:-]/)[0]?.trim();
            if (shortTitle && shortTitle.length > 1 && shortTitle.length < 32) {
              setAppName(shortTitle);
            }
          }
        }
      } catch {}

      setIsDetectingIcon(false);
    },
    []
  );

  const handleApplyPreset = (preset: AppPreset) => {
    setTargetUrl(preset.url);
    setAppName(preset.name);
    setAppId(preset.id);
    autoDetectAppInfo(preset.url, true);
    setSimReloadKey((k) => k + 1);
  };

  const handleCustomIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setIconDataUrl(reader.result);
        showToast('Uploaded custom icon');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Helper for safe mobile downloads
  const triggerSafeDownload = (blob: Blob, filename: string) => {
    const dlUrl = URL.createObjectURL(blob);
    setDownloadLink({ url: dlUrl, filename });

    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 200);
  };

  // 1. Build Standalone Windows Desktop App Package (.zip)
  const handleBuildWindowsPackage = async () => {
    if (!targetUrl.trim()) {
      setErrorMsg('Please enter a target URL.');
      return;
    }

    setIsBuilding(true);
    setErrorMsg(null);
    setBuildSuccess(null);
    setBuildStep('Generating standalone Windows desktop wrapper & launch scripts...');

    try {
      const cleanTargetUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
      const safeName = (appName || 'App').replace(/[^a-zA-Z0-9_-]/g, '_');
      const zip = new JSZip();

      // Click-to-Run Batch Script
      const batLauncher = `@echo off
title ${appName}
echo Launching ${appName} Standalone Desktop Window...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch.ps1"
`;
      zip.file(`Launch-${safeName}.bat`, batLauncher);

      // PowerShell WebView2 Runner Script
      const ps1Launcher = `Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$url = "${cleanTargetUrl}"
$title = "${appName}"

# Launch default browser in standalone application window mode
Start-Process "msedge.exe" -ArgumentList "--app=$url --window-size=${windowWidth},${windowHeight}"
`;
      zip.file('launch.ps1', ps1Launcher);

      // Desktop Shortcut Installer (VBScript)
      const vbsShortcut = `Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\\${appName}.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = oWS.CurrentDirectory & "\\Launch-${safeName}.bat"
oLink.WorkingDirectory = oWS.CurrentDirectory
oLink.Description = "${appName} Desktop App"
oLink.Save
WScript.Echo "${appName} shortcut created on your Desktop!"
`;
      zip.file('Install-Desktop-Shortcut.vbs', vbsShortcut);

      // Package Readme
      const readme = `# ${appName} Desktop Package
Built by Sapphire Url-to-App Studio.

## How to Run:
1. Double click 'Launch-${safeName}.bat' to open ${appName} in standalone desktop window mode.
2. Run 'Install-Desktop-Shortcut.vbs' to pin ${appName} directly to your Windows desktop.`;

      zip.file('README.txt', readme);

      const blob = await zip.generateAsync({ type: 'blob' });
      const filename = `${safeName}-WindowsDesktopPackage.zip`;
      triggerSafeDownload(blob, filename);

      setBuildSuccess(`Downloaded "${filename}"! Double-click Launch-${safeName}.bat to run.`);
      showToast('Windows Package ready!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Build failed.');
    } finally {
      setIsBuilding(false);
      setBuildStep('');
    }
  };

  // 2. Build Android WebAPK / PWA Package (.zip)
  const handleBuildAndroidPackage = async () => {
    if (!targetUrl.trim()) {
      setErrorMsg('Please enter a target URL.');
      return;
    }

    setIsBuilding(true);
    setErrorMsg(null);
    setBuildSuccess(null);
    setBuildStep('Packaging Android WebAPK & Progressive Manifest...');

    try {
      const cleanTargetUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
      const safeName = (appName || 'App').replace(/[^a-zA-Z0-9_-]/g, '_');
      const zip = new JSZip();

      const manifest = {
        name: appName,
        short_name: appName,
        start_url: cleanTargetUrl,
        id: appId,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#151515',
        theme_color: '#d97757',
        icons: [
          {
            src: iconDataUrl,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: iconDataUrl,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      };

      const swJs = `const CACHE_NAME = '${appId}-v1';
self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});`;

      const installInstructions = `# ${appName} - Android PWA Package
1. Open this link on your Android device (Chrome / Brave / Firefox).
2. Tap the browser menu (3 dots) and tap "Add to Home Screen" or "Install App".
3. The app will launch with a dedicated home screen icon, full-screen standalone window, and zero browser URL bar!`;

      // Standalone HTML Launcher
      const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>${appName}</title>
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#d97757">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #151515; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe src="${cleanTargetUrl}" allow="fullscreen; camera; microphone; geolocation"></iframe>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function(){});
    }
  </script>
</body>
</html>`;

      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      zip.file('sw.js', swJs);
      zip.file('index.html', indexHtml);
      zip.file('INSTALL-ANDROID.md', installInstructions);

      const blob = await zip.generateAsync({ type: 'blob' });
      const filename = `${safeName}-AndroidPackage.zip`;
      triggerSafeDownload(blob, filename);

      setBuildSuccess(`Downloaded "${filename}"! Ready for Android installation.`);
      showToast('Android Package ready!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Build failed.');
    } finally {
      setIsBuilding(false);
      setBuildStep('');
    }
  };

  // 3. Download Single-File HTML Standalone Desktop App
  const handleDownloadStandaloneHtml = () => {
    if (!targetUrl.trim()) return;
    const cleanTargetUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
    const safeName = (appName || 'App').replace(/[^a-zA-Z0-9_-]/g, '_');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <link rel="icon" href="${iconDataUrl}">
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe src="${cleanTargetUrl}" allow="fullscreen; camera; microphone; geolocation; clipboard-read; clipboard-write"></iframe>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const filename = `${safeName}-Standalone.html`;
    triggerSafeDownload(blob, filename);
    showToast('Single-file app downloaded!');
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${bgMain} font-['Plus_Jakarta_Sans',sans-serif]`}>
      {/* Top Header */}
      <div className={`px-4 sm:px-6 py-3 border-b ${border} ${bgCard} shrink-0`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#181818] text-[#d97757] border border-[#2b2b2a] flex items-center justify-center shadow-xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-sm sm:text-base font-bold ${textBright}`}>
                  URL to App Studio (.exe & APK)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-[#d97757]/15 text-[#d97757] border border-[#d97757]/30">
                  Native Wrappers
                </span>
              </div>
              <p className={`text-[11px] ${textSub}`}>
                Turn any website into a standalone Windows desktop app, Android WebAPK, and single-file launcher.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className={`text-[10px] font-semibold ${textSub} shrink-0`}>Presets:</span>
            {PRESET_APPS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium ${bgInput} border ${border} ${textSub} hover:${textBright} transition-colors shrink-0 cursor-pointer`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left: Configuration & Packaging Cards */}
        <div className={`w-full lg:w-1/2 p-4 sm:p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r ${border} space-y-4 sm:space-y-5`}>
          {/* Identity & Target URL Card */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${border} ${bgCard} space-y-4 shadow-xs`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold ${textBright} uppercase tracking-wider`}>
                Target Website & Identity
              </h3>
              <span className="text-[11px] text-[#d97757] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Smart Autoguess</span>
              </span>
            </div>

            {/* Target URL with Autoguess Trigger & Clear Button */}
            <div className="space-y-1.5">
              <label className={`text-xs font-semibold ${textBright} block`}>
                Website URL
              </label>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${border} ${bgInput}`}>
                <Globe className="w-4 h-4 text-[#d97757] shrink-0" />
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTargetUrl(val);
                    autoDetectAppInfo(val, true);
                  }}
                  placeholder="Enter website URL (e.g. github.com)..."
                  className={`w-full bg-transparent text-xs sm:text-sm font-medium ${textBright} outline-none placeholder:text-neutral-500`}
                />
                {targetUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetUrl('');
                      setAppName('');
                    }}
                    className="p-1 rounded-md text-neutral-400 hover:text-white cursor-pointer"
                    title="Clear input"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => autoDetectAppInfo(targetUrl, true)}
                  disabled={isDetectingIcon}
                  className="px-2.5 py-1 rounded-lg bg-[#20201f] hover:bg-[#282724] text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer border border-[#2b2b2a]"
                  title="Re-detect Logo and Title"
                >
                  <RefreshCw className={`w-3 h-3 ${isDetectingIcon ? 'animate-spin' : ''}`} />
                  <span>Autoguess</span>
                </button>
              </div>
            </div>

            {/* Autoguessed Logo & Identity Card */}
            <div className={`p-3.5 rounded-xl border ${border} ${bgInput} flex items-center justify-between gap-3`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-black/40 border border-[#2b2b2a] p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  {iconDataUrl ? (
                    <img
                      src={iconDataUrl}
                      alt="App Logo"
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        (e.target as any).src = 'https://www.google.com/s2/favicons?domain=google.com&sz=128';
                      }}
                    />
                  ) : (
                    <Globe className="w-6 h-6 text-neutral-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className={`text-xs font-bold ${textBright} truncate`}>{appName || 'My App'}</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono">
                      Auto Detected
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500 font-mono truncate">{appId}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="file"
                  ref={iconInputRef}
                  accept="image/*"
                  onChange={handleCustomIconUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => iconInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-[#20201f] hover:bg-[#282724] text-white text-[11px] font-semibold border border-[#2b2b2a] transition-colors cursor-pointer"
                >
                  Upload Icon
                </button>
              </div>
            </div>

            {/* Editable Name & ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className={`text-[11px] font-semibold ${textSub}`}>Application Name</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border ${border} ${bgInput} ${textBright} text-xs outline-none`}
                />
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] font-semibold ${textSub}`}>Bundle / App ID</label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border ${border} ${bgInput} ${textBright} text-xs outline-none font-mono`}
                />
              </div>
            </div>
          </div>

          {/* Export Packages Card */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${border} ${bgCard} space-y-4 shadow-xs`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold ${textBright} uppercase tracking-wider`}>
                Build & Export Packages
              </h3>
              <span className="text-[11px] text-emerald-400 font-semibold">Ready to Package</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Windows Package */}
              <button
                type="button"
                onClick={handleBuildWindowsPackage}
                disabled={isBuilding}
                className={`p-3.5 rounded-xl border ${border} ${bgInput} hover:border-[#d97757] transition-all text-left flex flex-col justify-between cursor-pointer disabled:opacity-50`}
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#151515] text-[#d97757] border border-[#2b2b2a] flex items-center justify-center mb-2">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <h4 className={`text-xs font-bold ${textBright}`}>Windows .exe</h4>
                  <p className={`text-[10px] ${textSub} mt-0.5`}>Standalone desktop wrapper (.bat + .ps1)</p>
                </div>
                <div className="mt-3 text-[11px] font-semibold text-[#d97757] flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  <span>Build ZIP</span>
                </div>
              </button>

              {/* Android WebAPK */}
              <button
                type="button"
                onClick={handleBuildAndroidPackage}
                disabled={isBuilding}
                className={`p-3.5 rounded-xl border ${border} ${bgInput} hover:border-[#d97757] transition-all text-left flex flex-col justify-between cursor-pointer disabled:opacity-50`}
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#151515] text-[#d97757] border border-[#2b2b2a] flex items-center justify-center mb-2">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h4 className={`text-xs font-bold ${textBright}`}>Android APK</h4>
                  <p className={`text-[10px] ${textSub} mt-0.5`}>PWA WebAPK manifest & service worker</p>
                </div>
                <div className="mt-3 text-[11px] font-semibold text-[#d97757] flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  <span>Build APK</span>
                </div>
              </button>

              {/* Single File HTML */}
              <button
                type="button"
                onClick={handleDownloadStandaloneHtml}
                className={`p-3.5 rounded-xl border ${border} ${bgInput} hover:border-[#d97757] transition-all text-left flex flex-col justify-between cursor-pointer`}
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#151515] text-[#d97757] border border-[#2b2b2a] flex items-center justify-center mb-2">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <h4 className={`text-xs font-bold ${textBright}`}>Single HTML</h4>
                  <p className={`text-[10px] ${textSub} mt-0.5`}>Double-click anywhere to launch app</p>
                </div>
                <div className="mt-3 text-[11px] font-semibold text-[#d97757] flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  <span>Get .html</span>
                </div>
              </button>
            </div>

            {/* Direct Link Banner for Mobile devices */}
            {downloadLink && (
              <div className={`p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs`}>
                <span className="text-emerald-400 font-medium">Download created: {downloadLink.filename}</span>
                <a
                  href={downloadLink.url}
                  download={downloadLink.filename}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Tap to Save</span>
                </a>
              </div>
            )}

            {/* Status alerts */}
            {buildStep && (
              <p className="text-[11px] text-[#d97757] flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>{buildStep}</span>
              </p>
            )}

            {buildSuccess && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>{buildSuccess}</span>
              </p>
            )}

            {errorMsg && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right: Live Sandbox Simulator */}
        <div className={`w-full lg:w-1/2 flex flex-col h-full ${bgCard} overflow-hidden`}>
          {/* Top Device Bar */}
          <div className={`px-4 py-2.5 border-b ${border} flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${textBright}`}>Device Preview</span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {previewDevice === 'desktop' ? `${windowWidth}x${windowHeight}` : '375x760'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className={`flex items-center ${bgInput} rounded-lg p-0.5 border ${border}`}>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1 rounded-md cursor-pointer transition-colors ${
                    previewDevice === 'desktop' ? 'bg-[#d97757] text-white' : textSub
                  }`}
                  title="Desktop Window"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1 rounded-md cursor-pointer transition-colors ${
                    previewDevice === 'mobile' ? 'bg-[#d97757] text-white' : textSub
                  }`}
                  title="Mobile Android APK"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSimReloadKey((k) => k + 1)}
                className={`p-1.5 rounded-lg ${bgInput} border ${border} ${textSub} hover:${textBright} transition-colors cursor-pointer`}
                title="Reload Sandbox"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Simulator Viewport Container */}
          <div className="flex-1 p-3 sm:p-6 bg-[#111111] flex items-center justify-center overflow-auto">
            <div
              className={`h-full bg-black transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl flex flex-col ${
                previewDevice === 'mobile'
                  ? 'w-[375px] max-h-[760px] border-[8px] border-neutral-800'
                  : 'w-full h-full border border-neutral-700'
              }`}
            >
              {/* Simulated Window Titlebar */}
              <div className="h-8 px-3 bg-[#1e1e1e] border-b border-[#2b2b2a] flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <img
                    src={iconDataUrl}
                    alt=""
                    className="w-3.5 h-3.5 rounded object-contain"
                    onError={(e) => {
                      (e.target as any).src = 'https://www.google.com/s2/favicons?domain=google.com&sz=128';
                    }}
                  />
                  <span className="text-[11px] font-semibold text-neutral-300 truncate max-w-[200px]">
                    {appName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-600 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-600 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                </div>
              </div>

              {/* Iframe embed */}
              <div className="flex-1 bg-white relative">
                <iframe
                  key={simReloadKey}
                  src={targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`}
                  title={appName}
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebToNativeTool;
