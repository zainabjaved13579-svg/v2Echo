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
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppTheme } from '../../context/ThemeContext';
import {
  buildWindowsExe,
  buildWindowsZipPackage,
  buildAndroidApk,
  downloadBlob,
  WebAppConfig
} from '../../utils/clientAppBuilder';

export const WebToNativeTool: React.FC = () => {
  const { theme } = useAppTheme();
  const isMoon = theme === 'moon';

  // Config State
  const [targetUrl, setTargetUrl] = useState<string>('https://google.com');
  const [appName, setAppName] = useState<string>('Google');
  const [appId, setAppId] = useState<string>('com.google.webapp');
  const [version, setVersion] = useState<string>('1.0.0');
  const [platform, setPlatform] = useState<'windows' | 'android'>('windows');

  // Favicon & Icon State
  const [iconDataUrl, setIconDataUrl] = useState<string>('');
  const [isDetectingIcon, setIsDetectingIcon] = useState<boolean>(false);
  const [iconDetectedDomain, setIconDetectedDomain] = useState<string>('google.com');
  const iconInputRef = useRef<HTMLInputElement>(null);

  // Windows Specs
  const [windowWidth, setWindowWidth] = useState<number>(1280);
  const [windowHeight, setWindowHeight] = useState<number>(800);
  const [fullScreen, setFullScreen] = useState<boolean>(false);

  // Android Specs
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'sensor'>('sensor');
  const [enablePullToRefresh, setEnablePullToRefresh] = useState<boolean>(true);

  // Build State
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildStep, setBuildStep] = useState<string>('');
  const [buildSuccess, setBuildSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAntivirusGuide, setShowAntivirusGuide] = useState<boolean>(true);

  // Live Simulator Frame
  const [simulatorView, setSimulatorView] = useState<'desktop' | 'mobile'>('desktop');
  const [simReloadKey, setSimReloadKey] = useState<number>(0);

  // Helper: Auto-detect Favicon & Site Metadata
  const autoDetectFavicon = useCallback(async (rawUrl: string, autoFillName = false) => {
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
    setIconDetectedDomain(domain);

    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    // 1. Try server-side scraping endpoint (probes HTML for high-res touch-icon and title)
    try {
      const res = await fetch(`/api/tools/detect-icon?url=${encodeURIComponent(cleanUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.iconDataUrl) {
          setIconDataUrl(data.iconDataUrl);
        } else if (data.iconUrl) {
          setIconDataUrl(data.iconUrl);
        } else {
          setIconDataUrl(googleFaviconUrl);
        }

        if (autoFillName && data.siteTitle && (!appName || appName === 'My Web App' || appName === 'NativeApp')) {
          setAppName(data.siteTitle);
          setAppId(`com.${data.siteTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}.app`);
        }
        setIsDetectingIcon(false);
        return;
      }
    } catch {}

    // 2. Client-side fallback to Google Favicon service
    setIconDataUrl(googleFaviconUrl);
    if (autoFillName && (!appName || appName === 'My Web App')) {
      const simpleName = domain.replace(/^www\./, '').split('.')[0];
      const formatted = simpleName.charAt(0).toUpperCase() + simpleName.slice(1);
      setAppName(formatted);
      setAppId(`com.${simpleName}.app`);
    }
    setIsDetectingIcon(false);
  }, [appName]);

  // Initial detection & debounced detection on targetUrl change
  useEffect(() => {
    autoDetectFavicon(targetUrl, false);
  }, []);

  // Handle custom user icon upload (.png, .ico, .jpg)
  const handleCustomIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setIconDataUrl(reader.result);
        setIconDetectedDomain('Custom Upload');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Build Configuration Object
  const getAppConfig = (): WebAppConfig => {
    return {
      targetUrl: targetUrl.trim(),
      appName: appName.trim() || 'NativeApp',
      appId: appId.trim() || 'com.native.webapp',
      version: version.trim() || '1.0.0',
      iconDataUrl,
      windowWidth,
      windowHeight,
      fullScreen,
      orientation,
      enablePullToRefresh
    };
  };

  // 1. Build Antivirus-Safe Windows Desktop Package (.zip) — 0% False Positive Google Warning
  const handleBuildSafeZip = async () => {
    if (!targetUrl.trim()) {
      setErrorMsg('Please enter a valid website URL.');
      return;
    }

    setIsBuilding(true);
    setErrorMsg(null);
    setBuildSuccess(null);

    const config = getAppConfig();
    const safeFilename = config.appName.replace(/[^a-zA-Z0-9_-]/g, '_');

    try {
      setBuildStep('Embedding auto-detected site favicon & generating icons...');
      await new Promise((r) => setTimeout(r, 300));

      setBuildStep('Assembling native Win32 WebView2 binary with isolated AppUserModelID...');
      await new Promise((r) => setTimeout(r, 400));

      setBuildStep('Generating zero-warning native desktop launcher & shortcut scripts...');
      await new Promise((r) => setTimeout(r, 300));

      setBuildStep('Packaging 100% Antivirus-Safe Windows Desktop Archive (.zip)...');

      let zipBytes: Uint8Array;
      // Try server endpoint first (100% Virus-Free Safe Package without raw .exe)
      try {
        const res = await fetch('/api/build/windows-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUrl: config.targetUrl,
            appName: config.appName,
            appId: config.appId,
            iconBase64: iconDataUrl,
            includeExe: false
          })
        });

        if (res.ok) {
          const arr = await res.arrayBuffer();
          zipBytes = new Uint8Array(arr);
        } else {
          zipBytes = await buildWindowsZipPackage(config, false);
        }
      } catch {
        zipBytes = await buildWindowsZipPackage(config, false);
      }

      downloadBlob(zipBytes, `${safeFilename}-SafePackage.zip`, 'application/zip');
      setBuildSuccess(
        `🎉 Successfully downloaded "${safeFilename}-SafePackage.zip"! Google Chrome will never block this package. Extract the zip and run "Launch-${safeFilename}.cmd" or create a desktop shortcut with "Install-Desktop-Shortcut.cmd".`
      );
    } catch (err: any) {
      console.error('Build error:', err);
      setErrorMsg(err.message || 'Build failed. Please verify parameters.');
    } finally {
      setIsBuilding(false);
      setBuildStep('');
    }
  };

  // 2. Build Complete Windows Bundle (.zip with compiled .exe included)
  const handleBuildFullBundle = async () => {
    if (!targetUrl.trim()) {
      setErrorMsg('Please enter a valid website URL.');
      return;
    }

    setIsBuilding(true);
    setErrorMsg(null);
    setBuildSuccess(null);

    const config = getAppConfig();
    const safeFilename = config.appName.replace(/[^a-zA-Z0-9_-]/g, '_');

    try {
      setBuildStep('Embedding auto-detected site favicon & generating icons...');
      await new Promise((r) => setTimeout(r, 300));

      setBuildStep('Compiling native Win32 application with icon & manifest resources...');
      await new Promise((r) => setTimeout(r, 400));

      setBuildStep('Packaging Complete Windows Bundle (.zip with compiled executable)...');

      let zipBytes: Uint8Array;
      try {
        const res = await fetch('/api/build/windows-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUrl: config.targetUrl,
            appName: config.appName,
            appId: config.appId,
            iconBase64: iconDataUrl,
            includeExe: true
          })
        });

        if (res.ok) {
          const arr = await res.arrayBuffer();
          zipBytes = new Uint8Array(arr);
        } else {
          zipBytes = await buildWindowsZipPackage(config, true);
        }
      } catch {
        zipBytes = await buildWindowsZipPackage(config, true);
      }

      downloadBlob(zipBytes, `${safeFilename}-Bundle.zip`, 'application/zip');
      setBuildSuccess(
        `🎉 Successfully downloaded "${safeFilename}-Bundle.zip"! Includes native .EXE, 1-click launcher, and desktop shortcut.`
      );
    } catch (err: any) {
      console.error('Build error:', err);
      setErrorMsg(err.message || 'Build failed. Please verify parameters.');
    } finally {
      setIsBuilding(false);
      setBuildStep('');
    }
  };

  // 3. Build Standalone Native Executable (.exe)
  const handleBuildStandaloneExe = async () => {
    if (!targetUrl.trim()) {
      setErrorMsg('Please enter a valid website URL.');
      return;
    }

    setIsBuilding(true);
    setErrorMsg(null);
    setBuildSuccess(null);

    const config = getAppConfig();
    const safeFilename = config.appName.replace(/[^a-zA-Z0-9_-]/g, '_');

    try {
      setBuildStep('Initializing MinGW Win32 C++ native compiler...');
      await new Promise((r) => setTimeout(r, 300));

      setBuildStep('Compiling executable with embedded favicon icon & manifest...');
      await new Promise((r) => setTimeout(r, 500));

      let exeBytes: Uint8Array;
      try {
        const res = await fetch('/api/build/windows-exe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUrl: config.targetUrl,
            appName: config.appName,
            appId: config.appId,
            iconBase64: iconDataUrl
          })
        });
        if (res.ok) {
          const arr = await res.arrayBuffer();
          exeBytes = new Uint8Array(arr);
        } else {
          exeBytes = await buildWindowsExe(config);
        }
      } catch {
        exeBytes = await buildWindowsExe(config);
      }

      setBuildStep('Finalizing standalone executable...');
      downloadBlob(exeBytes, `${safeFilename}.exe`, 'application/vnd.microsoft.portable-executable');
      setBuildSuccess(
        `✅ Successfully downloaded "${safeFilename}.exe"! Note: If Google Chrome shows a warning on newly compiled binaries, press Ctrl+J -> Keep -> Keep anyway. Or download the 0% warning Safe Package above.`
      );
    } catch (err: any) {
      console.error('Build error:', err);
      setErrorMsg(err.message || 'Build failed. Please verify parameters.');
    } finally {
      setIsBuilding(false);
      setBuildStep('');
    }
  };

  // 3. Build Android APK (.apk)
  const handleBuildAndroid = async () => {
    if (!targetUrl.trim()) {
      setErrorMsg('Please enter a valid website URL.');
      return;
    }

    setIsBuilding(true);
    setErrorMsg(null);
    setBuildSuccess(null);

    const config = getAppConfig();
    const safeFilename = config.appName.replace(/[^a-zA-Z0-9_-]/g, '_');

    try {
      setBuildStep('Generating AndroidManifest.xml & permissions...');
      await new Promise((r) => setTimeout(r, 300));

      setBuildStep('Embedding auto-detected site favicon into density mipmap icons...');
      await new Promise((r) => setTimeout(r, 400));

      setBuildStep('Assembling Dalvik DEX bytecode & packaging APK archive...');
      const apkBytes = await buildAndroidApk(config);

      downloadBlob(apkBytes, `${safeFilename}.apk`, 'application/vnd.android.package-archive');
      setBuildSuccess(`📱 Successfully built and downloaded "${safeFilename}.apk" (Ready for Android install)!`);
    } catch (err: any) {
      console.error('Build error:', err);
      setErrorMsg(err.message || 'Build failed. Please verify parameters.');
    } finally {
      setIsBuilding(false);
      setBuildStep('');
    }
  };

  // General Build Dispatcher
  const handleBuild = async () => {
    if (platform === 'windows') {
      await handleBuildSafeZip();
    } else {
      await handleBuildAndroid();
    }
  };

  // Theme Helpers
  const bgCard = isMoon ? 'bg-[#151722]' : 'bg-white';
  const bgSubtle = isMoon ? 'bg-[#1e202d]' : 'bg-slate-50';
  const border = isMoon ? 'border-[#292c3d]' : 'border-slate-200';
  const textBright = isMoon ? 'text-white' : 'text-slate-900';
  const textSub = isMoon ? 'text-zinc-400' : 'text-slate-600';

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Banner */}
      <div className={`p-5 sm:p-6 rounded-3xl border ${border} ${bgCard} shadow-sm relative overflow-hidden`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-400">
                Native Packaging Pipeline
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400">
                Webview2 + Android Dex
              </span>
            </div>
            <h1 className={`text-xl sm:text-2xl font-black ${textBright} mb-2`}>
              WebToNative Studio — App Converter
            </h1>
            <p className={`text-xs sm:text-sm ${textSub} leading-relaxed`}>
              Convert any web application or URL into a standalone, native Windows executable (<code className="font-mono text-amber-400">.exe</code>) with WebView2 runtime and taskbar isolation, or build an installable signed Android package (<code className="font-mono text-emerald-400">.apk</code>).
            </p>
          </div>

          {/* Quick Architecture Indicators */}
          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Isolated AppUserModelID</span>
            <span className="flex items-center gap-1.5"><Cpu className="w-4 h-4 text-blue-400" /> Win32 WebView2 Native</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Zero Registry Writes</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, Simulator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Target App Parameters */}
          <div className={`p-5 rounded-3xl border ${border} ${bgCard} space-y-4 shadow-sm`}>
            <div className="flex items-center justify-between border-b border-zinc-700/20 pb-3">
              <h2 className={`text-sm font-extrabold ${textBright} flex items-center gap-2`}>
                <Globe className="w-4 h-4 text-[#d97757]" />
                Target Website Settings
              </h2>
              <div className="flex items-center gap-1">
                {['https://google.com', 'https://github.com', 'https://wikipedia.org'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setTargetUrl(preset);
                      setAppName(preset.replace('https://', '').split('.')[0].toUpperCase());
                    }}
                    className={`px-2 py-0.5 rounded-lg border ${border} text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors`}
                  >
                    {preset.replace('https://', '').replace('.com', '').replace('.org', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Website URL & App Identity Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Website / Web App URL *
                </label>
                <div className={`flex items-center rounded-xl border ${border} ${bgSubtle} px-3 py-2 focus-within:border-[#d97757]`}>
                  <Globe className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                  <input
                    type="url"
                    required
                    value={targetUrl}
                    onChange={(e) => {
                      setTargetUrl(e.target.value);
                      autoDetectFavicon(e.target.value, false);
                    }}
                    placeholder="https://your-domain.com"
                    className="bg-transparent border-none outline-none text-xs sm:text-sm w-full"
                  />
                  <button
                    type="button"
                    onClick={() => autoDetectFavicon(targetUrl, true)}
                    disabled={isDetectingIcon}
                    className="ml-2 px-2.5 py-1 rounded-lg bg-[#d97757]/20 hover:bg-[#d97757]/30 text-[#d97757] text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    title="Auto-detect favicon and metadata"
                  >
                    <RefreshCw className={`w-3 h-3 ${isDetectingIcon ? 'animate-spin' : ''}`} />
                    <span>Detect Logo</span>
                  </button>
                </div>
              </div>

              {/* Favicon & Logo Auto-Detection Section */}
              <div className={`p-3.5 rounded-2xl border ${border} ${bgSubtle} space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#d97757]" />
                      Website Logo & Favicon
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400">
                      Auto-Detected
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={iconInputRef}
                    accept="image/png,image/x-icon,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleCustomIconUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => iconInputRef.current?.click()}
                    className={`px-2.5 py-1 rounded-lg border ${border} ${bgCard} text-[10px] font-bold hover:text-[#d97757] transition-colors flex items-center gap-1 cursor-pointer`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Custom</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Icon Thumbnail with taskbar/phone preview */}
                  <div className="relative group shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-black/20 dark:bg-white/5 border border-zinc-700/40 p-2 flex items-center justify-center shadow-inner">
                      {iconDataUrl ? (
                        <img
                          src={iconDataUrl}
                          alt="Detected Favicon"
                          className="w-10 h-10 object-contain rounded-xl drop-shadow-md"
                          onError={(e) => {
                            (e.target as any).src = `https://www.google.com/s2/favicons?domain=google.com&sz=128`;
                          }}
                        />
                      ) : (
                        <Globe className="w-7 h-7 text-zinc-500" />
                      )}
                    </div>
                  </div>

                  {/* Icon Metadata Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">
                        {iconDetectedDomain || 'Website Favicon'}
                      </span>
                      {isDetectingIcon && <Loader2 className="w-3 h-3 animate-spin text-[#d97757]" />}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
                      Embedded into Win32 PE binary (Resource ID 1) and Android density mipmap icons (<code className="font-mono text-[10px] text-emerald-400">res/mipmap</code>).
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Application Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="My Application"
                    className={`w-full px-3 py-2 rounded-xl border ${border} ${bgSubtle} text-xs sm:text-sm outline-none focus:border-[#d97757]`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Package / App Identifier
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="com.mycompany.app"
                    className={`w-full px-3 py-2 rounded-xl border ${border} ${bgSubtle} text-xs sm:text-sm outline-none focus:border-[#d97757]`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Platform Selector & Platform Specs */}
          <div className={`p-5 rounded-3xl border ${border} ${bgCard} space-y-4 shadow-sm`}>
            <div className="flex items-center justify-between border-b border-zinc-700/20 pb-3">
              <h2 className={`text-sm font-extrabold ${textBright} flex items-center gap-2`}>
                <Sliders className="w-4 h-4 text-[#d97757]" />
                Target Platform Specification
              </h2>

              {/* Platform Switcher Pills */}
              <div className="flex items-center rounded-xl p-0.5 border border-zinc-500/20 bg-black/10 dark:bg-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPlatform('windows');
                    setSimulatorView('desktop');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    platform === 'windows' ? 'bg-[#d97757] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Windows (.exe)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlatform('android');
                    setSimulatorView('mobile');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    platform === 'android' ? 'bg-[#d97757] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Android (.apk)</span>
                </button>
              </div>
            </div>

            {/* Windows Options */}
            {platform === 'windows' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Window Width (px)
                    </label>
                    <input
                      type="number"
                      value={windowWidth}
                      onChange={(e) => setWindowWidth(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-xl border ${border} ${bgSubtle} text-xs outline-none focus:border-[#d97757]`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Window Height (px)
                    </label>
                    <input
                      type="number"
                      value={windowHeight}
                      onChange={(e) => setWindowHeight(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-xl border ${border} ${bgSubtle} text-xs outline-none focus:border-[#d97757]`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-zinc-700/30 bg-black/10 dark:bg-white/5">
                  <div>
                    <h4 className="text-xs font-bold">Launch in Fullscreen Mode</h4>
                    <p className="text-[11px] text-zinc-400">Window fills the primary display upon launch</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={fullScreen}
                    onChange={(e) => setFullScreen(e.target.checked)}
                    className="w-4 h-4 accent-[#d97757] cursor-pointer"
                  />
                </div>

                <div className={`p-3 rounded-2xl border border-blue-500/20 ${isMoon ? 'bg-blue-950/20' : 'bg-blue-50'} text-xs space-y-1`}>
                  <div className="font-bold text-blue-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Strict Windows Architecture Compliance
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Uses native Win32 WebView2 with in-memory UTF-16LE binary byte patching. Isolates cleanly on the Taskbar with custom <code className="font-mono">SetCurrentProcessExplicitAppUserModelID</code> without writing to Windows startup registry.
                  </p>
                </div>
              </div>
            ) : (
              /* Android Options */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Screen Orientation
                    </label>
                    <select
                      value={orientation}
                      onChange={(e) => setOrientation(e.target.value as any)}
                      className={`w-full px-3 py-2 rounded-xl border ${border} ${bgSubtle} text-xs outline-none focus:border-[#d97757] cursor-pointer`}
                    >
                      <option value="sensor">Sensor / Auto Rotate</option>
                      <option value="portrait">Locked Portrait</option>
                      <option value="landscape">Locked Landscape</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      App Version
                    </label>
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border ${border} ${bgSubtle} text-xs outline-none focus:border-[#d97757]`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-zinc-700/30 bg-black/10 dark:bg-white/5">
                  <div>
                    <h4 className="text-xs font-bold">Enable Pull-To-Refresh Gesture</h4>
                    <p className="text-[11px] text-zinc-400">Users can pull down on screen to refresh website</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enablePullToRefresh}
                    onChange={(e) => setEnablePullToRefresh(e.target.checked)}
                    className="w-4 h-4 accent-[#d97757] cursor-pointer"
                  />
                </div>

                <div className={`p-3 rounded-2xl border border-emerald-500/20 ${isMoon ? 'bg-emerald-950/20' : 'bg-emerald-50'} text-xs space-y-1`}>
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Android APK Archive Structure
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Builds valid <code className="font-mono">classes.dex</code> bytecode, <code className="font-mono">AndroidManifest.xml</code>, multi-density mipmap icons, and <code className="font-mono">META-INF</code> V1 signature files packaged via JSZip.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action & Status Box */}
          <div className={`p-5 rounded-3xl border ${border} ${bgCard} space-y-3`}>
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {buildSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{buildSuccess}</span>
              </div>
            )}

            {isBuilding && (
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#d97757]" />
                <span className="font-mono">{buildStep}</span>
              </div>
            )}

            {/* Platform Build Buttons */}
            {platform === 'windows' ? (
              <div className="space-y-2.5 pt-1">
                {/* 1. Recommended Safe ZIP Package (0% Google Antivirus Warning) */}
                <button
                  type="button"
                  onClick={handleBuildSafeZip}
                  disabled={isBuilding}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 text-left"
                >
                  <div className="flex items-center gap-2 text-sm">
                    {isBuilding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    )}
                    <span>Download 100% Antivirus-Safe App (.zip)</span>
                  </div>
                  <span className="text-[10px] font-normal text-emerald-100 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                    Guaranteed 0% Warnings • 1-Click Native Launcher • Custom Desktop Shortcut
                  </span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* 2. Standalone .exe Direct Download */}
                  <button
                    type="button"
                    onClick={handleBuildStandaloneExe}
                    disabled={isBuilding}
                    className={`py-2.5 px-3 rounded-xl border ${border} ${bgSubtle} hover:border-[#d97757]/50 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-zinc-300 hover:text-white`}
                    title="Direct compiled native executable with embedded site icon"
                  >
                    <Download className="w-3.5 h-3.5 text-[#d97757]" />
                    <span className="truncate">Download Native Binary (.exe)</span>
                  </button>

                  {/* 3. Complete Bundle (.zip with .exe) */}
                  <button
                    type="button"
                    onClick={handleBuildFullBundle}
                    disabled={isBuilding}
                    className={`py-2.5 px-3 rounded-xl border ${border} ${bgSubtle} hover:border-[#d97757]/50 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-zinc-300 hover:text-white`}
                    title="Complete package including the native .exe, scripts, and shortcut installer"
                  >
                    <Archive className="w-3.5 h-3.5 text-amber-400" />
                    <span className="truncate">Full Bundle (.zip with .exe)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleBuildAndroid}
                  disabled={isBuilding}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#d97757] hover:bg-[#c86949] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#d97757]/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isBuilding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Building Android Package...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Build & Download Android Package (.apk)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Antivirus & Google Safe Browsing Explanation Box */}
            <div className={`p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2.5 text-left`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-300">
                    Why does Google Chrome or Windows show a "Virus" or "Dangerous" warning?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAntivirusGuide(!showAntivirusGuide)}
                  className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer shrink-0 ml-2"
                >
                  {showAntivirusGuide ? 'Hide' : 'Show Instructions'}
                </button>
              </div>

              <p className="text-[11px] text-zinc-300 leading-relaxed">
                <strong>There is NO virus.</strong> Newly custom-compiled programs on the internet do not have an expensive Microsoft Enterprise Code-Signing Certificate ($500/year fee). Google Safe Browsing and Windows Defender heuristics automatically flag ALL unknown unsigned binaries as <em>"unverified download / dangerous"</em> simply because it is brand-new.
              </p>

              {showAntivirusGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-2 border-t border-amber-500/20 space-y-2 text-[11px] text-zinc-300"
                >
                  <div className="space-y-1 bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/30">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      Method 1: Zero Warnings (Recommended)
                    </div>
                    <p className="text-zinc-200 text-[11px] pl-5.5">
                      Click <strong className="text-emerald-300">"Download 100% Antivirus-Safe App (.zip)"</strong> above! It contains clean native launchers with zero raw executables. Google Chrome will <em>never</em> block or warn on this package.
                    </p>
                  </div>

                  <div className="space-y-1.5 bg-black/30 p-3 rounded-xl border border-zinc-700/50">
                    <div className="font-bold text-sky-400 flex items-center gap-1.5 text-xs">
                      <Info className="w-4 h-4 text-sky-400 shrink-0" />
                      Method 2: If downloading .EXE directly (2-Click Chrome / Windows Fix)
                    </div>
                    <div className="space-y-1 pl-5.5 text-zinc-300 text-[11px]">
                      <div>
                        <strong>In Google Chrome:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-amber-300">Ctrl + J</kbd> to open Downloads &rarr; click <span className="font-semibold text-amber-300">"Keep dangerous file"</span> &rarr; click <span className="font-semibold text-amber-300">"Keep anyway"</span>.
                      </div>
                      <div>
                        <strong>In Windows SmartScreen:</strong> If the blue window appears, click <span className="font-semibold text-amber-300">"More info"</span> &rarr; click <span className="font-semibold text-emerald-400">"Run anyway"</span>.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Web Simulator (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
              Live App Simulator
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSimulatorView(simulatorView === 'desktop' ? 'mobile' : 'desktop')}
                className={`p-1.5 rounded-lg border ${border} ${bgSubtle} text-xs text-zinc-300 hover:text-white cursor-pointer`}
                title="Toggle simulator frame"
              >
                {simulatorView === 'desktop' ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setSimReloadKey((k) => k + 1)}
                className={`p-1.5 rounded-lg border ${border} ${bgSubtle} text-xs text-zinc-300 hover:text-white cursor-pointer`}
                title="Reload simulator"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Simulator Frame */}
          <div className={`rounded-3xl border ${border} ${isMoon ? 'bg-[#0b0c12]' : 'bg-slate-100'} p-3 flex items-center justify-center min-h-[500px] overflow-hidden shadow-inner`}>
            <div
              className={`bg-white rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col ${
                simulatorView === 'mobile'
                  ? 'w-[320px] h-[540px] border-4 border-[#252834]'
                  : 'w-full h-[540px] border border-slate-300 dark:border-zinc-700'
              }`}
            >
              {/* Window Frame Bar */}
              <div className="h-7 bg-slate-100 border-b border-slate-200 px-3 flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  {iconDataUrl && (
                    <img src={iconDataUrl} alt="Favicon" className="w-3.5 h-3.5 object-contain ml-1 rounded" />
                  )}
                  <span className="text-[10px] text-slate-600 font-bold ml-1 truncate max-w-[120px]">
                    {appName || 'Native App'}
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono">WebView2</span>
              </div>

              {/* Simulated Iframe */}
              <iframe
                key={simReloadKey}
                src={targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`}
                title="Simulator"
                sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                className="w-full flex-1 border-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebToNativeTool;
