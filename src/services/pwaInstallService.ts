/**
 * PWA Install & Offline Download Service for Sapphire
 * Captures native beforeinstallprompt and enables 1-click app installation.
 */

let deferredInstallPrompt: any = null;
const listeners = new Set<(canInstall: boolean) => void>();

// Check if running in standalone PWA mode
export function isPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function initPwaInstallListener(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent default mini-infobar on mobile Chrome
    e.preventDefault();
    deferredInstallPrompt = e;
    notifyListeners(true);
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    notifyListeners(false);
  });
}

function notifyListeners(canInstall: boolean): void {
  listeners.forEach((cb) => {
    try {
      cb(canInstall);
    } catch {}
  });
}

export function subscribePwaInstallState(callback: (canInstall: boolean) => void): () => void {
  listeners.add(callback);
  callback(Boolean(deferredInstallPrompt));
  return () => {
    listeners.delete(callback);
  };
}

export function canPromptPwaInstall(): boolean {
  return Boolean(deferredInstallPrompt);
}

/**
 * Triggers native PWA install prompt.
 * If unsupported or already installed, returns false or opens fallback guidance.
 */
export async function promptPwaInstall(): Promise<{ outcome: 'accepted' | 'dismissed' | 'unsupported' | 'already-installed' }> {
  if (isPwaInstalled()) {
    return { outcome: 'already-installed' };
  }

  if (!deferredInstallPrompt) {
    // Check if on iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      alert('To install Sapphire on iOS:\n1. Tap the Share button in Safari (box with arrow up).\n2. Scroll down and tap "Add to Home Screen".');
      return { outcome: 'unsupported' };
    }

    // Chrome/Edge/Firefox desktop without active deferred prompt: show notification or download HTML
    return { outcome: 'unsupported' };
  }

  try {
    deferredInstallPrompt.prompt();
    const choiceResult = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    notifyListeners(false);
    return { outcome: choiceResult.outcome };
  } catch (err) {
    console.warn('PWA install prompt error:', err);
    return { outcome: 'unsupported' };
  }
}

/**
 * Standalone offline HTML download for users who want to run Sapphire locally without server
 */
export function downloadOfflinePwaPackage(): void {
  const offlineHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sapphire Studio - Offline App</title>
  <style>
    body { margin: 0; background: #191817; color: #ede8e1; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; }
    .card { background: #201f1d; border: 1px solid #33312e; padding: 2rem; border-radius: 1.5rem; max-width: 420px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .btn { display: inline-block; margin-top: 1.5rem; background: #d97757; color: #fff; padding: 0.75rem 1.5rem; border-radius: 0.75rem; text-decoration: none; font-weight: 600; font-size: 0.875rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #f5f2eb; }
    p { font-size: 0.875rem; color: #a19e97; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <img src="https://i.ibb.co/q37Fs0hH/cropped-circle-image-1.png" width="64" height="64" style="border-radius: 1rem; margin-bottom: 1rem;" />
    <h1>Sapphire Studio</h1>
    <p>Sapphire Progressive Web Application standalone launcher.</p>
    <a href="${window.location.origin}" class="btn" target="_blank">Launch Sapphire Online</a>
  </div>
</body>
</html>`;

  const blob = new Blob([offlineHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Sapphire-Studio-App.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
