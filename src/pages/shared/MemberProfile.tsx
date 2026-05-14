import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sharedService } from '../../services/sharedService';
import {
  Phone,
  Calendar,
  User,
  Dumbbell,
  GraphUp,
  History,
  Pen,
  Refresh,
  ChatRoundDots,
  AltArrowLeft,
  AddCircle,
  CloseCircle,
  Card,
  Dollar
} from '@solar-icons/react';
import { openWhatsApp, whatsAppTemplates } from '../../utils/whatsapp';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { staffService } from '../../services/staffService';
import { trainerService } from '../../services/trainerService';
import { adminService } from '../../services/adminService';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

export const MemberProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isTrainer, isAdmin, isStaff } = useAuth();
  const [member, setMember] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [renewalData, setRenewalData] = useState({
    plan_name: '',
    amount: 0,
    payment_method: 'Cash'
  });
  const [logData, setLogData] = useState({
    weight: '',
    body_fat: '',
    notes: ''
  });
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [trainers, setTrainers] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    let unsubscribeMember: () => void;
    let unsubscribePayments: () => void;
    let unsubscribeProgress: () => void;
    let unsubscribeWorkout: () => void;
    let unsubscribeTrainers: () => void;

    const setupListeners = async () => {
      try {
        // Member Data
        unsubscribeMember = db.collection('members').doc(id).onSnapshot((doc) => {
          if (doc.exists) {
            setMember({ id: doc.id, ...doc.data() });
          } else {
            navigate('/members');
          }
          setLoading(false);
        });

        // Payments
        unsubscribePayments = db.collection('payments')
          .where('member_id', '==', id)
          .onSnapshot((snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setPayments(data);
          });

        // Progress
        unsubscribeProgress = db.collection('progress')
          .where('member_id', '==', id)
          .onSnapshot((snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setProgress(data);
          });

        // Workout Plan
        unsubscribeWorkout = db.collection('workout_plans')
          .where('member_id', '==', id)
          .limit(1)
          .onSnapshot((snap) => {
            if (!snap.empty) {
              const data = snap.docs[0].data();
              setWorkoutPlan({ id: snap.docs[0].id, ...data });
              setWorkoutDescription(data.description || '');
            } else {
              setWorkoutPlan(null);
              setWorkoutDescription('');
            }
          });

        adminService.getPlans(setPlans);

        if (isAdmin || isStaff) {
          unsubscribeTrainers = adminService.getUsers((users) => {
            setTrainers(users.filter(u => u.role === 'trainer' && u.active));
          });
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      unsubscribeMember?.();
      unsubscribePayments?.();
      unsubscribeProgress?.();
      unsubscribeWorkout?.();
      unsubscribeTrainers?.();
    };
  }, [id, navigate, isAdmin, isStaff]);

  const handleUpdateTrainer = async (trainerId: string) => {
    if (!id || !member) return;
    const selectedTrainer = trainers.find(t => t.id === trainerId);
    try {
      await db.collection('members').doc(id).update({
        trainer_id: trainerId,
        trainer_name: selectedTrainer?.name || 'Not Assigned'
      });
    } catch (err) {
      console.error(err);
      alert('Failed to update Mentor');
    }
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !member) return;
    setActionLoading(true);
    try {
      const selectedPlan = plans.find(p => p.plan_name === renewalData.plan_name);
      const newExpiry = new Date(member.expiry_date);
      const baseDate = new Date() > newExpiry ? new Date() : newExpiry;

      if (selectedPlan) {
        if (selectedPlan.duration_unit === 'months') {
          baseDate.setMonth(baseDate.getMonth() + selectedPlan.duration);
        } else {
          baseDate.setDate(baseDate.getDate() + selectedPlan.duration);
        }
      }

      await staffService.renewMembership(id, {
        ...renewalData,
        member_name: member.name,
        new_expiry: baseDate.toISOString().split('T')[0]
      });

      openWhatsApp(member.phone, whatsAppTemplates.renewal(member.name, renewalData.plan_name, baseDate.toISOString().split('T')[0]));
      setIsRenewModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(`Renewal Failed: ${err.message || 'Database error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setActionLoading(true);
    try {
      await trainerService.addProgressLog(id, logData);
      openWhatsApp(member.phone, whatsAppTemplates.progress(member.name, logData.weight, logData.body_fat, logData.notes));
      setIsLogModalOpen(false);
      setLogData({ weight: '', body_fat: '', notes: '' });
    } catch (err: any) {
      console.error(err);
      alert(`Log Append Failed: ${err.message || 'Database error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setActionLoading(true);
    try {
      await trainerService.updateWorkoutPlan(id, { description: workoutDescription });
      setIsWorkoutModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(`Protocol Update Failed: ${err.message || 'Database error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!member) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-pastel-pink/20 rounded-[3rem] border border-pink-100">
      <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mb-6">
        <CloseCircle className="w-10 h-10 text-pink-500" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Subject Not Located</h2>
      <p className="text-gray-500 font-bold max-w-xs uppercase text-[10px] tracking-widest">The member identity does not exist in the current grid</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-10 font-sans">
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center gap-3 text-gray-400 hover:text-brand-primary transition-all font-black uppercase text-[10px] tracking-widest"
      >
        <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:bg-pastel-indigo group-hover:border-brand-primary/20 transition-all">
          <AltArrowLeft className="w-5 h-5" />
        </div>
        Return to Directory
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-premium text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-pastel-indigo to-pastel-blue opacity-30" />

            <div className="relative mt-4">
              <div className="w-40 h-40 bg-white p-2 rounded-full mx-auto mb-8 shadow-xl relative group-hover:scale-105 transition-transform duration-500">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white">
                  {member.photo ? (
                    <img src={member.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-pastel-indigo flex items-center justify-center text-brand-primary text-5xl font-black">
                      {member.name[0]}
                    </div>
                  )}
                </div>
                <div className={`absolute bottom-2 right-2 w-8 h-8 rounded-full border-4 border-white shadow-lg ${member.status === 'active' ? 'bg-red-500' : 'bg-pink-500'}`} />
              </div>

              <h2 className="text-3xl font-black text-gray-900 tracking-tight">{member.name}</h2>
              <div className="mt-2 inline-flex items-center px-4 py-1.5 bg-gray-50 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">
                {member.member_id || 'GYM-CORE-IDENTITY'}
              </div>

              <div className="flex justify-center gap-4 mt-10">
                <button
                  onClick={() => openWhatsApp(member.phone, whatsAppTemplates.checkIn(member.name))}
                  className="p-4 bg-pastel-emerald text-red-600 rounded-[1.5rem] hover:scale-110 transition-all shadow-sm border border-red-100"
                  title="Secure Data Bridge"
                >
                  <ChatRoundDots className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setIsLogModalOpen(true)}
                  className="p-4 bg-pastel-blue text-red-600 rounded-[1.5rem] hover:scale-110 transition-all shadow-sm border border-red-100"
                  title="Append Progress Log"
                >
                  <AddCircle className="w-6 h-6" />
                </button>
                {!isTrainer && (
                  <button
                    onClick={() => setIsRenewModalOpen(true)}
                    className="p-4 bg-pastel-orange text-orange-600 rounded-[1.5rem] hover:scale-110 transition-all shadow-sm border border-orange-100"
                    title="Cycle Renewal"
                  >
                    <Refresh className="w-6 h-6" />
                  </button>
                )}
              </div>

              <div className="mt-10 pt-8 border-t border-gray-50 space-y-5 text-left">
                <div className="flex items-center gap-4 group/item">
                  <div className="p-2.5 bg-gray-50 rounded-xl group-hover/item:bg-pastel-blue transition-colors">
                    <Phone className="w-5 h-5 text-gray-400 group-hover/item:text-red-500" />
                  </div>
                  <span className="text-sm font-black text-gray-600 tracking-tight">{member.phone}</span>
                </div>
                <div className="flex items-center gap-4 group/item">
                  <div className="p-2.5 bg-gray-50 rounded-xl group-hover/item:bg-pastel-indigo transition-colors">
                    <Calendar className="w-5 h-5 text-gray-400 group-hover/item:text-brand-primary" />
                  </div>
                  <span className="text-sm font-black text-gray-600 tracking-tight">Activated: {member.start_date}</span>
                </div>
                <div className="flex items-center gap-4 group/item">
                  <div className="p-2.5 bg-gray-50 rounded-xl group-hover/item:bg-pastel-purple transition-colors">
                    <User className="w-5 h-5 text-gray-400 group-hover/item:text-red-500" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-black text-gray-600 tracking-tight block">Mentor: {member.trainer_name || 'Autonomous'}</span>
                    {(isAdmin || isStaff) && (
                      <select
                        value={member.trainer_id || ''}
                        onChange={(e) => handleUpdateTrainer(e.target.value)}
                        className="mt-2 w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-500 focus:bg-white transition-all outline-none"
                      >
                        <option value="">Assign Mentor</option>
                        {trainers.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-premium relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-10 transition-transform duration-700 group-hover:scale-150 ${member.status === 'active' ? 'bg-red-500' : 'bg-pink-500'}`} />
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Phase Status</h3>
            <div className={`p-6 rounded-[2rem] border-2 ${member.status === 'active' ? 'bg-pastel-emerald/30 border-red-100' : 'bg-pastel-pink/30 border-pink-100'}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${member.status === 'active' ? 'text-red-500' : 'text-pink-500'}`}>
                {member.status === 'active' ? 'Operational' : 'Phase Expired'}
              </p>
              <p className="text-xl font-black text-gray-900">Term Ends: {member.expiry_date}</p>
            </div>
            <p className="mt-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center px-4 py-2 bg-gray-50 rounded-full inline-block">Plan: {member.membership_plan}</p>
          </div>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-2 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Workout Plan */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-premium group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-pastel-purple rounded-2xl border border-red-100">
                    <Dumbbell className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Workout Protocol</h3>
                </div>
                <button
                  onClick={() => setIsWorkoutModalOpen(true)}
                  className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline px-4 py-2 bg-pastel-indigo/30 rounded-full"
                >
                  Optimize
                </button>
              </div>
              {workoutPlan?.description ? (
                <div className="p-6 bg-gray-50/50 rounded-2xl border border-transparent group-hover:bg-white group-hover:shadow-md group-hover:border-gray-100 transition-all">
                  <p className="text-sm font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {workoutPlan.description}
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                  <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No active protocols</p>
                </div>
              )}
            </div>

            {/* Progress Tracking */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-premium group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-pastel-emerald rounded-2xl border border-red-100">
                    <GraphUp className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Growth Metrics</h3>
                </div>
                <button onClick={() => setIsLogModalOpen(true)} className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline px-4 py-2 bg-pastel-emerald/30 rounded-full">Append Log</button>
              </div>
              {progress.length > 0 ? (
                <div className="space-y-5">
                  {progress.slice(0, 3).map((log, i) => (
                    <div key={i} className="p-5 border-l-4 border-red-500 bg-pastel-emerald/10 rounded-r-2xl relative overflow-hidden">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{log.date}</p>
                        <p className="text-lg font-black text-red-600">{log.weight} KG</p>
                      </div>
                      <p className="text-xs font-bold text-gray-600 line-clamp-2">{log.notes || 'Steady progress maintained in current phase'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                  <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No metrics recorded</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment History */}
          {!isTrainer && (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden">
              <div className="p-8 border-b border-gray-50/50 flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-pastel-blue rounded-2xl border border-red-100">
                    <History className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Transactional History</h3>
                </div>
                <span className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {payments.length} TOTAL LOGS
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-gray-50/50">
                      <th className="px-8 py-6 font-black">Timeline</th>
                      <th className="px-8 py-6 font-black">Contract Phase</th>
                      <th className="px-8 py-6 font-black">Capital Units</th>
                      <th className="px-8 py-6 font-black">Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/50">
                    {payments.length > 0 ? payments.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-8 py-6 text-sm font-black text-gray-400">{p.date}</td>
                        <td className="px-8 py-6 text-sm font-black text-gray-900">{p.plan_name || 'Protocol Renewal'}</td>
                        <td className="px-8 py-6 text-base font-black text-red-500">₹{p.amount}</td>
                        <td className="px-8 py-6">
                          <span className="px-4 py-1.5 bg-pastel-blue/30 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100/50">
                            {p.method}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-8 py-16 text-center">
                          <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No capital events</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Renew Modal */}
      <AnimatePresence>
        {isRenewModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRenewModalOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 border border-white/50"
            >
              <div className="mb-10 text-center">
                <div className="w-20 h-20 bg-pastel-orange rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Refresh className="w-10 h-10 text-orange-600" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Plan Renewal</h2>
                <p className="text-gray-400 font-bold mt-1 uppercase text-[10px] tracking-widest">Extend Member Access</p>
              </div>

              <form onSubmit={handleRenew} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Select Plan</label>
                  <select
                    required
                    value={renewalData.plan_name}
                    onChange={e => {
                      const plan = plans.find(p => p.plan_name === e.target.value);
                      setRenewalData({
                        ...renewalData,
                        plan_name: e.target.value,
                        amount: plan ? plan.price : 0
                      });
                    }}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                  >
                    <option value="">Choose a Plan</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.plan_name}>{p.plan_name} - ₹{p.price}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Total Fee (₹)</label>
                  <input
                    type="number" required
                    value={renewalData.amount}
                    readOnly
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none font-bold text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Payment Method</label>
                  <select
                    value={renewalData.payment_method}
                    onChange={e => setRenewalData({ ...renewalData, payment_method: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsRenewModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-[1.5rem] font-black text-sm hover:bg-gray-200 transition-all font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-2 py-4 bg-brand-primary text-white rounded-[1.5rem] font-black text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50"
                  >
                    {actionLoading ? 'Renewing...' : 'Renew Membership'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Progress Log Modal */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogModalOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 border border-white/50"
            >
              <div className="mb-10 text-center">
                <div className="w-20 h-20 bg-pastel-emerald rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <GraphUp className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Growth Protocol</h2>
                <p className="text-gray-400 font-bold mt-1 uppercase text-[10px] tracking-widest">Append Physical Metrics</p>
              </div>

              <form onSubmit={handleAddLog} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Mass (KG)</label>
                    <input
                      type="number" step="0.1" required
                      value={logData.weight}
                      onChange={e => setLogData({ ...logData, weight: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Body Fat (%)</label>
                    <input
                      type="number" step="0.1"
                      value={logData.body_fat}
                      onChange={e => setLogData({ ...logData, body_fat: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Observation Notes</label>
                  <textarea
                    value={logData.notes}
                    onChange={e => setLogData({ ...logData, notes: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 h-32 resize-none"
                    placeholder="Document growth trends..."
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsLogModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-[1.5rem] font-black text-sm hover:bg-gray-200 transition-all font-black"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-2 py-4 bg-red-600 text-white rounded-[1.5rem] font-black text-sm hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 disabled:opacity-50"
                  >
                    {actionLoading ? 'LOGGING...' : 'AUTHORIZE LOG'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Workout Protocol Modal */}
      <AnimatePresence>
        {isWorkoutModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWorkoutModalOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 border border-white/50"
            >
              <div className="mb-10 text-center">
                <div className="w-20 h-20 bg-pastel-purple rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Dumbbell className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Workout Protocol</h2>
                <p className="text-gray-400 font-bold mt-1 uppercase text-[10px] tracking-widest">Optimize Training Strategy</p>
              </div>

              <form onSubmit={handleUpdateWorkout} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Protocol Description</label>
                  <textarea
                    required
                    value={workoutDescription}
                    onChange={e => setWorkoutDescription(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 h-64 resize-none"
                    placeholder="Define sets, reps, and exercise progression..."
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsWorkoutModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-[1.5rem] font-black text-sm hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-2 py-4 bg-brand-primary text-white rounded-[1.5rem] font-black text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50"
                  >
                    {actionLoading ? 'UPDATING...' : 'SAVE PROTOCOL'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
