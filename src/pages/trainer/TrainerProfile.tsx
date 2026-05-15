import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { trainerService } from '../../services/trainerService';
import { format } from 'date-fns';
import {
  ClockCircle,
  CheckCircle,
  CloseCircle,
  Calendar,
  Logout,
  Upload,
  Eye,
  QrCode
} from '@solar-icons/react';
import { ImageViewer } from '../../components/ImageViewer';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const TrainerProfile: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewerSrc, setViewerSrc] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
        setHistory(data.slice(0, 20));
      });

    const unsubProfile = db.collection('users').doc(user.uid).onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        setQrCode(data?.qr_code || '');
      }
    });

    return () => { unsubToday(); unsubHistory(); unsubProfile(); };
  }, [user]);

  const handleCheckIn = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await trainerService.markAttendance(user.uid, userProfile?.name || user.displayName || 'Trainer');
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

  const uploadQR = async (file: File) => {
    if (!user) return;
    if (!CLOUD_NAME || !UPLOAD_PRESET) { alert('Cloudinary not configured'); return; }
    if (file.size > 3 * 1024 * 1024) { alert('File must be less than 3 MB'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);
      fd.append('api_key', API_KEY);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.secure_url) {
        await db.collection('users').doc(user.uid).update({ qr_code: data.secure_url });
        setQrCode(data.secure_url);
      } else {
        alert('Upload failed');
      }
    } catch {
      alert('Upload error');
    }
    setUploading(false);
  };

  return (
    <div className="space-y-6 md:space-y-10 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">My Profile</h1>
        <p className="text-gray-500 mt-2 text-sm md:text-lg font-medium">{userProfile?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Attendance Card */}
        <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-premium">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 md:p-3 bg-pastel-blue rounded-2xl border border-red-100">
              <ClockCircle className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Today's Attendance</h3>
          </div>

          <div className="flex items-center justify-between p-4 md:p-6 bg-gray-50/50 rounded-2xl border border-gray-100 mb-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
              <div className="flex items-center gap-2 mt-1">
                {todayRecord ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-red-500" />
                    <p className="text-lg font-black text-gray-900">Checked In</p>
                  </>
                ) : (
                  <>
                    <CloseCircle className="w-5 h-5 text-gray-300" />
                    <p className="text-lg font-black text-gray-400">Not Checked In</p>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today</p>
              <p className="text-sm font-black text-gray-900 mt-1">{format(new Date(), 'dd MMM yyyy')}</p>
            </div>
          </div>

          <div className="flex gap-3">
            {!todayRecord ? (
              <button onClick={handleCheckIn} disabled={actionLoading}
                className="flex-1 py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-sm hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                <ClockCircle className="w-5 h-5 text-red-400" />
                {actionLoading ? 'Checking in...' : 'Check In'}
              </button>
            ) : !todayRecord.logout_time ? (
              <button onClick={handleCheckOut} disabled={actionLoading}
                className="flex-1 py-4 bg-red-600 text-white rounded-[1.5rem] font-black text-sm hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                <Logout className="w-5 h-5" />
                {actionLoading ? 'Checking out...' : 'Check Out'}
              </button>
            ) : (
              <div className="flex-1 py-4 bg-pastel-emerald text-red-600 rounded-[1.5rem] border border-red-100 font-black text-sm flex items-center justify-center gap-3">
                <CheckCircle className="w-5 h-5" />
                <span>Done for today</span>
              </div>
            )}
          </div>

          {todayRecord && (
            <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-500 flex items-center justify-between">
              <span>Login: {todayRecord.login_time}</span>
              {todayRecord.logout_time && <span>Logout: {todayRecord.logout_time}</span>}
            </div>
          )}
        </div>

        {/* QR Code Card */}
        <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-premium">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 md:p-3 bg-pastel-purple rounded-2xl border border-red-100">
              <QrCode className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Payment QR Code</h3>
          </div>

          <p className="text-sm font-bold text-gray-400 mb-4 leading-relaxed">
            Upload your bank QR code so clients can scan and pay you directly.
          </p>

          <input type="file" ref={fileRef} accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadQR(file);
            e.target.value = '';
          }} className="hidden" />

          <div className="flex flex-col items-center">
            {qrCode ? (
              <div className="relative group w-full max-w-xs mx-auto">
                <img src={qrCode} alt="QR Code"
                  className="w-full aspect-square object-contain rounded-2xl border-2 border-gray-100 bg-white p-2 cursor-pointer shadow-md"
                  onClick={() => { setViewerSrc(qrCode); setViewerOpen(true); }} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-2xl transition-all flex items-center justify-center">
                  <button onClick={() => fileRef.current?.click()}
                    className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg font-black text-xs text-gray-700 transition-all">
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()}
                className="w-full max-w-xs aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-all group">
                {uploading ? (
                  <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform mb-3">
                      <Upload className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-sm font-black text-gray-500">Upload QR Code</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Max 3 MB</p>
                  </>
                )}
              </div>
            )}
          </div>

          {qrCode && (
            <div className="flex gap-3 mt-6">
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-[1.5rem] font-black text-xs hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Change
              </button>
              <button onClick={() => { setViewerSrc(qrCode); setViewerOpen(true); }}
                className="flex-1 py-3 bg-pastel-blue text-red-600 rounded-[1.5rem] font-black text-xs hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                View
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-premium overflow-hidden">
        <div className="p-4 md:p-8 border-b border-gray-50/50">
          <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Attendance History</h3>
        </div>
        {history.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {history.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between p-4 md:p-5 hover:bg-gray-50/50 transition-colors gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${entry.logout_time ? 'bg-pastel-emerald' : 'bg-pastel-blue'}`}>
                    <Calendar className={`w-5 h-5 ${entry.logout_time ? 'text-red-500' : 'text-brand-primary'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900">{entry.date}</p>
                    <p className="text-xs font-bold text-gray-400 flex items-center gap-2 mt-0.5">
                      <span>In: {entry.login_time}</span>
                      {entry.logout_time && <span>Out: {entry.logout_time}</span>}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 ${entry.logout_time ? 'bg-pastel-emerald text-red-500' : 'bg-pastel-blue text-brand-primary'}`}>
                  {entry.logout_time ? 'Complete' : 'Active'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 md:py-16">
            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No attendance records yet</p>
          </div>
        )}
      </div>

      {/* Image Viewer */}
      <ImageViewer src={viewerSrc} open={viewerOpen} onClose={() => setViewerOpen(false)} />
    </div>
  );
};
