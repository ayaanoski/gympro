import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import {
  ClockCircle,
  CheckCircle,
  CloseCircle,
  Calendar,
  Logout,
  History as HistoryIcon
} from '@solar-icons/react';
import { motion, AnimatePresence } from 'motion/react';

export const MemberAttendance: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => { setTimeout(() => setAnimateIn(true), 100); }, []);

  useEffect(() => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');

    const unsubToday = db.collection('staff_attendance')
      .where('user_id', '==', user.uid)
      .where('date', '==', today)
      .onSnapshot((snap) => {
        setTodayRecord(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
      });

    const unsubHistory = db.collection('staff_attendance')
      .where('user_id', '==', user.uid)
      .onSnapshot((snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a: any, b: any) => ((b.date || '') > (a.date || '') ? 1 : -1));
        setHistory(data);
      });

    return () => { unsubToday(); unsubHistory(); };
  }, [user]);

  const handleCheckIn = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await db.collection('staff_attendance').add({
        user_id: user.uid,
        name: userProfile?.name || 'Member',
        role: 'member',
        date: format(new Date(), 'yyyy-MM-dd'),
        login_time: new Date().toLocaleTimeString(),
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    }
    setActionLoading(false);
  };

  const handleCheckOut = async () => {
    if (!user || !todayRecord?.id) return;
    setActionLoading(true);
    try {
      await db.collection('staff_attendance').doc(todayRecord.id).update({
        logout_time: new Date().toLocaleTimeString()
      });
    } catch (err) {
      console.error(err);
    }
    setActionLoading(false);
  };

  const today = format(new Date(), 'dd MMM yyyy');
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = format(d, 'yyyy-MM-dd');
    const hasEntry = history.some((h: any) => h.date === dateStr);
    return { day: weekDays[d.getDay()], date: d.getDate(), active: hasEntry, today: i === 6 };
  });

  return (
    <div className="space-y-6 md:space-y-10 pb-10">
      {/* Header */}
      <div className={`transition-all duration-700 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Attendance</h1>
        <p className="text-gray-500 mt-2 text-sm md:text-lg font-medium">Track your daily gym visits</p>
      </div>

      {/* Weekly Mini Calendar */}
      <div className={`bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-premium transition-all duration-700 delay-100 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-gray-900">This Week</h3>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {history.filter((h: any) => {
              const d = new Date();
              const startOfWeek = new Date(d);
              startOfWeek.setDate(d.getDate() - d.getDay());
              return h.date >= format(startOfWeek, 'yyyy-MM-dd') && h.date <= format(d, 'yyyy-MM-dd');
            }).length} check-ins
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {monthDays.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{d.day}</span>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 ${d.today ? 'ring-2 ring-red-400 ring-offset-2' : ''} ${d.active ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-105' : 'bg-gray-50 text-gray-400'}`}>
                {d.active ? <CheckCircle className="w-5 h-5" /> : d.date}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status + Actions */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 transition-all duration-700 delay-200 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Status Card */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-premium relative overflow-hidden">
          <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-10 transition-all duration-700 ${todayRecord ? 'bg-red-500' : 'bg-gray-300'}`} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl transition-all duration-500 ${todayRecord ? 'bg-pastel-emerald' : 'bg-gray-50'}`}>
                <ClockCircle className={`w-6 h-6 ${todayRecord ? 'text-red-500' : 'text-gray-300'}`} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today &mdash; {today}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {todayRecord ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-red-500" />
                      <p className="text-xl font-black text-gray-900">Checked In</p>
                    </>
                  ) : (
                    <>
                      <CloseCircle className="w-5 h-5 text-gray-300" />
                      <p className="text-xl font-black text-gray-400">Not Checked In</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            {todayRecord && (
              <div className="mt-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-gray-400">Login</span>
                  <span className="text-gray-900">{todayRecord.login_time}</span>
                </div>
                {todayRecord.logout_time && (
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-gray-400">Logout</span>
                    <span className="text-gray-900">{todayRecord.logout_time}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-premium flex flex-col items-center justify-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 transition-all duration-500 ${todayRecord ? 'bg-pastel-emerald' : 'bg-gray-50'}`}>
            <ClockCircle className={`w-10 h-10 ${todayRecord ? 'text-red-500' : 'text-gray-300'}`} />
          </div>

          <AnimatePresence mode="wait">
            {!todayRecord ? (
              <motion.button
                key="checkin"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleCheckIn} disabled={actionLoading}
                className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-base hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
              >
                <ClockCircle className="w-6 h-6 text-red-400" />
                {actionLoading ? 'Checking in...' : 'Check In'}
              </motion.button>
            ) : !todayRecord.logout_time ? (
              <motion.button
                key="checkout"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleCheckOut} disabled={actionLoading}
                className="w-full py-5 bg-red-600 text-white rounded-[1.5rem] font-black text-base hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
              >
                <Logout className="w-6 h-6" />
                {actionLoading ? 'Checking out...' : 'Check Out'}
              </motion.button>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full py-5 bg-pastel-emerald text-red-600 rounded-[1.5rem] border-2 border-red-100 font-black text-base flex items-center justify-center gap-3"
              >
                <CheckCircle className="w-6 h-6" />
                All Done Today
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* History */}
      <div className={`bg-white rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-premium overflow-hidden transition-all duration-700 delay-300 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="p-4 md:p-8 border-b border-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pastel-blue rounded-2xl">
              <HistoryIcon className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">History</h3>
          </div>
          <span className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {history.length} days
          </span>
        </div>
        {history.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {history.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between p-4 md:p-5 hover:bg-gray-50/50 transition-colors gap-4 group">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className={`w-10 md:w-12 h-10 md:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${entry.logout_time ? 'bg-pastel-emerald' : 'bg-pastel-blue'}`}>
                    <Calendar className={`w-5 md:w-6 h-5 md:h-6 ${entry.logout_time ? 'text-red-500' : 'text-brand-primary'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm md:text-base font-black text-gray-900">{entry.date}</p>
                    <p className="text-xs font-bold text-gray-400 flex items-center gap-2 mt-0.5">
                      <span>In: {entry.login_time}</span>
                      {entry.logout_time && <span>Out: {entry.logout_time}</span>}
                    </p>
                  </div>
                </div>
                <span className={`px-3 md:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 ${entry.logout_time
                  ? 'bg-pastel-emerald text-red-500 border border-red-100'
                  : 'bg-pastel-blue text-brand-primary border border-blue-100'
                  }`}>
                  {entry.logout_time ? 'Complete' : 'Active'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 md:py-16">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-200" />
            </div>
            <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No attendance records yet</p>
            <p className="text-xs font-bold text-gray-300 mt-2">Check in today to start tracking</p>
          </div>
        )}
      </div>
    </div>
  );
};
