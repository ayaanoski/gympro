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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
          <p className="text-gray-500">Configure your gym's offerings</p>
        </div>
        <button 
          onClick={() => {
            setEditingPlan(null);
            setFormData({ plan_name: '', duration: 1, duration_unit: 'months', price: 0, description: '', trainer_included: false });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
        >
          <AddCircle className="w-5 h-5" />
          Create Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div className="flex gap-2">
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
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <Pen className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deletePlan(plan.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <TrashBinTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.plan_name}</h3>
            <p className="text-gray-500 text-sm mb-4">{plan.duration} {plan.duration_unit}</p>
            
            <div className="text-3xl font-bold text-gray-900 mb-6">
              ₹{plan.price}
            </div>

            <div className="space-y-3 mb-8 flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {plan.trainer_included ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <CloseCircle className="w-4 h-4 text-gray-300" />
                )}
                Personal Trainer {plan.trainer_included ? 'Included' : 'Not Included'}
              </div>
              <p className="text-sm text-gray-500 italic">"{plan.description}"</p>
            </div>

            <button className="w-full py-3 bg-gray-50 text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors">
              View Details
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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.plan_name}
                    onChange={e => setFormData({...formData, plan_name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. 3 Months Standard"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input 
                      type="number" 
                      required
                      value={formData.duration}
                      onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select 
                      value={formData.duration_unit}
                      onChange={e => setFormData({...formData, duration_unit: e.target.value as any})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="months">Months</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                    placeholder="Briefly describe the plan..."
                  />
                </div>
                <div className="flex items-center gap-3 py-2">
                  <input 
                    type="checkbox" 
                    id="trainer"
                    checked={formData.trainer_included}
                    onChange={e => setFormData({...formData, trainer_included: e.target.checked})}
                    className="w-5 h-5 accent-emerald-600"
                  />
                  <label htmlFor="trainer" className="text-sm font-medium text-gray-700">Personal Trainer Included</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
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
