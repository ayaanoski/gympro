import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CloseCircle } from '@solar-icons/react';

interface PwaInstallGuideProps {
  open: boolean;
  onClose: () => void;
}

type Step = {
  icon: string;
  title: string;
  desc: string;
};

type Platform = 'android' | 'ios' | 'desktop';

const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

const isAndroid = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};

const detectPlatform = (): Platform => {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  return 'desktop';
};

const platforms: { key: Platform; label: string; icon: string }[] = [
  { key: 'android', label: 'Android', icon: '🤖' },
  { key: 'ios', label: 'iPhone', icon: '📱' },
  { key: 'desktop', label: 'Desktop', icon: '💻' },
];

const tabIcons: Record<Platform, string> = {
  android: 'Chrome',
  ios: 'Safari',
  desktop: 'Browser',
};

export const PwaInstallGuide: React.FC<PwaInstallGuideProps> = ({ open, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [selected, setSelected] = useState<Platform>(detectPlatform());

  useEffect(() => {
    setSelected(detectPlatform());
  }, [open]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const allSteps: Record<Platform, Step[]> = {
    android: [
      { icon: '🌐', title: 'Open in Chrome', desc: 'Open GymPro in Google Chrome browser' },
      { icon: '⋮', title: 'Tap Menu', desc: 'Tap the three-dot menu in the top-right corner' },
      { icon: '🏠', title: 'Add to Home screen', desc: 'Tap "Add to Home screen" or "Install app"' },
      { icon: '✅', title: 'Confirm', desc: 'Tap "Install" — the app downloads like an APK' },
    ],
    ios: [
      { icon: '🌐', title: 'Open in Safari', desc: 'Open GymPro in Safari (Chrome won\'t work)' },
      { icon: '📤', title: 'Tap Share', desc: 'Tap the Share icon at the bottom of Safari' },
      { icon: '🏠', title: 'Add to Home Screen', desc: 'Scroll down and tap "Add to Home Screen"' },
      { icon: '✅', title: 'Confirm', desc: 'Tap "Add" in the top-right — installs as headless PWA' },
    ],
    desktop: [
      { icon: '🌐', title: 'Open in Chrome/Edge', desc: 'Open GymPro in Chrome or Edge browser' },
      {
        icon: '⬇️',
        title: 'Click Install',
        desc: deferredPrompt
          ? 'Click the install icon in the address bar'
          : 'Click the install icon in the address bar (⋮ → Install GymPro Management)',
      },
      { icon: '✅', title: 'Confirm', desc: 'Click "Install" — runs in its own window' },
    ],
  };

  const steps = allSteps[selected];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-t-3xl sm:rounded-[2rem] w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl sm:mx-4"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-50">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                  <span className="text-base sm:text-lg">📲</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 truncate">Install GymPro</h2>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 capitalize">{tabIcons[selected]} guide</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl transition-all shrink-0">
                <CloseCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              </button>
            </div>

            {/* Platform Toggle */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-2">
              <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
                {platforms.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setSelected(p.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black transition-all ${
                      selected === p.key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span className="text-sm sm:text-base">{p.icon}</span>
                    <span className="sm:inline">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="p-4 sm:p-6 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3 sm:gap-4 items-start">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-50 rounded-lg sm:rounded-xl flex items-center justify-center text-base sm:text-xl shrink-0 ring-1 ring-gray-100">
                    {step.icon}
                  </div>
                  <div className="min-w-0 pt-0.5 sm:pt-1">
                    <p className="text-xs sm:text-sm font-black text-gray-900 break-words">{i + 1}. {step.title}</p>
                    <p className="text-[11px] sm:text-xs font-medium text-gray-500 mt-0.5 leading-snug break-words">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
              {/* Direct Install Button */}
              {deferredPrompt && !installed && (
                <button
                  onClick={handleInstall}
                  className="w-full py-3.5 sm:py-4 bg-red-600 text-white rounded-[1.25rem] sm:rounded-[1.5rem] font-black text-xs sm:text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
                >
                  ⬇️ Install GymPro Now
                </button>
              )}

              {installed && (
                <div className="p-3 sm:p-4 bg-pastel-emerald rounded-xl sm:rounded-2xl border border-red-100 text-center">
                  <p className="text-xs sm:text-sm font-black text-red-600">✓ GymPro is installed on your device!</p>
                </div>
              )}

              {/* Tip */}
              <div className="p-3 sm:p-4 bg-amber-50 rounded-xl sm:rounded-2xl border border-amber-200/50">
                <p className="text-[11px] sm:text-xs font-bold text-amber-700 leading-relaxed">
                  💡 Tip: Once installed, GymPro works offline for cached pages and loads faster each time. Your session stays synced when you reconnect.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
