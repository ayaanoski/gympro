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

const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

const isAndroid = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};

const isDesktop = (): boolean => !isIOS() && !isAndroid();

export const PwaInstallGuide: React.FC<PwaInstallGuideProps> = ({ open, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

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

  const androidSteps: Step[] = [
    { icon: '🌐', title: 'Open in Chrome', desc: 'Open GymPro in Google Chrome browser' },
    { icon: '⋮', title: 'Tap Menu', desc: 'Tap the three-dot menu in the top-right corner' },
    { icon: '🏠', title: 'Add to Home screen', desc: 'Tap "Add to Home screen" or "Install app"' },
    { icon: '✅', title: 'Confirm', desc: 'Tap "Install" — the app will download like an APK' }
  ];

  const iosSteps: Step[] = [
    { icon: '🌐', title: 'Open in Safari', desc: 'Open GymPro in Safari browser (Chrome won\'t work)' },
    { icon: '📤', title: 'Tap Share', desc: 'Tap the Share icon at the bottom of Safari' },
    { icon: '🏠', title: 'Add to Home Screen', desc: 'Scroll down and tap "Add to Home Screen"' },
    { icon: '✅', title: 'Confirm', desc: 'Tap "Add" in the top-right — it installs as a headless PWA' }
  ];

  const desktopSteps: Step[] = [
    { icon: '🌐', title: 'Open in Chrome/Edge', desc: 'Open GymPro in Chrome or Edge browser' },
    { icon: '⬇️', title: 'Click Install', desc: deferredPrompt
      ? 'Click the install icon in the address bar'
      : 'Click the install icon in the address bar (⋮ → Install GymPro Management)'
    },
    { icon: '✅', title: 'Confirm', desc: 'Click "Install" — it runs as its own window (EXE-like)' }
  ];

  const steps = isIOS() ? iosSteps : isAndroid() ? androidSteps : desktopSteps;
  const platform = isIOS() ? 'iOS' : isAndroid() ? 'Android' : 'Desktop';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 pb-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
                  <span className="text-lg">📲</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Install GymPro</h2>
                  <p className="text-xs font-bold text-gray-400">{platform} guide</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <CloseCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Steps */}
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl shrink-0 ring-1 ring-gray-100">
                      {step.icon}
                    </div>
                    <div className="min-w-0 pt-1">
                      <p className="text-sm font-black text-gray-900">{i + 1}. {step.title}</p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Direct Install Button (Android/Desktop) */}
              {deferredPrompt && !installed && (
                <button
                  onClick={handleInstall}
                  className="w-full py-4 bg-red-600 text-white rounded-[1.5rem] font-black text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
                >
                  ⬇️ Install GymPro Now
                </button>
              )}

              {installed && (
                <div className="p-4 bg-pastel-emerald rounded-2xl border border-red-100 text-center">
                  <p className="text-sm font-black text-red-600">✓ GymPro is installed on your device!</p>
                </div>
              )}

              {/* Tip */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/50">
                <p className="text-xs font-bold text-amber-700">
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
