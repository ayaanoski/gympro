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
import { openWhatsApp } from '../../utils/whatsapp';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { staffService } from '../../services/staffService';
import { trainerService } from '../../services/trainerService';
import { adminService } from '../../services/adminService';
import { db } from '../../firebase';

export const MemberProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
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

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const memberDoc = await sharedService.getMemberById(id);
        if (!memberDoc.exists) {
          navigate('/members');
          return;
        }
        setMember({ id: memberDoc.id, ...memberDoc.data() });

        const paymentsSnap = await sharedService.getMemberPayments(id);
        setPayments(paymentsSnap.docs.map(doc => doc.data()));

        const progressSnap = await sharedService.getMemberProgress(id);
        setProgress(progressSnap.docs.map(doc => doc.data()));

        const workoutSnap = await sharedService.getMemberWorkoutPlan(id);
        if (!workoutSnap.empty) {
          setWorkoutPlan(workoutSnap.docs[0].data());
        }

        adminService.getPlans(setPlans);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

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

      openWhatsApp(member.phone, `Hi ${member.name}, your membership has been successfully renewed for ${renewalData.plan_name}! New expiry date: ${baseDate.toISOString().split('T')[0]}. Thank you!`);

      setIsRenewModalOpen(false);
      // Refresh member data
      const memberDoc = await sharedService.getMemberById(id);
      setMember({ id: memberDoc.id, ...memberDoc.data() });
    } catch (err) {
      console.error(err);
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
      setIsLogModalOpen(false);
      setLogData({ weight: '', body_fat: '', notes: '' });
      // Refresh progress
      const progressSnap = await sharedService.getMemberProgress(id);
      setProgress(progressSnap.docs.map(doc => doc.data()));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;
  if (!member) return <div className="p-8 text-center text-red-600">Member not found</div>;

  return (
    <div className="space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <AltArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
            <div className="w-32 h-32 bg-gray-100 rounded-full mx-auto mb-6 overflow-hidden border-4 border-white shadow-lg">
              {member.photo ? (
                <img src={member.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl font-bold">
                  {member.name[0]}
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{member.name}</h2>
            <p className="text-gray-500 mb-6">{member.member_id || 'ID: GYM-001'}</p>
            
            <div className="flex justify-center gap-3 mb-8">
              <button 
                onClick={() => openWhatsApp(member.phone, `Hi ${member.name}, how are you?`)}
                className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors"
                title="WhatsApp Message"
              >
                <ChatRoundDots className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setIsLogModalOpen(true)}
                className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors"
                title="Add Progress Log"
              >
                <AddCircle className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setIsRenewModalOpen(true)}
                className="p-3 bg-orange-50 text-orange-600 rounded-2xl hover:bg-orange-100 transition-colors"
                title="Renew Membership"
              >
                <Refresh className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{member.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Joined: {member.start_date}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Trainer: {member.trainer_name || 'Not Assigned'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Membership Status</h3>
            <div className={`p-4 rounded-2xl mb-4 ${member.status === 'active' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${member.status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>
                {member.status}
              </p>
              <p className="text-lg font-bold text-gray-900">Expires: {member.expiry_date}</p>
            </div>
            <p className="text-sm text-gray-500">Plan: {member.membership_plan}</p>
          </div>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tabs-like structure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Workout Plan */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-bold">Workout Plan</h3>
                </div>
                <button className="text-xs font-bold text-emerald-600 hover:underline">Update</button>
              </div>
              {workoutPlan ? (
                <div className="space-y-3">
                  {workoutPlan.exercises.slice(0, 4).map((ex: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{ex.exercise_name}</p>
                        <p className="text-xs text-gray-500">{ex.day}</p>
                      </div>
                      <p className="text-xs font-bold text-gray-600">{ex.sets} x {ex.reps}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No workout plan assigned</p>
              )}
            </div>

            {/* Progress Tracking */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <GraphUp className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold">Progress</h3>
                </div>
                <button className="text-xs font-bold text-emerald-600 hover:underline">Add Log</button>
              </div>
              {progress.length > 0 ? (
                <div className="space-y-4">
                  {progress.slice(0, 3).map((log, i) => (
                    <div key={i} className="p-3 border-l-4 border-emerald-500 bg-emerald-50/30 rounded-r-xl">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-bold text-gray-500">{log.date}</p>
                        <p className="text-sm font-bold text-emerald-600">{log.weight} kg</p>
                      </div>
                      <p className="text-xs text-gray-600">{log.notes}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No progress records found</p>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold">Payment History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-50">
                    <th className="pb-4 font-medium">Date</th>
                    <th className="pb-4 font-medium">Plan</th>
                    <th className="pb-4 font-medium">Amount</th>
                    <th className="pb-4 font-medium">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.length > 0 ? payments.map((p, i) => (
                    <tr key={i}>
                      <td className="py-4 text-sm text-gray-600">{p.date}</td>
                      <td className="py-4 text-sm text-gray-900 font-medium">{p.plan_name || 'Renewal'}</td>
                      <td className="py-4 text-sm font-bold text-emerald-600">₹{p.amount}</td>
                      <td className="py-4 text-sm text-gray-500">{p.method}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">No payment history</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Renew Membership</h2>
                <button onClick={() => setIsRenewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <CloseCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleRenew} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Plan</label>
                  <select 
                    required
                    value={renewalData.plan_name}
                    onChange={e => setRenewalData({...renewalData, plan_name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">Select a plan</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.plan_name}>{p.plan_name} - ₹{p.price}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
                  <input 
                    type="number" required
                    value={renewalData.amount}
                    onChange={e => setRenewalData({...renewalData, amount: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select 
                    value={renewalData.payment_method}
                    onChange={e => setRenewalData({...renewalData, payment_method: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsRenewModalOpen(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                  >
                    {actionLoading ? 'Renewing...' : 'Renew Now'}
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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Add Progress Log</h2>
                <button onClick={() => setIsLogModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <CloseCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddLog} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <input 
                      type="number" step="0.1" required
                      value={logData.weight}
                      onChange={e => setLogData({...logData, weight: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body Fat (%)</label>
                    <input 
                      type="number" step="0.1"
                      value={logData.body_fat}
                      onChange={e => setLogData({...logData, body_fat: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea 
                    value={logData.notes}
                    onChange={e => setLogData({...logData, notes: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                    placeholder="Progress notes..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsLogModalOpen(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                  >
                    {actionLoading ? 'Saving...' : 'Save Log'}
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
