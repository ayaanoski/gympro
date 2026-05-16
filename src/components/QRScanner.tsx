import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CloseCircle, CheckCircle, DangerTriangle } from '@solar-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  role: 'member' | 'staff' | 'trainer';
}

const GYM_ID = 'gympro001';

const generateToken = (ts: number) => {
  const raw = `${GYM_ID}-${ts}-gympro-secret`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) { hash = ((hash << 5) - hash) + raw.charCodeAt(i); hash |= 0; }
  return Math.abs(hash).toString(36).substring(0, 8);
};

export const QRScanner: React.FC<QRScannerProps> = ({ open, onClose, role }) => {
  const { user, userProfile } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'scanning' | 'success' | 'error'>('scanning');
  const [message, setMessage] = useState('');
  const scanTimerRef = useRef<number>(0);
  const scanningRef = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);

  const stopCamera = () => {
    scanningRef.current = false;
    setCameraReady(false);
    if (scanTimerRef.current) { clearTimeout(scanTimerRef.current); scanTimerRef.current = 0; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) { stopCamera(); setStatus('scanning'); setMessage(''); return; }

    let cancelled = false;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // Poll until video is ready
        const waitForVideo = () => {
          if (cancelled) return;
          if (videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
            setCameraReady(true);
            startScanLoop();
          } else {
            setTimeout(waitForVideo, 200);
          }
        };
        waitForVideo();
      } catch (err: any) {
        if (cancelled) return;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setStatus('error');
          setMessage('Camera access was denied. Please allow camera permissions in your browser settings, then try again.');
        } else if (err.name === 'NotFoundError') {
          setStatus('error');
          setMessage('No camera found on this device.');
        } else {
          setStatus('error');
          setMessage('Could not access camera. Make sure you are on a secure HTTPS connection.');
        }
      }
    };

    const startScanLoop = async () => {
      try {
        const { default: jsQR } = await import('jsqr');
        scanningRef.current = true;
        const loop = () => {
          if (!scanningRef.current || cancelled) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas) { scanTimerRef.current = window.setTimeout(loop, 300); return; }
          const width = video.videoWidth;
          const height = video.videoHeight;
          if (!width || !height) { scanTimerRef.current = window.setTimeout(loop, 300); return; }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { scanTimerRef.current = window.setTimeout(loop, 300); return; }
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
          if (code && !cancelled) {
            processScan(code.data);
          } else {
            scanTimerRef.current = window.setTimeout(loop, 400);
          }
        };
        loop();
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('QR scanner failed to load. Please try again.');
        }
      }
    };

    const processScan = async (payload: string) => {
      scanningRef.current = false;
      if (scanTimerRef.current) { clearTimeout(scanTimerRef.current); scanTimerRef.current = 0; }
      try {
        const data = JSON.parse(payload);
        if (data.gymId !== GYM_ID) { setStatus('error'); setMessage('Invalid QR code'); return; }
        const now = Math.floor(Date.now() / 1000);
        const age = now - data.timestamp;
        if (age > 35) { setStatus('error'); setMessage('QR code expired. Scan the latest one.'); return; }
        if (age < -5) { setStatus('error'); setMessage('Invalid QR code'); return; }
        if (data.token !== generateToken(data.timestamp)) { setStatus('error'); setMessage('Invalid QR code'); return; }
        if (!user) { setStatus('error'); setMessage('Not authenticated'); return; }

        const personName = userProfile?.name || user?.displayName || 'Unknown';
        const personPhoto = user.photoURL || '';
        // If member and no auth photo, look up from members collection
        let photoUrl = personPhoto;
        if (!photoUrl && role === 'member') {
          try {
            const memberSnap = await db.collection('members').where('auth_uid', '==', user.uid).limit(1).get();
            if (!memberSnap.empty) {
              photoUrl = memberSnap.docs[0].data().photo || '';
            }
          } catch { /* ignore */ }
        }
        await db.collection('staff_attendance').add({
          user_id: user.uid, name: personName, role,
          date: format(new Date(), 'yyyy-MM-dd'), login_time: new Date().toLocaleTimeString(),
          timestamp: new Date().toISOString(), source: 'qr', photo: photoUrl || ''
        });
        setStatus('success');
        if (role === 'member') {
          setMessage(`Welcome ${personName}, have a great workout! 💪`);
        } else {
          const hour = new Date().getHours();
          const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
          setMessage(`${greeting}, ${personName}! Have a nice day!`);
        }
        setTimeout(() => { if (!cancelled) onClose(); }, 2000);
      } catch {
        setStatus('error'); setMessage('Invalid QR code format');
      }
    };

    init();
    return () => { cancelled = true; stopCamera(); };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { stopCamera(); onClose(); } }}
        >
          <button onClick={() => { stopCamera(); onClose(); }} className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
            <CloseCircle className="w-8 h-8 text-white" />
          </button>

          {status === 'scanning' && (
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-900">
                {!cameraReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400">
                    <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-bold">Starting camera...</span>
                  </div>
                )}
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${cameraReady ? '' : 'invisible'}`} />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-[3px] border-red-400/60 rounded-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-56 md:h-56 border-2 border-red-400/40 rounded-2xl pointer-events-none" />
              </div>
              {cameraReady && (
                <div className="flex items-center gap-3 text-white">
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-bold">Point at the QR code...</span>
                </div>
              )}
              <p className="text-gray-400 text-xs font-medium text-center max-w-xs">Scan the QR code displayed at the gym reception kiosk</p>
            </div>
          )}

          {status === 'success' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-red-400" />
              </div>
              <p className="text-xl font-black text-white">{message}</p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-4 max-w-sm text-center">
              <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center">
                <DangerTriangle className="w-12 h-12 text-red-400" />
              </div>
              <p className="text-lg font-black text-white">{message}</p>
              <button onClick={() => { stopCamera(); onClose(); }} className="px-6 py-3 bg-white text-gray-900 rounded-[1.5rem] font-black text-sm hover:bg-gray-100 transition-all mt-2">
                Close
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
