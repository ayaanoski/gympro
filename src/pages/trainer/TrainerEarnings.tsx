import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Dollar, AddCircle, CloseCircle, Calendar, User } from '@solar-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export const TrainerEarnings: React.FC = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feeData, setFeeData] = useState({ member_id: '', member_name: '', amount: 0 });

  useEffect(() => {
    if (!user) return;

    const unsubMembers = db.collection('members')
      .where('trainer_id', '==', user.uid)
      .onSnapshot((snap) => {
        const m = snap.docs.map(d => {
          const data = d.data();
          return { id: d.id, name: data.name, trainer_fee: data.trainer_fee || 0 };
        });
        setMembers(m);
      });

    const unsubEarnings = db.collection('trainer_earnings')
      .where('trainer_id', '==', user.uid)
      .onSnapshot((snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a: any, b: any) => ((b.created_at || '') > (a.created_at || '') ? 1 : -1));
        setEarnings(data);
        setLoading(false);
      });

    return () => { unsubMembers(); unsubEarnings(); };
  }, [user]);

  // Combine recorded earnings + configured trainer fees from member documents
  const recordedIds = new Set(earnings.map((e: any) => e.member_id));
  const pendingFees = members
    .filter(m => m.trainer_fee > 0 && !recordedIds.has(m.id))
    .map(m => ({ id: 'pending-' + m.id, member_name: m.name, amount: m.trainer_fee, date: 'Configured', pending: true }));
  const allEntries = [...earnings, ...pendingFees];
  allEntries.sort((a: any, b: any) => a.pending ? 1 : b.pending ? -1 : (b.created_at || '') > (a.created_at || '') ? 1 : -1);
  const totalEarnings = earnings.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

  const openAddFee = () => {
    setFeeData({ member_id: '', member_name: '', amount: 0 });
    setShowModal(true);
  };

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !feeData.member_id || !feeData.amount) return;
    setActionLoading(true);
    try {
      const member = members.find(m => m.id === feeData.member_id);
      await db.collection('trainer_earnings').add({
        trainer_id: user.uid,
        member_id: feeData.member_id,
        member_name: feeData.member_name || member?.name || 'Unknown',
        amount: feeData.amount,
        date: format(new Date(), 'yyyy-MM-dd'),
        created_at: new Date().toISOString()
      });
      setShowModal(false);
    } catch (err: any) {
      alert('Failed to add fee: ' + (err.message || 'Error'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">My Earnings</h1>
          <p className="text-gray-500 mt-2 text-sm md:text-lg font-medium">Track your training fees</p>
        </div>
        <button
          onClick={openAddFee}
          className="flex items-center gap-3 bg-brand-primary text-white px-6 md:px-8 py-4 rounded-[1.5rem] font-black text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 w-full md:w-auto justify-center"
        >
          <AddCircle className="w-5 h-5" />
          Add Fees
        </button>
      </div>

      {/* Total Earnings */}
      <div className="bg-gradient-to-br from-pastel-emerald to-pastel-blue rounded-[2rem] md:rounded-[3rem] p-5 md:p-10 border border-red-100/20 shadow-premium">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Earnings</p>
        <p className="text-3xl md:text-5xl font-black text-gray-900 mt-2">₹{totalEarnings.toLocaleString()}</p>
        <p className="text-xs font-bold text-gray-400 mt-1">{earnings.length} recorded + {pendingFees.length} pending</p>
      </div>

      {/* Earnings List */}
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-premium overflow-hidden">
        <div className="p-4 md:p-8 border-b border-gray-50/50">
          <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Payment History</h3>
        </div>
        {allEntries.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {allEntries.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between p-4 md:p-6 hover:bg-gray-50/50 transition-colors gap-4">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className={`w-10 md:w-12 h-10 md:h-12 rounded-2xl flex items-center justify-center shrink-0 ${entry.pending ? 'bg-pastel-orange' : 'bg-pastel-emerald'}`}>
                    <Dollar className={`w-5 md:w-6 h-5 md:h-6 ${entry.pending ? 'text-orange-500' : 'text-red-500'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm md:text-base font-black text-gray-900 truncate">{entry.member_name}</p>
                    <p className="text-[10px] md:text-xs font-bold text-gray-400 flex items-center gap-1.5 mt-0.5">
                      {entry.pending ? (
                        <span className="px-2 py-0.5 bg-pastel-orange text-orange-600 rounded-full uppercase tracking-wider">Pending</span>
                      ) : (
                        <><Calendar className="w-3 h-3" /> {entry.date}</>
                      )}
                    </p>
                  </div>
                </div>
                <p className={`text-base md:text-xl font-black shrink-0 ${entry.pending ? 'text-orange-400' : 'text-red-500'}`}>₹{entry.amount}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 md:py-16">
            <Dollar className="w-10 h-10 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No earnings yet</p>
          </div>
        )}
      </div>

      {/* Add Fees Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl p-5 md:p-10 border border-white/50"
            >
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Add Fees</h2>
                  <p className="text-gray-400 font-black mt-1 uppercase text-[10px] tracking-widest">Record a payment from your client</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 md:p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shrink-0">
                  <CloseCircle className="w-6 md:w-8 h-6 md:h-8" />
                </button>
              </div>

              <form onSubmit={handleAddFee} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Client</label>
                  <select required value={feeData.member_id}
                    onChange={e => {
                      const m = members.find(m => m.id === e.target.value);
                      setFeeData({ member_id: e.target.value, member_name: m?.name || '', amount: m?.trainer_fee || 0 });
                    }}
                    className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                  >
                    <option value="">Select a client</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Amount (₹)</label>
                  <input type="number" required min="1" value={feeData.amount} onChange={e => setFeeData({ ...feeData, amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700"
                    placeholder="Enter amount" />
                </div>
                <div className="flex gap-3 md:gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-[1.5rem] font-black text-xs md:text-sm hover:bg-gray-200 transition-all">Cancel</button>
                  <button type="submit" disabled={actionLoading} className="flex-[2] py-4 bg-brand-primary text-white rounded-[1.5rem] font-black text-xs md:text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50">
                    {actionLoading ? 'Saving...' : 'Record Payment'}
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
