import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../../firebase';
import { format } from 'date-fns';
import { CheckCircle, User, ClockCircle } from '@solar-icons/react';
import { motion, AnimatePresence } from 'motion/react';

const GYM_ID = 'gympro001';
const ROTATE_INTERVAL = 30;

const generateToken = (ts: number) => {
  const raw = `${GYM_ID}-${ts}-gympro-secret`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) { hash = ((hash << 5) - hash) + raw.charCodeAt(i); hash |= 0; }
  return Math.abs(hash).toString(36).substring(0, 8);
};

export const Kiosk: React.FC = () => {
  const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000));
  const [notifications, setNotifications] = useState<any[]>([]);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const prevCountRef = useRef(0);

  const token = generateToken(timestamp);
  const payload = JSON.stringify({ gymId: GYM_ID, timestamp, token });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(Math.floor(Date.now() / 1000));
    }, ROTATE_INTERVAL * 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for new check-ins in real-time
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const unsub = db.collection('staff_attendance')
      .where('date', '==', today)
      .where('source', '==', 'qr')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .onSnapshot((snap) => {
        const records: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCheckIns(records);
        if (records.length > prevCountRef.current) {
          // New check-in detected
          const newest = records[0];
          setNotifications(prev => [{ id: Date.now(), name: newest.name, time: newest.login_time }, ...prev].slice(0, 20));
          setTimeout(() => setNotifications(prev => prev.slice(0, -1)), 5000);
        }
        prevCountRef.current = records.length;
      });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 md:p-10 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          GYM<span className="text-red-400">PRO</span>
        </h1>
        <p className="text-gray-400 mt-2 text-sm md:text-base font-medium">Scan to check in</p>
      </div>

      {/* QR Code */}
      <div className="relative z-10 bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl shadow-black/30 border border-white/10">
        <div className="absolute -inset-1 bg-gradient-to-br from-red-500/20 to-brand-primary/20 rounded-[3.5rem] blur-xl -z-10" />
        <div className="w-56 h-56 md:w-72 md:h-72 flex items-center justify-center">
          <QRCodeSVG value={payload} size={260} level="M" includeMargin />
        </div>
        <p className="text-center mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
          Refreshes in <span className="text-red-400">{ROTATE_INTERVAL}s</span>
        </p>
      </div>

      {/* Today's count */}
      <div className="relative z-10 mt-8 flex items-center gap-3 text-gray-400 text-sm font-bold">
        <CheckCircle className="w-5 h-5 text-red-400" />
        <span>{checkIns.length} check-ins today</span>
      </div>

      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 w-80 max-w-[calc(100vw-2rem)]">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-white truncate">{n.name}</p>
                  <p className="text-xs font-bold text-red-400 flex items-center gap-1">
                    <ClockCircle className="w-3 h-3" /> {n.time}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-red-400 shrink-0" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
