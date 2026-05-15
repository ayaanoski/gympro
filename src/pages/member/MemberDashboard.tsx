import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import {
  User,
  Dumbbell,
  ClockCircle,
  CheckCircle,
  CloseCircle,
  FileText,
  Phone,
  GraphUp,
  Logout
} from '@solar-icons/react';
import { ImageViewer } from '../../components/ImageViewer';

export const MemberDashboard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [memberData, setMemberData] = useState<any>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [trainer, setTrainer] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [viewerSrc, setViewerSrc] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubMember = db.collection('members')
      .where('auth_uid', '==', user.uid)
      .limit(1)
      .onSnapshot(async (snap) => {
        if (snap.empty) { setLoading(false); return; }
        const doc = snap.docs[0];
        const data: any = { id: doc.id, ...doc.data() };
        setMemberData(data);
        setMemberId(doc.id);
        setLoading(false);

        if (data.trainer_id) {
          db.collection('users').doc(data.trainer_id).get().then((t) => {
            if (t.exists) setTrainer({ id: t.id, ...t.data() });
          });
        }
      });

    const today = format(new Date(), 'yyyy-MM-dd');
    const unsubToday = db.collection('staff_attendance')
      .where('user_id', '==', user.uid)
      .where('date', '==', today)
      .onSnapshot((snap) => {
        setTodayRecord(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
      });

    return () => { unsubMember(); unsubToday(); };
  }, [user]);

  // Separate effect — needs memberId (Firestore doc id, NOT auth uid)
  useEffect(() => {
    if (!memberId) return;

    const unsubWorkout = db.collection('workout_plans')
      .where('member_id', '==', memberId)
      .limit(1)
      .onSnapshot((snap) => {
        setWorkoutPlan(snap.empty ? null : snap.docs[0].data());
      });

    const unsubDiet = db.collection('diet_plans')
      .where('member_id', '==', memberId)
      .limit(1)
      .onSnapshot((snap) => {
        setDietPlan(snap.empty ? null : snap.docs[0].data());
      });

    const unsubProgress = db.collection('progress')
      .where('member_id', '==', memberId)
      .onSnapshot((snap) => {
        const data = snap.docs.map(d => d.data());
        data.sort((a: any, b: any) => ((b.date || '') > (a.date || '') ? 1 : -1));
        setProgress(data.slice(0, 5));
      });

    const today = format(new Date(), 'yyyy-MM-dd');
    const unsubAttendance = db.collection('staff_attendance')
      .where('user_id', '==', user!.uid)
      .where('date', '==', today)
      .onSnapshot((snap) => {
        setAttendance(snap.docs.map(d => d.data()));
      });

    return () => { unsubWorkout(); unsubDiet(); unsubProgress(); unsubAttendance(); };
  }, [memberId, user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!memberData) return (
    <div className="flex items-center justify-center min-h-[300px] p-8 text-center">
      <p className="text-gray-400 font-black text-base md:text-lg">No membership data found. Contact your gym.</p>
    </div>
  );

  const daysLeft = memberData.expiry_date
    ? Math.max(0, Math.ceil((new Date(memberData.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;

  const handleCheckIn = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await db.collection('staff_attendance').add({
        user_id: user.uid, name: userProfile?.name || 'Member', role: 'member',
        date: format(new Date(), 'yyyy-MM-dd'), login_time: new Date().toLocaleTimeString(),
        timestamp: new Date().toISOString()
      });
    } catch (err) { console.error(err); }
    setActionLoading(false);
  };

  const handleCheckOut = async () => {
    if (!user || !todayRecord?.id) return;
    setActionLoading(true);
    try {
      await db.collection('staff_attendance').doc(todayRecord.id).update({
        logout_time: new Date().toLocaleTimeString()
      });
    } catch (err) { console.error(err); }
    setActionLoading(false);
  };

  return (
    <div className="space-y-4 md:space-y-8 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-pastel-indigo to-pastel-blue rounded-[2rem] md:rounded-[3rem] p-5 md:p-10 border border-gray-100 shadow-premium">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Welcome, {memberData.name}</h1>
            <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-lg font-medium">Your fitness journey at a glance</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!todayRecord ? (
              <button onClick={handleCheckIn} disabled={actionLoading}
                className="flex items-center gap-2 bg-gray-900 text-white px-5 md:px-7 py-3 md:py-4 rounded-[1.5rem] font-black text-sm hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95 disabled:opacity-50">
                <ClockCircle className="w-5 h-5 text-red-400" />
                {actionLoading ? '...' : 'Check In'}
              </button>
            ) : !todayRecord.logout_time ? (
              <button onClick={handleCheckOut} disabled={actionLoading}
                className="flex items-center gap-2 bg-red-600 text-white px-5 md:px-7 py-3 md:py-4 rounded-[1.5rem] font-black text-sm hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-50">
                <Logout className="w-5 h-5" />
                {actionLoading ? '...' : 'Check Out'}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-5 md:px-7 py-3 md:py-4 bg-white/80 text-red-600 rounded-[1.5rem] border border-red-100 font-black text-sm backdrop-blur-sm">
                <CheckCircle className="w-5 h-5" />
                Done
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Membership Status */}
      <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-premium">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Membership</p>
          <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${memberData.status === 'active' ? 'bg-pastel-emerald text-red-500 border border-red-100' : 'bg-pastel-pink text-pink-500 border border-pink-100'}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${memberData.status === 'active' ? 'bg-red-500' : 'bg-pink-500'}`} />
            {memberData.status}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="p-3 md:p-4 bg-gray-50/50 rounded-2xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</p>
            <p className="text-sm md:text-lg font-black text-gray-900 mt-0.5 truncate">{memberData.membership_plan || 'N/A'}</p>
          </div>
          <div className="p-3 md:p-4 bg-gray-50/50 rounded-2xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expires</p>
            <p className="text-sm md:text-lg font-black text-gray-900 mt-0.5">{memberData.expiry_date || 'N/A'}</p>
          </div>
          <div className="p-3 md:p-4 bg-gray-50/50 rounded-2xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Days Left</p>
            <p className={`text-sm md:text-lg font-black mt-0.5 ${isExpiringSoon ? 'text-orange-500' : daysLeft === 0 ? 'text-pink-500' : 'text-gray-900'}`}>
              {daysLeft > 0 ? `${daysLeft}d` : 'Expired'}
            </p>
          </div>
          <div className="p-3 md:p-4 bg-gray-50/50 rounded-2xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</p>
            <p className="text-sm md:text-lg font-black text-gray-900 mt-0.5 capitalize truncate">{memberData.category || 'Normal'}</p>
          </div>
        </div>
      </div>

      {/* Trainer + Attendance Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-premium flex items-center gap-4 md:gap-6">
          <div className="w-12 md:w-14 h-12 md:h-14 bg-pastel-indigo rounded-2xl flex items-center justify-center shrink-0">
            <User className="w-6 md:w-7 h-6 md:h-7 text-brand-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Trainer</p>
            <p className="text-base md:text-xl font-black text-gray-900 truncate">{trainer?.name || memberData.trainer_name || 'Not Assigned'}</p>
            {(trainer?.phone) && (
              <p className="text-xs font-bold text-gray-400 mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {trainer.phone}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-premium flex items-center gap-4 md:gap-6">
          <div className={`w-12 md:w-14 h-12 md:h-14 rounded-2xl flex items-center justify-center shrink-0 ${attendance.length > 0 ? 'bg-pastel-emerald' : 'bg-gray-50'}`}>
            <ClockCircle className={`w-6 md:w-7 h-6 md:h-7 ${attendance.length > 0 ? 'text-red-500' : 'text-gray-300'}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today</p>
            <div className="flex items-center gap-2">
              {attendance.length > 0 ? (
                <>
                  <CheckCircle className="w-4 md:w-5 h-4 md:h-5 text-red-500 shrink-0" />
                  <p className="text-base md:text-xl font-black text-gray-900">Checked In</p>
                </>
              ) : (
                <>
                  <CloseCircle className="w-4 md:w-5 h-4 md:h-5 text-gray-300 shrink-0" />
                  <p className="text-base md:text-xl font-black text-gray-400">Not Yet</p>
                </>
              )}
            </div>
            {attendance.length > 0 && (
              <p className="text-xs font-bold text-gray-400 mt-0.5">At {attendance[0]?.login_time}</p>
            )}
          </div>
        </div>
      </div>

      {/* Workout Plan */}
      <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-premium">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="p-2 md:p-3 bg-pastel-purple rounded-2xl border border-red-100">
            <Dumbbell className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
          </div>
          <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Workout Plan</h3>
        </div>
        {workoutPlan?.description || workoutPlan?.image_url ? (
          <div className="space-y-3 md:space-y-4">
            {workoutPlan.description && (
              <div className="p-3 md:p-5 bg-gray-50/50 rounded-2xl">
                <p className="text-sm font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">{workoutPlan.description}</p>
              </div>
            )}
            {workoutPlan.image_url && (
              <img
                src={workoutPlan.image_url}
                alt="Workout"
                className="w-full max-h-64 object-contain rounded-2xl border border-gray-200 bg-gray-50 cursor-pointer"
                onClick={() => { setViewerSrc(workoutPlan.image_url); setViewerOpen(true); }}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-8 md:py-12 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
            <Dumbbell className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No workout plan yet</p>
          </div>
        )}
      </div>

      {/* Diet Plan */}
      <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-premium">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="p-2 md:p-3 bg-pastel-emerald rounded-2xl border border-red-100">
            <FileText className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
          </div>
          <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Diet Plan</h3>
        </div>
        {dietPlan?.description || dietPlan?.image_url ? (
          <div className="space-y-3 md:space-y-4">
            {dietPlan.description && (
              <div className="p-3 md:p-5 bg-gray-50/50 rounded-2xl">
                <p className="text-sm font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">{dietPlan.description}</p>
              </div>
            )}
            {dietPlan.image_url && (
              <img src={dietPlan.image_url} alt="Diet" className="w-full max-h-64 object-contain rounded-2xl border border-gray-200 bg-gray-50 cursor-pointer" onClick={() => { setViewerSrc(dietPlan.image_url); setViewerOpen(true); }} />
            )}
          </div>
        ) : (
          <div className="text-center py-8 md:py-12 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
            <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No diet plan yet</p>
          </div>
        )}
      </div>

      {/* Latest Progress */}
      <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-premium">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="p-2 md:p-3 bg-pastel-blue rounded-2xl border border-red-100">
            <GraphUp className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
          </div>
          <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Latest Progress</h3>
        </div>
        {progress.length > 0 ? (
          <div className="space-y-3 md:space-y-4">
            {progress.map((log: any, i: number) => (
              <div key={i} className="p-3 md:p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <p className="text-xs font-black text-gray-400 uppercase">{log.date}</p>
                  {log.weight && <p className="text-sm md:text-base font-black text-red-600">{log.weight} KG</p>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {log.height && <p className="text-xs font-bold text-gray-500">Height: {log.height} CM</p>}
                  {log.body_fat && <p className="text-xs font-bold text-gray-500">Body Fat: {log.body_fat}%</p>}
                </div>
                {log.notes && <p className="text-xs font-bold text-gray-400 mt-1 line-clamp-2">{log.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 md:py-12 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
            <GraphUp className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No progress logged yet</p>
          </div>
        )}
      </div>
      {/* Image Viewer */}
      <ImageViewer src={viewerSrc} open={viewerOpen} onClose={() => setViewerOpen(false)} />
    </div>
  );
};
