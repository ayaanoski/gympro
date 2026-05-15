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
  Phone
} from '@solar-icons/react';

export const MemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const [memberData, setMemberData] = useState<any>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [trainer, setTrainer] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
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

    return () => unsubMember();
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

    const today = format(new Date(), 'yyyy-MM-dd');
    const unsubAttendance = db.collection('staff_attendance')
      .where('user_id', '==', user!.uid)
      .where('date', '==', today)
      .onSnapshot((snap) => {
        setAttendance(snap.docs.map(d => d.data()));
      });

    return () => { unsubWorkout(); unsubDiet(); unsubAttendance(); };
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

  return (
    <div className="space-y-4 md:space-y-8 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-pastel-indigo to-pastel-blue rounded-[2rem] md:rounded-[3rem] p-5 md:p-10 border border-gray-100 shadow-premium">
        <h1 className="text-xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Welcome, {memberData.name}</h1>
        <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-lg font-medium">Your fitness journey at a glance</p>
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
                onClick={() => window.open(workoutPlan.image_url, '_blank')}
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
        {dietPlan?.description ? (
          <div className="p-3 md:p-5 bg-gray-50/50 rounded-2xl">
            <p className="text-sm font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">{dietPlan.description}</p>
          </div>
        ) : (
          <div className="text-center py-8 md:py-12 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
            <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No diet plan yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
