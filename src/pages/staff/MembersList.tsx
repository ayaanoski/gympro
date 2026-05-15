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
  AddCircle,
  TrashBinTrash
} from '@solar-icons/react';
import { openWhatsApp, whatsAppTemplates } from '../../utils/whatsapp';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { adminService } from '../../services/adminService';
import { db, auth } from '../../firebase';
import firebase from 'firebase/compat/app';

export const MembersList: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const CATEGORIES = ['normal', 'student', 'couples'];
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    membership_plan: '',
    category: 'normal',
    discount_percent: 0,
    trainer_id: '',
    trainer_fee: 0,
    initial_payment: 0,
    payment_method: 'Cash',
    dob: '',
    reg_password: ''
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
    const expiryStr = expiryDate.toISOString().split('T')[0];

    // Build WhatsApp message synchronously (to use after success)
    const waMessage = formData.email && formData.reg_password
      ? whatsAppTemplates.welcomeWithCredentials(formData.name, formData.membership_plan, expiryStr, formData.email, formData.reg_password)
      : whatsAppTemplates.welcome(formData.name, formData.membership_plan, expiryStr);
    const waPhone = formData.phone.replace(/\D/g, '');
    const waLink = `https://wa.me/${waPhone.length === 10 ? '91' + waPhone : waPhone}?text=${encodeURIComponent(waMessage)}`;

    try {
      // 1. Create Firebase Auth account for member
      const { firebaseConfig } = await import('../../firebaseConfig');
      const secondaryApp = firebase.initializeApp(firebaseConfig, `MemberApp_${Date.now()}`);
      let authUid = '';

      try {
        const userCred = await secondaryApp.auth().createUserWithEmailAndPassword(formData.email, formData.reg_password);
        authUid = userCred.user!.uid;

        await db.collection('users').doc(authUid).set({
          uid: authUid,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: 'member',
          active: true,
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
      } finally {
        await secondaryApp.delete();
      }

      // 2. Create member document
      const memberRef = await staffService.addMember({
        ...formData,
        auth_uid: authUid,
        trainer_name: selectedTrainer?.name || 'Not Assigned',
        expiry_date: expiryStr,
        start_date: new Date().toISOString().split('T')[0]
      });

      // 3. Create initial trainer earnings record if trainer fee was set
      if (formData.trainer_fee > 0 && formData.trainer_id) {
        await db.collection('trainer_earnings').add({
          trainer_id: formData.trainer_id,
          member_id: memberRef.id,
          member_name: formData.name,
          amount: formData.trainer_fee,
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        });
      }

      // 4. All DB ops succeeded — close modal, reset form
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', membership_plan: '', category: 'normal', discount_percent: 0, trainer_id: '', trainer_fee: 0, initial_payment: 0, payment_method: 'Cash', dob: '', reg_password: '' });

      // 4. Open WhatsApp in a new tab (anchor click bypasses popup blockers)
      const waAnchor = document.createElement('a');
      waAnchor.href = waLink;
      waAnchor.target = '_blank';
      waAnchor.rel = 'noopener noreferrer';
      waAnchor.style.display = 'none';
      document.body.appendChild(waAnchor);
      waAnchor.click();
      document.body.removeChild(waAnchor);
    } catch (err: any) {
      alert(err.message || 'Failed to register member');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Permanently delete ${memberName}? This cannot be undone.`)) return;
    try {
      await db.collection('members').doc(memberId).delete();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery) ||
      (m.member_id && m.member_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6 md:space-y-10 pb-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Gym Members</h1>
          <p className="text-gray-500 mt-2 text-sm md:text-lg font-medium">Empower and track your athletic community</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 bg-brand-primary text-white px-6 md:px-8 py-4 rounded-[1.5rem] font-black text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 w-full md:w-auto justify-center"
        >
          <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
          Add Member
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <div className="relative flex-1 group">
          <Magnifer className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-brand-primary" />
          <input
            type="text"
            placeholder="Search by name, phone or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] shadow-premium focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-medium text-gray-600"
          />
        </div>
        <div className="flex bg-white p-1.5 rounded-[1.5rem] shadow-premium border border-gray-100 overflow-x-auto">
          {['all', 'active', 'expired'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 md:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${statusFilter === f
                ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              {f}
            </button>
          ))}
          <div className="w-px bg-gray-200 mx-2" />
          {['all', ...CATEGORIES].map((f) => (
            <button
              key={f}
              onClick={() => setCategoryFilter(f)}
              className={`px-4 md:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${categoryFilter === f
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-gray-50/50">
                <th className="px-4 md:px-8 py-4 md:py-6 font-black">Member</th>
                <th className="px-4 md:px-8 py-4 md:py-6 font-black">Plan</th>
                <th className="px-4 md:px-8 py-4 md:py-6 font-black">Category</th>
                <th className="px-4 md:px-8 py-4 md:py-6 font-black">Expiry Date</th>
                <th className="px-4 md:px-8 py-4 md:py-6 font-black">Status</th>
                <th className="px-4 md:px-8 py-4 md:py-6 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                <tr key={member.id} className="group hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <Link to={`/members/${member.id}`} className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 md:w-12 h-10 md:h-12 bg-pastel-indigo rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-sm transition-transform group-hover:scale-110">
                        {member.photo ? (
                          <img src={member.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-primary font-black text-sm md:text-lg">
                            {member.name[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm md:text-base font-black text-gray-900 group-hover:text-brand-primary transition-colors truncate">{member.name}</p>
                        <p className="text-xs text-gray-400 font-bold tracking-tight truncate">{member.phone}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 font-bold text-gray-600 text-xs md:text-sm">
                    <span className="px-2 md:px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 truncate inline-block max-w-[100px] md:max-w-none">{member.membership_plan}</span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap bg-pastel-blue text-red-600 border border-red-100">
                      {member.category || 'normal'}
                    </span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-xs md:text-sm font-black text-gray-400 whitespace-nowrap">
                    {member.expiry_date}
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <span className={`inline-flex items-center px-2 md:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${member.status === 'active'
                      ? 'bg-pastel-emerald text-red-500 border border-red-100'
                      : 'bg-pastel-pink text-pink-500 border border-pink-100'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${member.status === 'active' ? 'bg-red-500' : 'bg-pink-500'}`}></span>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                    <div className="flex items-center justify-end gap-2 md:gap-3">
                      <button
                        onClick={() => openWhatsApp(member.phone, whatsAppTemplates.checkIn(member.name))}
                        className="p-2 md:p-3 text-red-500 hover:bg-pastel-emerald/50 rounded-xl transition-all shadow-sm bg-white"
                        title="Direct Contact"
                      >
                        <ChatRoundDots className="w-4 md:w-5 h-4 md:h-5" />
                      </button>
                      <Link to={`/members/${member.id}`} className="p-2 md:p-3 text-gray-400 hover:text-brand-primary hover:bg-pastel-indigo rounded-xl transition-all shadow-sm bg-white">
                        <AltArrowRight className="w-4 md:w-5 h-4 md:h-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteMember(member.id, member.name)}
                        className="p-2 md:p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm bg-white"
                        title="Delete Member"
                      >
                        <TrashBinTrash className="w-4 md:w-5 h-4 md:h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 md:px-8 py-12 md:py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 md:w-20 h-16 md:h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <User className="w-6 md:w-8 h-6 md:h-8 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-black text-base md:text-lg">No members found</p>
                    </div>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl p-4 md:p-8 border border-white/50 overflow-y-auto max-h-[90vh] md:overflow-visible md:max-h-none"
            >
              <div className="flex items-start justify-between mb-3 md:mb-6 gap-2">
                <div className="min-w-0">
                  <h2 className="text-base md:text-2xl font-black text-gray-900 tracking-tight truncate pr-2">Register New Member</h2>
                  <p className="text-gray-400 font-bold mt-0.5 uppercase text-[10px] tracking-widest">Enrollment</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0 -mt-0.5">
                  <CloseCircle className="w-5 md:w-7 h-5 md:h-7" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-3 md:space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text" required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input
                      type="tel" required
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                      placeholder="rahul@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Temporary Password</label>
                    <input type="text" required value={formData.reg_password} onChange={e => setFormData({ ...formData, reg_password: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                      placeholder="Set temp password for member login" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date of Birth</label>
                    <input
                      type="date" required
                      value={formData.dob}
                      onChange={e => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Membership Plan</label>
                    <select
                      required
                      value={formData.membership_plan}
                      onChange={e => {
                        const plan = plans.find(p => p.plan_name === e.target.value);
                        const price = plan ? plan.price : 0;
                        const discount = formData.discount_percent || 0;
                        const fee = formData.trainer_fee || 0;
                        const finalAmount = price - Math.round(price * discount / 100) + fee;
                        setFormData({ ...formData, membership_plan: e.target.value, initial_payment: finalAmount });
                      }}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                    >
                      <option value="">Select a plan</option>
                      {plans.map(p => (
                        <option key={p.id} value={p.plan_name}>{p.plan_name} - ₹{p.price}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                    >
                      {CATEGORIES.map(c => (<option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Discount (%)</label>
                    <input
                      type="number" min="0" max="100"
                      value={formData.discount_percent}
                      onChange={e => {
                        const d = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                        const plan = plans.find(p => p.plan_name === formData.membership_plan);
                        const price = plan ? plan.price : 0;
                        const fee = formData.trainer_fee || 0;
                        const finalAmount = price - Math.round(price * d / 100) + fee;
                        setFormData({ ...formData, discount_percent: d, initial_payment: finalAmount });
                      }}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Personal Trainer</label>
                    <select
                      value={formData.trainer_id}
                      onChange={e => setFormData({ ...formData, trainer_id: e.target.value, trainer_fee: e.target.value ? formData.trainer_fee : 0 })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                    >
                      <option value="">No Trainer</option>
                      {trainers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  {formData.trainer_id && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Trainer Fee (for this period)</label>
                    <input type="number" min="0" value={formData.trainer_fee} onChange={e => {
                        const fee = parseInt(e.target.value) || 0;
                        const plan = plans.find(p => p.plan_name === formData.membership_plan);
                        const price = plan ? plan.price : 0;
                        const discount = formData.discount_percent || 0;
                        const finalAmount = price - Math.round(price * discount / 100) + fee;
                        setFormData({ ...formData, trainer_fee: fee, initial_payment: finalAmount });
                      }}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700"
                      placeholder="Enter trainer fee amount" />
                  </div>
                  )}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Total Amount (₹)</label>
                    <input type="number" required readOnly value={formData.initial_payment}
                      className="w-full px-6 py-4 bg-gray-100 border border-transparent rounded-2xl cursor-not-allowed font-bold text-gray-500 outline-none" />
                    {formData.membership_plan && (
                      <p className="text-[10px] text-gray-400 font-bold px-1">
                        Plan {plans.find(p => p.plan_name === formData.membership_plan)?.price || 0}{formData.trainer_fee > 0 ? ` + Trainer ${formData.trainer_fee}` : ''}{formData.discount_percent > 0 ? ` - ${formData.discount_percent}% off` : ''}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                    <select
                      value={formData.payment_method}
                      onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 md:gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-[1.5rem] font-black text-xs md:text-sm hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-4 bg-brand-primary text-white rounded-[1.5rem] font-black text-xs md:text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Register Member'}
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
