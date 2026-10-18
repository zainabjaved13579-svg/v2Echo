import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe,
  Monitor,
  Smartphone,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Code2,
  RefreshCw,
  Sliders,
  Check,
  Maximize2,
  Image as ImageIcon,
  Archive,
  Upload,
  Info,
  Zap,
  FolderDown,
  Terminal,
  FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import { useAppTheme } from '../../context/ThemeContext';
import { SAPPHIRE_LEAD_DEVELOPER } from '../../data/constants';

interface AppPreset {
  name: string;
  url: string;
  id: string;
}

const POPULAR_PRESETS: AppPreset[] = [
  { name: 'Linear', url: 'https://linear.app', id: 'app.linear.desktop' },
  { name: 'Notion', url: 'https://notion.so', id: 'so.notion.desktop' },
  { name: 'GitHub', url: 'https://github.com', id: 'com.github.desktop' },
  { name: 'Figma', url: 'https://figma.com', id: 'com.figma.desktop' },
  { name: 'Twitter / X', url: 'https://x.com', id: 'com.twitter.desktop' },
  { name: 'Spotify', url: 'https://open.spotify.com', id: 'com.spotify.desktop' }
];

export const WebToNativeTool: React.FC = () => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  // Config State
  const [targetUrl, setTargetUrl] = useState<string>('https://linear.app');
  const [appName, setAppName] = useState<string>('Linear');
  const [appId, setAppId] = useState<string>('app.linear.desktop');
  const [version, setVersion] = useState<string>('1.0.0');
  const [targetPlatform, setTargetPlatform] = useState<'windows' | 'android'>('windows');

  // Favicon & Icon State
  const [iconDataUrl, setIconDataUrl] = useState<string>('https://www.google.com/s2/favicons?domain=linear.app&sz=128');
  const [isDetectingIcon, setIsDetectingIcon] = useState<boolean>(false);
  const iconInputRef = useRef<HTMLInputElement>(null);

  // Specs
  const [windowWidth, setWindowWidth] = useState<number>(1280);
  const [windowHeight, setWindowHeight] = useState<number>(800);
  const [fullScreen, setFullScreen] = useState<boolean>(false);

  // Build & Feedback State
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildStep, setBuildStep] = useState<string>('');
  const [buildSuccess, setBuildSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Simulator Frame
  const [simulatorDevice, setSimulatorDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [simReloadKey, setSimReloadKey] = useState<number>(0);

  // Theme Tokens (Black & Light Theme, Zero Saturated Blue)
  const bgMain = isMoon ? 'bg-[#090a0f]' : 'bg-[#faf9f7]';
  const bgCard = isMoon ? 'bg-[#12131a]' : 'bg-white';
  const bgInput = isMoon ? 'bg-[#181922]' : 'bg-[#f4f3ef]';
  const border = isMoon ? 'border-[#222430]' : 'border-[#e5e5e0]';
  const textBright = isMoon ? 'text-white' : 'text-zinc-900';
  const textSub = isMoon ? 'text-zinc-400' : 'text-zinc-600';
  const btnPrimary = isMoon
    ? 'bg-white hover:bg-zinc-200 text-black font-bold'
    : 'bg-zinc-900 hover:bg-zinc-800 text-white font-bold';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Instant Smart Autoguess from URL
  const autoDetectAppInfo = useCallback(
    async (rawUrl: string, forceName = false) => {
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

      // Guess clean app name if desired or if default
      if (forceName || !appName || appName === 'Linear' || appName === 'My App') {
        const parts = domain.replace(/^www\./, '').split('.');
        let cleanName = parts[0] || 'App';
        cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        setAppName(cleanName);
        setAppId(`com.${parts[0] || 'webapp'}.desktop`);
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
          if (data.siteTitle && forceName) {
            setAppName(data.siteTitle);
          }
        }
      } catch {}

      setIsDetectingIcon(false);
    },
    [appName]
  );

  // Apply preset
  const handleApplyPreset = (preset: AppPreset) => {
    setTargetUrl(preset.url);
    setAppName(preset.name);
    setAppId(preset.id);
    autoDetectAppInfo(preset.url, false);
    setSimReloadKey((k) => k + 1);
  };

  // Custom Icon Upload
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
      const safeName = appName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const zip = new JSZip();

      // 1. Click-to-Run Batch Script
      const batLauncher = `@echo off
title ${appName}
echo Launching ${appName} Native Desktop Window...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch.ps1"
`;
      zip.file(`Launch-${safeName}.bat`, batLauncher);

      // 2. PowerShell WebView2 Runner Script
      const ps1Launcher = `Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$url = "${cleanTargetUrl}"
$title = "${appName}"

# Launch default browser in standalone app mode
Start-Process "msedge.exe" -ArgumentList "--app=$url --window-size=${windowWidth},${windowHeight}"
`;
      zip.file('launch.ps1', ps1Launcher);

      // 3. Desktop Shortcut Installer (VBScript)
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

      // 4. Standalone Single-File Offline HTML App
      const htmlLauncher = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${appName}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      zip.file('app-launcher.html', htmlLauncher);

      // 5. App Manifest
      const manifest = {
        name: appName,
        short_name: appName,
        start_url: cleanTargetUrl,
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          {
            src: iconDataUrl,
            sizes: '128x128',
            type: 'image/png'
          }
        ]
      };
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `${safeName}-WindowsApp.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(dlUrl);

      setBuildSuccess(`Downloaded "${safeName}-WindowsApp.zip"! Extract and click "Launch-${safeName}.bat"`);
      showToast('Windows Package ready!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Build failed.');
    } finally {
      setIsBuilding(false);
      setBuildStep('');
    }
  };

  // 2. Build Android PWA & WebAPK Package
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
      const safeName = appName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const zip = new JSZip();

      const manifest = {
        name: appName,
        short_name: appName,
        start_url: cleanTargetUrl,
        id: appId,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#12131a',
        theme_color: '#12131a',
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
1. Upload these files to your web server or open 'index.html' on your Android device (Chrome / Brave).
2. Tap the browser menu (3 dots) and tap "Add to Home Screen" or "Install App".
3. The app will launch with dedicated taskbar icon, full-screen standalone window, and zero browser URL bar!`;

      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      zip.file('sw.js', swJs);
      zip.file('INSTALL-ANDROID.md', installInstructions);

      const blob = await zip.generateAsync({ type: 'blob' });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `${safeName}-AndroidPackage.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(dlUrl);

      setBuildSuccess(`Downloaded "${safeName}-AndroidPackage.zip"! Ready for Android installation.`);
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
    const safeName = appName.replace(/[^a-zA-Z0-9_-]/g, '_');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}-StandaloneApp.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded Standalone App');
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${bgMain} font-['Plus_Jakarta_Sans',sans-serif]`}>
      {/* Top Header */}
      <div className={`px-4 sm:px-6 py-3 border-b ${border} ${bgCard} shrink-0`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-white flex items-center justify-center shadow-xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm sm:text-base font-bold ${textBright}`}>
                Url to Native App Builder
              </h2>
              <p className={`text-[11px] ${textSub}`}>
                Instant autoguess logo & title, packaging into standalone Windows & Android apps.
              </p>
            </div>
          </div>

          {/* Quick Popular Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className={`text-[10px] font-semibold ${textSub} shrink-0`}>Presets:</span>
            {POPULAR_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium ${bgInput} ${border} border ${textSub} hover:${textBright} transition-colors shrink-0 cursor-pointer`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Config Form & Live Simulator */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: App Metadata & Build Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className={`p-5 rounded-2xl border ${border} ${bgCard} space-y-4 shadow-xs`}>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Target Website & Identity
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Auto-Detect Enabled
                </span>
              </div>

              {/* Target URL with Autoguess Trigger */}
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold ${textBright} block`}>
                  Website URL
                </label>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${border} ${bgInput}`}>
                  <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type="url"
                    value={targetUrl}
                    onChange={(e) => {
                      setTargetUrl(e.target.value);
                      autoDetectAppInfo(e.target.value, false);
                    }}
                    placeholder="https://example.com"
                    className={`w-full bg-transparent text-xs sm:text-sm font-medium ${textBright} outline-none placeholder:text-zinc-500`}
                  />
                  <button
                    type="button"
                    onClick={() => autoDetectAppInfo(targetUrl, true)}
                    disabled={isDetectingIcon}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
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
                  <div className="w-12 h-12 rounded-xl bg-black/40 border border-zinc-700/60 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
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
                      <Globe className="w-6 h-6 text-zinc-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className={`text-xs font-bold ${textBright} truncate`}>{appName || 'My App'}</h4>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 font-mono">
                        Guessed Logo
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono truncate">{appId}</p>
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
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Upload Icon
                  </button>
                </div>
              </div>

              {/* Editable Name & ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 block">App Name</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-xl border ${border} ${bgInput} text-xs ${textBright} outline-none`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 block">Package ID</label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-xl border ${border} ${bgInput} text-xs font-mono ${textBright} outline-none`}
                  />
                </div>
              </div>

              {/* Target Platform Switcher (Windows vs Android) */}
              <div className="pt-2 border-t border-zinc-800">
                <label className="text-xs font-semibold text-zinc-400 block mb-2">Target Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetPlatform('windows')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      targetPlatform === 'windows'
                        ? 'bg-zinc-800 text-white border-zinc-600'
                        : `${bgInput} ${border} text-zinc-400 hover:text-white`
                    }`}
                  >
                    <Monitor className="w-4 h-4 mb-1" />
                    <p className="font-bold text-xs">Windows Desktop</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Standalone launcher & shortcut</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetPlatform('android')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      targetPlatform === 'android'
                        ? 'bg-zinc-800 text-white border-zinc-600'
                        : `${bgInput} ${border} text-zinc-400 hover:text-white`
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mb-1" />
                    <p className="font-bold text-xs">Android WebAPK</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">PWA standalone package</p>
                  </button>
                </div>
              </div>

              {/* Download Action Buttons */}
              <div className="pt-3 space-y-2">
                {targetPlatform === 'windows' ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleBuildWindowsPackage}
                      disabled={isBuilding}
                      className={`w-full py-2.5 px-4 rounded-xl ${btnPrimary} text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md`}
                    >
                      {isBuilding ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Building Package...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Build & Download Windows App (.zip)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadStandaloneHtml}
                      className="w-full py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Download Single-File HTML Standalone App</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleBuildAndroidPackage}
                    disabled={isBuilding}
                    className={`w-full py-2.5 px-4 rounded-xl ${btnPrimary} text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md`}
                  >
                    {isBuilding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Packaging Android App...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Build & Download Android WebAPK Package</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Success / Error Messages */}
              {buildSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{buildSuccess}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Clean App Simulator (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Interactive Simulator
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSimulatorDevice(simulatorDevice === 'desktop' ? 'mobile' : 'desktop')}
                  className={`p-1.5 rounded-lg border ${border} ${bgInput} text-xs text-zinc-300 hover:text-white cursor-pointer`}
                  title="Toggle Mobile / Desktop Frame"
                >
                  {simulatorDevice === 'desktop' ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSimReloadKey((k) => k + 1)}
                  className={`p-1.5 rounded-lg border ${border} ${bgInput} text-xs text-zinc-300 hover:text-white cursor-pointer`}
                  title="Reload Simulator"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Simulator Frame (Clean, No Clutter) */}
            <div className={`rounded-2xl border ${border} ${isMoon ? 'bg-[#090a0f]' : 'bg-slate-100'} p-3 flex items-center justify-center min-h-[480px] overflow-hidden`}>
              <div
                className={`bg-white rounded-xl overflow-hidden shadow-2xl transition-all duration-200 flex flex-col ${
                  simulatorDevice === 'mobile'
                    ? 'w-[320px] h-[520px] border-4 border-zinc-800'
                    : 'w-full h-[520px] border border-zinc-700/60'
                }`}
              >
                {/* Titlebar */}
                <div className="h-7 bg-zinc-900 border-b border-zinc-800 px-3 flex items-center justify-between shrink-0 select-none text-white">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    {iconDataUrl && (
                      <img src={iconDataUrl} alt="Logo" className="w-3.5 h-3.5 object-contain ml-1 rounded" />
                    )}
                    <span className="text-[10px] text-zinc-200 font-bold ml-1 truncate max-w-[120px]">
                      {appName || 'App'}
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-500 font-mono">Standalone</span>
                </div>

                {/* Live Sandbox Iframe */}
                <iframe
                  key={simReloadKey}
                  src={targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`}
                  title="App Simulator"
                  sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                  className="w-full flex-1 border-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-white text-black text-xs font-bold px-4 py-2 rounded-xl shadow-2xl z-50 animate-fade-in flex items-center gap-2">
          <Check className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default WebToNativeTool;
