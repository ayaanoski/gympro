import React, { useEffect, useState } from 'react';
import { staffService } from '../../services/staffService';
import { 
  Magnifer, 
  UserPlus, 
  Filter, 
  MenuDots, 
  ChatRoundDots,
  AltArrowRight,
  User,
  CloseCircle,
  AddCircle
} from '@solar-icons/react';
import { openWhatsApp } from '../../utils/whatsapp';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { adminService } from '../../services/adminService';

export const MembersList: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    membership_plan: '',
    trainer_id: '',
    initial_payment: 0,
    payment_method: 'Cash',
    dob: ''
  });

  useEffect(() => {
    const unsubscribeMembers = staffService.getMembers(setMembers);
    const unsubscribePlans = adminService.getPlans(setPlans);
    const unsubscribeUsers = adminService.getUsers((users) => {
      setTrainers(users.filter(u => u.role === 'trainer' && u.active));
    });

    return () => {
      unsubscribeMembers();
      unsubscribePlans();
      unsubscribeUsers();
    };
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedPlan = plans.find(p => p.plan_name === formData.membership_plan);
      const selectedTrainer = trainers.find(t => t.id === formData.trainer_id);
      
      const expiryDate = new Date();
      if (selectedPlan) {
        if (selectedPlan.duration_unit === 'months') {
          expiryDate.setMonth(expiryDate.getMonth() + selectedPlan.duration);
        } else {
          expiryDate.setDate(expiryDate.getDate() + selectedPlan.duration);
        }
      }

      await staffService.addMember({
        ...formData,
        trainer_name: selectedTrainer?.name || 'Not Assigned',
        expiry_date: expiryDate.toISOString().split('T')[0],
        start_date: new Date().toISOString().split('T')[0]
      });

      // Send Welcome Message
      openWhatsApp(formData.phone, `Welcome to GYMPRO, ${formData.name}! Your membership for ${formData.membership_plan} is active until ${expiryDate.toISOString().split('T')[0]}. Let's get fit!`);

      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', membership_plan: '', trainer_id: '', initial_payment: 0, payment_method: 'Cash', dob: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         m.phone.includes(searchQuery) ||
                         (m.member_id && m.member_id.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filter === 'all') return matchesSearch;
    return matchesSearch && m.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500">Manage your gym members</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
        >
          <UserPlus className="w-5 h-5" />
          Add New Member
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Magnifer className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, phone or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'expired'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-3 rounded-2xl text-sm font-bold capitalize transition-all ${
                filter === f 
                ? 'bg-gray-900 text-white' 
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-50">
                <th className="px-6 py-4 font-medium">Member</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Expiry</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                <tr key={member.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/members/${member.id}`} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                        {member.photo ? (
                          <img src={member.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                            {member.name[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.phone}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {member.membership_plan}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {member.expiry_date}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      member.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openWhatsApp(member.phone, `Hi ${member.name}, just checking in! How is your workout going?`)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                      >
                        <ChatRoundDots className="w-5 h-5" />
                      </button>
                      <Link to={`/members/${member.id}`} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                        <AltArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No members found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
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
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Register New Member</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <CloseCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                      type="text" required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" required
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input 
                      type="date" required
                      value={formData.dob}
                      onChange={e => setFormData({...formData, dob: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Membership Plan</label>
                    <select 
                      required
                      value={formData.membership_plan}
                      onChange={e => setFormData({...formData, membership_plan: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="">Select a plan</option>
                      {plans.map(p => (
                        <option key={p.id} value={p.plan_name}>{p.plan_name} - ₹{p.price}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Trainer</label>
                    <select 
                      value={formData.trainer_id}
                      onChange={e => setFormData({...formData, trainer_id: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="">No Trainer</option>
                      {trainers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Payment (₹)</label>
                    <input 
                      type="number" required
                      value={formData.initial_payment}
                      onChange={e => setFormData({...formData, initial_payment: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select 
                      value={formData.payment_method}
                      onChange={e => setFormData({...formData, payment_method: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                  >
                    {loading ? 'Registering...' : 'Complete Registration'}
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
