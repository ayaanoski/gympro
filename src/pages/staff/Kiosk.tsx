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
  const prevCountRef = useRef(-1); // -1 = not initialized yet

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
    // Use a simple query that works without composite indexes —
    // filter by source and sort client-side
    const unsub = db.collection('staff_attendance')
      .where('date', '==', today)
      .onSnapshot((snap) => {
        const allRecords: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const records = allRecords
          .filter((r: any) => r.source === 'qr')
          .sort((a: any, b: any) => ((b.timestamp || '') > (a.timestamp || '') ? 1 : -1))
          .slice(0, 10);
        setCheckIns(records);

        // Skip notification on initial load
        if (prevCountRef.current === -1) {
          prevCountRef.current = records.length;
          return;
        }

        if (records.length > prevCountRef.current) {
          const newest = records[0];
          const msg = newest.role === 'member'
            ? `${newest.name} checked in — have a nice workout!`
            : `Hello ${newest.name} — have a nice day!`;
          setNotifications(prev => [{ id: Date.now(), name: newest.name, role: newest.role, photo: newest.photo, time: newest.login_time, message: msg }, ...prev].slice(0, 20));
          setTimeout(() => setNotifications(prev => prev.slice(0, -1)), 5000);
        }
        prevCountRef.current = records.length;
      }, (err) => {
        console.error('Kiosk attendance listener error:', err);
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
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 w-[90vw] max-w-md pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }}
              className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 shadow-2xl shadow-black/20 pointer-events-auto overflow-hidden"
            >
              {/* Accent glow bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500/60 via-red-400/40 to-transparent" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-white/10">
                  {n.photo ? (
                    <img src={n.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-500/30 to-red-400/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-red-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-white truncate leading-tight">{n.message}</p>
                  <p className="text-xs font-bold text-red-400/80 flex items-center gap-1.5 mt-1">
                    <ClockCircle className="w-3 h-3" /> {n.time}
                  </p>
                </div>
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 text-red-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
