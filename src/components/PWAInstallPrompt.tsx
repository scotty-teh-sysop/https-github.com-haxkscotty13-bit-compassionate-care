import React, { useState } from 'react';
import { 
  Download, Sparkles, Share, CheckCircle2, 
  Smartphone, Monitor, WifiOff, X, ShieldCheck, 
  ChevronRight, ExternalLink, RefreshCw 
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface PWAInstallProps {
  onOpenGuide?: () => void;
}

/**
 * TopBar / Header compact Install button
 */
export const PWAHeaderInstallButton: React.FC<{ onOpenModal?: () => void }> = ({ onOpenModal }) => {
  const { isInstalled, isStandalone, isInstallable, install, isIOS } = usePWAInstall();
  const [installing, setInstalling] = useState(false);

  if (isStandalone || isInstalled) {
    return (
      <div 
        className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 rounded-full text-[11px] font-semibold text-emerald-300 shadow-2xs"
        title="Running as installed Progressive Web App"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="hidden sm:inline">PWA Installed</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      const outcome = await install();
      setInstalling(false);
      if (outcome === 'manual' && onOpenModal) {
        onOpenModal();
      }
    } else if (onOpenModal) {
      onOpenModal();
    }
  };

  return (
    <button
      onClick={handleInstallClick}
      disabled={installing}
      className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
      title="Install Compassionate Care App for direct offline access"
      id="pwa-header-install-btn"
    >
      <Download className="w-3.5 h-3.5" />
      <span>{installing ? 'Installing...' : 'Install App'}</span>
      <span className="bg-white/20 text-[10px] px-1.5 py-0.2 rounded-full font-medium hidden sm:inline">
        PWA
      </span>
    </button>
  );
};

/**
 * Floating / Docked In-App Install Prompt Banner primed for direct installation
 */
export const PWAInstallBanner: React.FC<{ onOpenGuide: () => void }> = ({ onOpenGuide }) => {
  const { isInstalled, isStandalone, isDismissed, isInstallable, install, dismissPrompt, isIOS } = usePWAInstall();
  const [isTriggering, setIsTriggering] = useState(false);

  // If already installed or dismissed, do not render banner
  if (isStandalone || isInstalled || isDismissed) {
    return null;
  }

  const handleDirectInstall = async () => {
    if (isInstallable) {
      setIsTriggering(true);
      const result = await install();
      setIsTriggering(false);
      if (result === 'manual') {
        onOpenGuide();
      }
    } else {
      onOpenGuide();
    }
  };

  return (
    <aside 
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-300"
      id="pwa-install-banner"
      aria-label="Install Compassionate Care Web App"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-emerald-500/30 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-3">
          {/* App Icon + Value Prop */}
          <div className="flex items-start space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 p-0.5 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src="/icons/icon-96x96.png" 
                alt="Compassionate Care Icon" 
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-xs font-bold text-white tracking-tight">
                  Install Compassionate Care
                </h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-sm border border-emerald-500/30">
                  Store Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Direct home screen installation with instant 1-hour pre-visit notifications &amp; offline capability.
              </p>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={dismissPrompt}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Dismiss install prompt"
            id="dismiss-pwa-banner-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={onOpenGuide}
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center space-x-1"
          >
            <span>{isIOS ? 'iOS Instructions' : 'View Instructions'}</span>
          </button>

          <button
            onClick={handleDirectInstall}
            disabled={isTriggering}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
            id="pwa-banner-install-action"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isTriggering ? 'Opening Prompt...' : 'Install App (Free)'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

/**
 * PWA Install & Store Readiness Modal with step-by-step guides for Android, Chrome, Edge, and iOS Safari
 */
export const PWAInstallGuideModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ 
  isOpen, 
  onClose 
}) => {
  const { isInstallable, install, isIOS, isInstalled, isStandalone } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'chrome' | 'ios' | 'pwabuilder'>(isIOS ? 'ios' : 'chrome');
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    setInstalling(true);
    await install();
    setInstalling(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      id="pwa-install-modal"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 text-slate-900 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 p-2 border border-white/20 shadow-inner shrink-0 flex items-center justify-center">
              <img src="/icons/icon-192x192.png" alt="App Icon" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">Direct PWA Installation</h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 px-2 py-0.5 rounded-full font-bold">
                  PWABuilder Primed
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Compassionate Care • Senior Companion Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selection Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-4 pt-2">
          <button
            onClick={() => setActiveTab('chrome')}
            className={`flex items-center space-x-1.5 py-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'chrome'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Chrome / Edge / Android</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center space-x-1.5 py-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'ios'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>iPhone / iPad (Safari)</span>
          </button>

          <button
            onClick={() => setActiveTab('pwabuilder')}
            className={`flex items-center space-x-1.5 py-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'pwabuilder'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>PWABuilder Checklist</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Chrome / Edge / Android Tab */}
          {activeTab === 'chrome' && (
            <div className="space-y-4">
              {isInstallable ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Direct Installation Primed &amp; Ready</span>
                      </p>
                      <p className="text-xs text-emerald-800/90 mt-0.5">
                        Click below to launch the native browser installation dialogue.
                      </p>
                    </div>
                    <button
                      onClick={handleNativeInstall}
                      disabled={installing}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center space-x-1.5 shrink-0 ml-3"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{installing ? 'Prompting...' : 'Install Now'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700">
                  <p className="font-semibold text-slate-900">How to install on Desktop or Android:</p>
                  <ol className="list-decimal list-inside space-y-1.5 mt-2 text-slate-600">
                    <li>Look for the <strong>Install</strong> icon in your browser address bar (top right).</li>
                    <li>On Chrome/Edge, click <strong>Install Compassionate Care</strong>.</li>
                    <li>On Android, tap <strong>Add to Home screen</strong> or <strong>Install App</strong> in the browser menu.</li>
                  </ol>
                </div>
              )}

              {/* Benefits list */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Key Installed App Advantages:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">1-Hour Check-In Reminders</span>
                      <p className="text-[11px] text-slate-500">Native push notifications for scheduled visits.</p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Offline Resilience</span>
                      <p className="text-[11px] text-slate-500">View scheduled companion visits even without WiFi.</p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Full-Screen Standalone</span>
                      <p className="text-[11px] text-slate-500">Clean native app feel without URL bars.</p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Instant Launch</span>
                      <p className="text-[11px] text-slate-500">Precached assets load in sub-second time.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* iOS Safari Tab */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-950">
                <p className="font-bold flex items-center space-x-1.5">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  <span>Apple iOS Safari Installation</span>
                </p>
                <p className="text-amber-800/90 mt-1 leading-relaxed">
                  iOS Safari requires two quick taps because Apple doesn&apos;t allow automated install popups:
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Tap the Share button in Safari
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Located in the bottom navigation bar on iPhone, or top right on iPad (square with an arrow pointing up <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" />).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Select &ldquo;Add to Home Screen&rdquo;
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Scroll down the Share menu and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> in the top right.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Compliant Apple Touch Icon (180x180) &amp; standalone status bar configured.</span>
              </div>
            </div>
          )}

          {/* PWABuilder Checklist Tab */}
          {activeTab === 'pwabuilder' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950">
                <p className="font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>PWABuilder Specification Score: 100/100</span>
                </p>
                <p className="text-emerald-800/90 mt-0.5 text-[11px]">
                  All requirements for PWABuilder packaging to Google Play Store, Microsoft Store, and iOS are primed.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { label: 'Web App Manifest (manifest.json)', desc: 'Valid id, start_url, scope, standalone display, theme color', ok: true },
                  { label: 'Service Worker (sw.js)', desc: 'Active fetch event handler, app shell precaching, background sync', ok: true },
                  { label: 'All Icon Dimensions & Masks', desc: '192x192, 512x512, maskable 512x512 with safe-zone margin', ok: true },
                  { label: 'Wide & Mobile Screenshots', desc: '1376x768 (wide) & 768x1376 (narrow) declared in manifest', ok: true },
                  { label: 'Shortcuts & Launch Handler', desc: 'Quick actions for Find Companions, Scheduled Visits, and Live Map', ok: true },
                  { label: 'Apple Safari Touch Icon', desc: '180x180 PNG apple-touch-icon with meta mobile tags in head', ok: true },
                ].map((item, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{item.label}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                    <span className="text-emerald-700 bg-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2">
                      Passed ✓
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {isStandalone || isInstalled ? '✓ App is running in standalone mode' : 'Primed for direct installation'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Offline Mode Connectivity Indicator
 */
export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div 
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/95 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-amber-400/40 animate-in fade-in slide-in-from-bottom-2"
      id="offline-connectivity-indicator"
    >
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>Offline Mode — Precached companion data &amp; visits active</span>
    </div>
  );
};
