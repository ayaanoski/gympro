import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import {
  AddCircle,
  Pen,
  TrashBinTrash,
  CheckCircle,
  CloseCircle,
  ClipboardList
} from '@solar-icons/react';
import { motion, AnimatePresence } from 'motion/react';

export const MembershipPlans: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    plan_name: '',
    duration: 1,
    duration_unit: 'months' as 'days' | 'months',
    price: 0,
    description: '',
    trainer_included: false
  });

  useEffect(() => {
    const unsubscribe = adminService.getPlans(setPlans);
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await adminService.updatePlan(editingPlan.id, formData);
      } else {
        await adminService.addPlan(formData);
      }
      setIsModalOpen(false);
      setEditingPlan(null);
      setFormData({ plan_name: '', duration: 1, duration_unit: 'months', price: 0, description: '', trainer_included: false });
    } catch (err) {
      console.error(err);
    }
  };

  const deletePlan = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      await adminService.deletePlan(id);
    }
  };

  return (
    <div className="space-y-10 pb-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Membership Plans</h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">Configure and manage your gym's premium offerings</p>
        </div>
        <button
          onClick={() => {
            setEditingPlan(null);
            setFormData({ plan_name: '', duration: 1, duration_unit: 'months', price: 0, description: '', trainer_included: false });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-3 bg-brand-primary text-white px-8 py-4 rounded-[1.5rem] font-black text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20"
        >
          <AddCircle className="w-5 h-5 transition-transform group-hover:rotate-90" />
          Create New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className="group glass-card rounded-[2.5rem] p-8 flex flex-col hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl">
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 bg-pastel-emerald text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
                <ClipboardList className="w-7 h-7" />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => {
                    setEditingPlan(plan);
                    setFormData({
                      plan_name: plan.plan_name,
                      duration: plan.duration,
                      duration_unit: plan.duration_unit,
                      price: plan.price,
                      description: plan.description,
                      trainer_included: plan.trainer_included
                    });
                    setIsModalOpen(true);
                  }}
                  className="p-3 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all"
                >
                  <Pen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deletePlan(plan.id)}
                  className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <TrashBinTrash className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{plan.plan_name}</h3>
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-pastel-indigo text-indigo-500 rounded-lg text-xs font-black uppercase tracking-widest">
                {plan.duration} {plan.duration_unit}
              </span>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-black text-gray-900">₹{plan.price.toLocaleString()}</span>
              <span className="text-gray-400 text-sm font-bold ml-2 tracking-tighter">/ per cycle</span>
            </div>

            <div className="space-y-4 mb-10 flex-1">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors ${plan.trainer_included ? 'bg-pastel-emerald/30 border-emerald-100/50 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                {plan.trainer_included ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <CloseCircle className="w-5 h-5 text-gray-300" />
                )}
                <span className="text-sm font-black">
                  Personal Trainer {plan.trainer_included ? 'Included' : 'Expert Extra'}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-dashed border-gray-200">
                {plan.description || "No description provided for this premium membership plan."}
              </p>
            </div>

            <button className="w-full py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-sm hover:bg-black transition-all shadow-xl shadow-gray-200 group-hover:bg-brand-primary group-hover:shadow-brand-primary/20">
              Manage Details
            </button>
          </div>
        ))}
      </div>

      {/* Plan Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40, rotateX: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40, rotateX: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 border border-white/50"
            >
              <div className="mb-10 text-center">
                <div className="w-20 h-20 bg-pastel-indigo rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <ClipboardList className="w-10 h-10 text-brand-primary" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">{editingPlan ? 'Refine Plan' : 'New Plan Strategy'}</h2>
                <p className="text-gray-400 font-bold mt-1 uppercase text-[10px] tracking-widest">Membership Engineering</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Strategy Name</label>
                  <input
                    type="text"
                    required
                    value={formData.plan_name}
                    onChange={e => setFormData({ ...formData, plan_name: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                    placeholder="e.g. Quarterly Elite Membership"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Duration</label>
                    <input
                      type="number"
                      required
                      value={formData.duration}
                      onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Time Unit</label>
                    <select
                      value={formData.duration_unit}
                      onChange={e => setFormData({ ...formData, duration_unit: e.target.value as any })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                    >
                      <option value="months">Months</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Strategic Pricing (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) })}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Strategic Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 h-28 resize-none placeholder:text-gray-300"
                    placeholder="Highlight core benefits..."
                  />
                </div>
                <div className="flex items-center gap-4 py-2 px-2">
                  <div
                    onClick={() => setFormData({ ...formData, trainer_included: !formData.trainer_included })}
                    className={`w-12 h-6 rounded-full transition-all duration-300 cursor-pointer relative ${formData.trainer_included ? 'bg-brand-primary' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${formData.trainer_included ? 'left-7' : 'left-1'}`} />
                  </div>
                  <label className="text-sm font-black text-gray-600 cursor-pointer">Personal Trainer Included</label>
                </div>
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-[1.5rem] font-black text-sm hover:bg-gray-200 transition-all"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-4 bg-brand-primary text-white rounded-[1.5rem] font-black text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20"
                  >
                    {editingPlan ? 'Apply Strategy' : 'Deploy Plan'}
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
