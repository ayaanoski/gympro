import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sharedService } from '../../services/sharedService';
import {
  Phone,
  Calendar,
  User,
  Dumbbell,
  GraphUp,
  History,
  Refresh,
  ChatRoundDots,
  AltArrowLeft,
  AddCircle,
  CloseCircle,
  Upload,
  Eye,
  Gallery,
  FileText
} from '@solar-icons/react';
import { openWhatsApp, whatsAppTemplates } from '../../utils/whatsapp';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { staffService } from '../../services/staffService';
import { trainerService } from '../../services/trainerService';
import { adminService } from '../../services/adminService';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const MemberProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isTrainer, isAdmin, isStaff } = useAuth();
  const [member, setMember] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [height, setHeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [workoutText, setWorkoutText] = useState('');
  const [workoutImageUrl, setWorkoutImageUrl] = useState('');
  const [workoutUploading, setWorkoutUploading] = useState(false);
  const workoutFileRef = useRef<HTMLInputElement>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const aadharInputRef = useRef<HTMLInputElement>(null);
  const CATEGORIES = ['normal', 'student', 'couples'];
  const [renewalData, setRenewalData] = useState({
    plan_name: '',
    amount: 0,
    payment_method: 'Cash',
    category: 'normal',
    discount_percent: 0
  });
  const [logData, setLogData] = useState({
    weight: '',
    body_fat: '',
    notes: ''
  });
  const [trainers, setTrainers] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: '', phone: '', email: '', dob: '', category: 'normal', discount_percent: 0, membership_plan: ''
  });

  useEffect(() => {
    if (!id) return;

    let unsubs: (() => void)[] = [];

    const setup = async () => {
      try {
        unsubs.push(
          db.collection('members').doc(id).onSnapshot((doc) => {
            if (doc.exists) {
              const data: any = { id: doc.id, ...doc.data() };
              setMember(data);
              setHeight(data.height?.toString() || '');
            } else {
              navigate('/members');
            }
            setLoading(false);
          })
        );

        unsubs.push(
          db.collection('payments')
            .where('member_id', '==', id)
            .onSnapshot((snap) => {
              const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
              data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
              setPayments(data);
            })
        );

        unsubs.push(
          db.collection('progress')
            .where('member_id', '==', id)
            .onSnapshot((snap) => {
              const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
              data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
              setProgress(data);
            })
        );

        unsubs.push(
          db.collection('workout_plans')
            .where('member_id', '==', id)
            .limit(1)
            .onSnapshot((snap) => {
              if (!snap.empty) {
                const data = snap.docs[0].data();
                setWorkoutPlan({ id: snap.docs[0].id, ...data });
              } else {
                setWorkoutPlan(null);
              }
            })
        );

        unsubs.push(
          db.collection('diet_plans')
            .where('member_id', '==', id)
            .limit(1)
            .onSnapshot((snap) => {
              if (!snap.empty) {
                const data = snap.docs[0].data();
                setDietPlan({ id: snap.docs[0].id, ...data });
              } else {
                setDietPlan(null);
              }
            })
        );

        unsubs.push(
          db.collection('member_documents')
            .where('member_id', '==', id)
            .onSnapshot((snap) => {
              setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            })
        );

        adminService.getPlans(setPlans);

        if (isAdmin || isStaff) {
          unsubs.push(
            adminService.getUsers((users) => {
              setTrainers(users.filter((u: any) => u.role === 'trainer' && u.active));
            })
          );
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    setup();

    return () => unsubs.forEach(u => u?.());
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
    }
  };

  const handleHeightUpdate = async () => {
    if (!id || !height) return;
    await db.collection('members').doc(id).update({ height: parseFloat(height) });
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !member) return;
    setActionLoading(true);
    try {
      const selectedPlan = plans.find(p => p.plan_name === renewalData.plan_name);
      const baseDate = new Date(member.expiry_date);
      baseDate.setDate(baseDate.getDate() + 1);
      if (selectedPlan) {
        if (selectedPlan.duration_unit === 'months') {
          baseDate.setMonth(baseDate.getMonth() + selectedPlan.duration);
        } else {
          baseDate.setDate(baseDate.getDate() + selectedPlan.duration);
        }
      }
      const newExpiryStr = baseDate.toISOString().split('T')[0];
      await staffService.renewMembership(id, {
        ...renewalData,
        member_name: member.name,
        new_expiry: newExpiryStr
      });
      openWhatsApp(member.phone, whatsAppTemplates.renewal(member.name, renewalData.plan_name, newExpiryStr));
      setIsRenewModalOpen(false);
    } catch (err: any) {
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
      alert(`Failed to log: ${err.message || 'Database error'}`);
    } finally {
      setActionLoading(false);
    }
  };



  const uploadToCloudinary = async (file: File, type: 'aadhar' | 'profile_photo') => {
    if (!id || !user) return;
    if (!CLOUD_NAME || !UPLOAD_PRESET) { alert('Cloudinary not configured'); return; }
    if (file.size > 3 * 1024 * 1024) { alert('File must be less than 3 MB'); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('api_key', API_KEY);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.secure_url) {
        await db.collection('member_documents').add({
          member_id: id,
          type,
          url: data.secure_url,
          uploaded_at: new Date().toISOString(),
          uploaded_by: user.uid
        });
        if (type === 'profile_photo') {
          await db.collection('members').doc(id).update({ photo: data.secure_url });
        }
      } else {
        alert('Upload failed: ' + (data.error?.message || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Upload error: ' + (err.message || 'Network error'));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'aadhar' | 'profile_photo') => {
    const file = e.target.files?.[0];
    if (file) {
      uploadToCloudinary(file, type);
    }
    e.target.value = '';
  };

  const viewDocument = (url: string) => {
    window.open(url, '_blank');
  };

  const handleWorkoutFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !user) return;
    if (!CLOUD_NAME || !UPLOAD_PRESET) { alert('Cloudinary not configured'); return; }
    if (file.size > 3 * 1024 * 1024) { alert('File must be less than 3 MB'); return; }
    setWorkoutUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    fd.append('api_key', API_KEY);
    fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
      .then(r => r.json())
      .then(d => { if (d.secure_url) setWorkoutImageUrl(d.secure_url); })
      .catch(() => alert('Upload failed'))
      .finally(() => setWorkoutUploading(false));
    e.target.value = '';
  };

  const handleSaveWorkout = async () => {
    if (!id || !user) return;
    setActionLoading(true);
    try {
      await trainerService.updateWorkoutPlan(id, { description: workoutText, image_url: workoutImageUrl, updated_at: new Date().toISOString() });
      setIsWorkoutModalOpen(false);
    } catch { alert('Failed to save workout'); }
    finally { setActionLoading(false); }
  };

  const openEditModal = () => {
    if (!member) return;
    setEditData({
      name: member.name || '',
      phone: member.phone || '',
      email: member.email || '',
      dob: member.dob || '',
      category: member.category || 'normal',
      discount_percent: member.discount_percent || 0,
      membership_plan: member.membership_plan || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setActionLoading(true);
    try {
      await db.collection('members').doc(id).update({
        name: editData.name,
        phone: editData.phone,
        email: editData.email,
        dob: editData.dob,
        category: editData.category,
        discount_percent: editData.discount_percent,
        membership_plan: editData.membership_plan
      });
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert('Failed to update: ' + (err.message || 'Error'));
    } finally {
      setActionLoading(false);
    }
  };

  const latestProgress = progress.length > 0 ? progress[0] : null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px] md:min-h-[400px]">
      <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!member) return (
    <div className="flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] text-center p-6 md:p-8 bg-pastel-pink/20 rounded-[2rem] md:rounded-[3rem] border border-pink-100">
      <div className="w-16 md:w-20 h-16 md:h-20 bg-pink-100 rounded-full flex items-center justify-center mb-6">
        <CloseCircle className="w-8 md:w-10 h-8 md:h-10 text-pink-500" />
      </div>
      <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-2">Member Not Found</h2>
      <p className="text-gray-500 font-bold max-w-xs uppercase text-[10px] tracking-widest">This member does not exist</p>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-10 pb-10 font-sans">
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center gap-3 text-gray-400 hover:text-brand-primary transition-all font-black uppercase text-[10px] tracking-widest"
      >
        <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:bg-pastel-indigo group-hover:border-brand-primary/20 transition-all">
          <AltArrowLeft className="w-5 h-5" />
        </div>
        Back to Members
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6 md:space-y-8">
          <div className="bg-white p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-premium text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 md:h-32 bg-gradient-to-br from-pastel-indigo to-pastel-blue opacity-30" />

            <div className="relative mt-4">
              <div className="w-28 md:w-40 h-28 md:h-40 bg-white p-2 rounded-full mx-auto mb-6 md:mb-8 shadow-xl relative group-hover:scale-105 transition-transform duration-500">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white">
                  {member.photo ? (
                    <img src={member.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-pastel-indigo flex items-center justify-center text-brand-primary text-3xl md:text-5xl font-black">
                      {member.name[0]}
                    </div>
                  )}
                </div>
                <div className={`absolute bottom-2 right-2 w-6 md:w-8 h-6 md:h-8 rounded-full border-4 border-white shadow-lg ${member.status === 'active' ? 'bg-red-500' : 'bg-pink-500'}`} />
              </div>

              <div className="flex items-center justify-center gap-3">
                <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight truncate">{member.name}</h2>
                {(isAdmin || isStaff) && (
                  <button onClick={openEditModal} className="p-1.5 text-gray-300 hover:text-brand-primary hover:bg-pastel-indigo rounded-lg transition-all text-xs font-black uppercase tracking-widest shrink-0">
                    Edit
                  </button>
                )}
              </div>
              <div className="mt-2 inline-flex items-center px-4 py-1.5 bg-gray-50 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 max-w-full">
                <span className="truncate">{member.member_id || 'N/A'}</span>
              </div>

              <div className="flex justify-center gap-3 md:gap-4 mt-6 md:mt-10">
                <button
                  onClick={() => openWhatsApp(member.phone, whatsAppTemplates.checkIn(member.name))}
                  className="p-3 md:p-4 bg-pastel-emerald text-red-600 rounded-[1.5rem] hover:scale-110 transition-all shadow-sm border border-red-100"
                  title="WhatsApp"
                >
                  <ChatRoundDots className="w-5 md:w-6 h-5 md:h-6" />
                </button>
                {(isAdmin || isStaff) && !isTrainer && (
                  <button
                    onClick={() => setIsRenewModalOpen(true)}
                    className="p-3 md:p-4 bg-pastel-orange text-orange-600 rounded-[1.5rem] hover:scale-110 transition-all shadow-sm border border-orange-100"
                    title="Renew Membership"
                  >
                    <Refresh className="w-5 md:w-6 h-5 md:h-6" />
                  </button>
                )}
              </div>

              <div className="mt-6 md:mt-10 pt-6 md:pt-8 border-t border-gray-50 space-y-4 md:space-y-5 text-left">
                <div className="flex items-center gap-3 md:gap-4 group/item">
                  <div className="p-2 md:p-2.5 bg-gray-50 rounded-xl group-hover/item:bg-pastel-blue transition-colors">
                    <Phone className="w-5 h-5 text-gray-400 group-hover/item:text-red-500" />
                  </div>
                  <span className="text-sm font-black text-gray-600 tracking-tight truncate">{member.phone}</span>
                </div>
                <div className="flex items-center gap-3 md:gap-4 group/item">
                  <div className="p-2 md:p-2.5 bg-gray-50 rounded-xl group-hover/item:bg-pastel-indigo transition-colors">
                    <Calendar className="w-5 h-5 text-gray-400 group-hover/item:text-brand-primary" />
                  </div>
                  <span className="text-sm font-black text-gray-600 tracking-tight truncate">Joined: {member.start_date}</span>
                </div>
                <div className="flex items-center gap-3 md:gap-4 group/item">
                  <div className="p-2 md:p-2.5 bg-gray-50 rounded-xl group-hover/item:bg-pastel-purple transition-colors">
                    <User className="w-5 h-5 text-gray-400 group-hover/item:text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-black text-gray-600 tracking-tight block truncate">Trainer: {member.trainer_name || 'Not Assigned'}</span>
                    {(isAdmin || isStaff) && (
                      <select
                        value={member.trainer_id || ''}
                        onChange={(e) => handleUpdateTrainer(e.target.value)}
                        className="mt-2 w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-500 focus:bg-white transition-all outline-none"
                      >
                        <option value="">Assign Trainer</option>
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

          <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-premium relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-10 transition-transform duration-700 group-hover:scale-150 ${member.status === 'active' ? 'bg-red-500' : 'bg-pink-500'}`} />
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 md:mb-6">Membership</h3>
            <div className={`p-4 md:p-6 rounded-[2rem] border-2 ${member.status === 'active' ? 'bg-pastel-emerald/30 border-red-100' : 'bg-pastel-pink/30 border-pink-100'}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${member.status === 'active' ? 'text-red-500' : 'text-pink-500'}`}>
                {member.status === 'active' ? 'Active' : 'Expired'}
              </p>
              <p className="text-lg md:text-xl font-black text-gray-900">Expires: {member.expiry_date}</p>
            </div>
            <p className="mt-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center px-4 py-2 bg-gray-50 rounded-full inline-block truncate max-w-full">Plan: {member.membership_plan}</p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="px-3 py-1 bg-pastel-blue rounded-full text-[10px] font-black text-red-600 uppercase tracking-widest">
                {member.category || 'normal'}
              </span>
              {member.discount_percent > 0 && (
                <span className="px-3 py-1 bg-pastel-orange rounded-full text-[10px] font-black text-orange-600 uppercase tracking-widest">
                  {member.discount_percent}% off
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-2 space-y-6 md:space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* Diet Plan — view only, set by Trainer from their dashboard */}
            {!isTrainer && (
            <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-premium group">
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <div className="p-2 md:p-3 bg-pastel-emerald rounded-2xl border border-red-100 shrink-0">
                  <FileText className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
                </div>
                <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight truncate">Diet Plan</h3>
              </div>
              {dietPlan?.description ? (
                <div className="p-4 md:p-6 bg-gray-50/50 rounded-2xl border border-transparent group-hover:bg-white group-hover:shadow-md group-hover:border-gray-100 transition-all">
                  <p className="text-sm font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {dietPlan.description}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                  <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No diet plan set</p>
                </div>
              )}
            </div>
            )}

            {/* Latest Progress */}
            <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-premium group">
              <div className="flex items-center justify-between mb-6 md:mb-8 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 md:p-3 bg-pastel-blue rounded-2xl border border-red-100 shrink-0">
                    <GraphUp className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight truncate">Latest Progress</h3>
                </div>
                <button onClick={() => setIsLogModalOpen(true)} className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline px-3 md:px-4 py-2 bg-pastel-emerald/30 rounded-full shrink-0">Add Log</button>
              </div>

              {/* Height */}
              <div className="mb-4 p-4 bg-gray-50/50 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Height</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number" step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    onBlur={handleHeightUpdate}
                    className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:border-brand-primary/30 outline-none"
                    placeholder="cm"
                  />
                  <span className="text-xs font-black text-gray-400">CM</span>
                </div>
              </div>

              {/* Weight */}
              {latestProgress ? (
                <div className="p-4 md:p-5 border-l-4 border-red-500 bg-pastel-emerald/10 rounded-r-2xl">
                  <div className="flex justify-between items-center gap-2">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weight</p>
                      <p className="text-lg md:text-xl font-black text-red-600">{latestProgress.weight} KG</p>
                    </div>
                    <p className="text-[10px] font-black text-gray-400">{latestProgress.date}</p>
                  </div>
                  {latestProgress.body_fat && (
                    <p className="text-xs font-bold text-gray-500 mt-1">Body Fat: {latestProgress.body_fat}%</p>
                  )}
                  {latestProgress.notes && (
                    <p className="text-xs font-bold text-gray-600 mt-2 line-clamp-2">{latestProgress.notes}</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                  <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No progress logged</p>
                </div>
              )}
            </div>
          </div>

          {/* Workout Plan */}
          <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-premium group">
            <div className="flex items-center justify-between mb-6 md:mb-8 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 md:p-3 bg-pastel-purple rounded-2xl border border-red-100 shrink-0">
                  <Dumbbell className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
                </div>
                <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight truncate">Workout Plan</h3>
              </div>
              {isTrainer && (
                <button onClick={() => setIsWorkoutModalOpen(true)} className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline px-3 md:px-4 py-2 bg-pastel-indigo/30 rounded-full shrink-0">Edit</button>
              )}
            </div>
            {workoutPlan?.description || workoutPlan?.image_url ? (
              <div className="space-y-4">
                {workoutPlan?.description && (
                  <div className="p-4 md:p-6 bg-gray-50/50 rounded-2xl border border-transparent group-hover:bg-white group-hover:shadow-md group-hover:border-gray-100 transition-all">
                    <p className="text-sm font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">{workoutPlan.description}</p>
                  </div>
                )}
                {workoutPlan?.image_url && (
                  <img src={workoutPlan.image_url} alt="Workout" className="w-full max-h-64 object-cover rounded-2xl border border-gray-200 cursor-pointer" onClick={() => window.open(workoutPlan.image_url, '_blank')} />
                )}
              </div>
            ) : (
              <div className="text-center py-8 md:py-12 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No workout plan set</p>
              </div>
            )}
          </div>

          {/* Documents */}
          {(isAdmin || isStaff) && (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden">
              <div className="p-4 md:p-8 border-b border-gray-50/50 flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-pastel-purple rounded-2xl border border-red-100 shrink-0">
                    <Upload className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Documents</h3>
                </div>
              </div>
              <input
                type="file"
                ref={profileInputRef}
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'profile_photo')}
                className="hidden"
              />
              <input
                type="file"
                ref={aadharInputRef}
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, 'aadhar')}
                className="hidden"
              />
              <div className="p-4 md:p-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => profileInputRef.current?.click()}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 hover:border-red-300 hover:bg-red-50/30 cursor-pointer transition-all group"
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                      <Gallery className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900">Profile Photo</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Max 3 MB</p>
                    </div>
                    {documents.filter(d => d.type === 'profile_photo').length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); viewDocument(documents.find(d => d.type === 'profile_photo')?.url); }}
                        className="p-2 bg-white rounded-xl shadow-sm hover:bg-gray-100 transition-all"
                        title="View"
                      >
                        <Eye className="w-5 h-5 text-gray-400" />
                      </button>
                    )}
                  </div>
                  <div
                    onClick={() => aadharInputRef.current?.click()}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 hover:border-red-300 hover:bg-red-50/30 cursor-pointer transition-all group"
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900">Aadhar Card</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Max 3 MB</p>
                    </div>
                    {documents.filter(d => d.type === 'aadhar').length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); viewDocument(documents.find(d => d.type === 'aadhar')?.url); }}
                        className="p-2 bg-white rounded-xl shadow-sm hover:bg-gray-100 transition-all"
                        title="View"
                      >
                        <Eye className="w-5 h-5 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
                {uploading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-sm font-bold text-gray-500">Uploading...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment History */}
          {!isTrainer && (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden">
              <div className="p-4 md:p-8 border-b border-gray-50/50 flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-pastel-blue rounded-2xl border border-red-100 shrink-0">
                    <History className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Payments</h3>
                </div>
                <span className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">
                  {payments.length} Total
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-gray-50/50">
                      <th className="px-4 md:px-8 py-4 md:py-6 font-black">Date</th>
                      <th className="px-4 md:px-8 py-4 md:py-6 font-black">Plan</th>
                      <th className="px-4 md:px-8 py-4 md:py-6 font-black">Amount</th>
                      <th className="px-4 md:px-8 py-4 md:py-6 font-black">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/50">
                    {payments.length > 0 ? payments.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-4 md:px-8 py-4 md:py-6 text-sm font-black text-gray-400 whitespace-nowrap">{p.date}</td>
                        <td className="px-4 md:px-8 py-4 md:py-6 text-sm font-black text-gray-900 truncate max-w-[120px] md:max-w-none">{p.plan_name}</td>
                        <td className="px-4 md:px-8 py-4 md:py-6 text-sm md:text-base font-black text-red-500 whitespace-nowrap">₹{p.amount}</td>
                        <td className="px-4 md:px-8 py-4 md:py-6">
                          <span className="px-2 md:px-4 py-1.5 bg-pastel-blue/30 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100/50 whitespace-nowrap">
                            {p.method}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-4 md:px-8 py-12 md:py-16 text-center">
                          <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No payments recorded</p>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
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
              className="relative w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl p-5 md:p-10 border border-white/50"
            >
              <div className="mb-6 md:mb-10 text-center">
                <div className="w-16 md:w-20 h-16 md:h-20 bg-pastel-orange rounded-[2rem] flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-sm">
                  <Refresh className="w-8 md:w-10 h-8 md:h-10 text-orange-600" />
                </div>
                <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">Renew Membership</h2>
                <p className="text-gray-400 font-bold mt-1 uppercase text-[10px] tracking-widest">Extend member's plan</p>
              </div>
              <form onSubmit={handleRenew} className="space-y-4 md:space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Plan</label>
                  <select required value={renewalData.plan_name} onChange={e => {
                      const plan = plans.find(p => p.plan_name === e.target.value);
                      const price = plan ? plan.price : 0;
                      const disc = renewalData.discount_percent || 0;
                      setRenewalData({ ...renewalData, plan_name: e.target.value, amount: price - Math.round(price * disc / 100) });
                    }}
                    className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                  >
                    <option value="">Select a plan</option>
                    {plans.map(p => (<option key={p.id} value={p.plan_name}>{p.plan_name} - ₹{p.price}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                  <select value={renewalData.category} onChange={e => setRenewalData({ ...renewalData, category: e.target.value })}
                    className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                  >
                    {CATEGORIES.map(c => (<option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Discount (%)</label>
                  <input type="number" min="0" max="100" value={renewalData.discount_percent} onChange={e => {
                      const d = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                      const plan = plans.find(p => p.plan_name === renewalData.plan_name);
                      const price = plan ? plan.price : 0;
                      setRenewalData({ ...renewalData, discount_percent: d, amount: price - Math.round(price * d / 100) });
                    }}
                    className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none font-bold text-gray-700" placeholder="0" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Amount (₹)</label>
                  <input type="number" required value={renewalData.amount} readOnly className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none font-bold text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Payment Method</label>
                  <select value={renewalData.payment_method} onChange={e => setRenewalData({ ...renewalData, payment_method: e.target.value })}
                    className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                  >
                    <option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option>
                  </select>
                </div>
                <div className="flex gap-3 md:gap-4 pt-4">
                  <button type="button" onClick={() => setIsRenewModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-[1.5rem] font-black text-xs md:text-sm hover:bg-gray-200 transition-all">Cancel</button>
                  <button type="submit" disabled={actionLoading} className="flex-[2] py-4 bg-brand-primary text-white rounded-[1.5rem] font-black text-xs md:text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50">
                    {actionLoading ? 'Renewing...' : 'Renew'}
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
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
              className="relative w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl p-5 md:p-10 border border-white/50"
            >
              <div className="mb-6 md:mb-10 text-center">
                <div className="w-16 md:w-20 h-16 md:h-20 bg-pastel-emerald rounded-[2rem] flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-sm">
                  <GraphUp className="w-8 md:w-10 h-8 md:h-10 text-red-600" />
                </div>
                <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">Log Progress</h2>
                <p className="text-gray-400 font-bold mt-1 uppercase text-[10px] tracking-widest">Record member's metrics</p>
              </div>
              <form onSubmit={handleAddLog} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Weight (KG)</label>
                    <input type="number" step="0.1" required value={logData.weight} onChange={e => setLogData({ ...logData, weight: e.target.value })}
                      className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Body Fat (%)</label>
                    <input type="number" step="0.1" value={logData.body_fat} onChange={e => setLogData({ ...logData, body_fat: e.target.value })}
                      className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Notes</label>
                  <textarea value={logData.notes} onChange={e => setLogData({ ...logData, notes: e.target.value })}
                    className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 h-28 md:h-32 resize-none"
                    placeholder="Optional notes..." />
                </div>
                <div className="flex gap-3 md:gap-4 pt-4">
                  <button type="button" onClick={() => setIsLogModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-[1.5rem] font-black text-xs md:text-sm hover:bg-gray-200 transition-all">Cancel</button>
                  <button type="submit" disabled={actionLoading} className="flex-[2] py-4 bg-red-600 text-white rounded-[1.5rem] font-black text-xs md:text-sm hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 disabled:opacity-50">
                    {actionLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Workout Plan Modal — Trainer only */}
      <AnimatePresence>
        {isWorkoutModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsWorkoutModalOpen(false); setWorkoutText(workoutPlan?.description || ''); setWorkoutImageUrl(workoutPlan?.image_url || ''); }}
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl p-5 md:p-10 border border-white/50 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Workout Plan</h2>
                  <p className="text-gray-400 font-black mt-1 uppercase text-[10px] tracking-widest">{member?.name}</p>
                </div>
                <button onClick={() => { setIsWorkoutModalOpen(false); setWorkoutText(workoutPlan?.description || ''); setWorkoutImageUrl(workoutPlan?.image_url || ''); }} className="p-2 md:p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shrink-0">
                  <CloseCircle className="w-6 md:w-8 h-6 md:h-8" />
                </button>
              </div>

              <input type="file" ref={workoutFileRef} accept="image/*" onChange={handleWorkoutFile} className="hidden" />

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                  <textarea value={workoutText} onChange={e => setWorkoutText(e.target.value)}
                    className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 h-40 resize-none"
                    placeholder="Sets, reps, exercises, notes..." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Image (optional)</label>
                  <div className="flex items-center gap-4">
                    <button onClick={() => workoutFileRef.current?.click()} disabled={workoutUploading}
                      className="flex items-center gap-2 px-5 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-2xl hover:border-red-300 hover:bg-red-50/30 transition-all font-bold text-sm text-gray-500">
                      {workoutUploading ? <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="w-5 h-5 text-red-500" />}
                      {workoutUploading ? 'Uploading...' : workoutImageUrl ? 'Change Image' : 'Upload Image'}
                    </button>
                    {workoutImageUrl && (
                      <button onClick={() => window.open(workoutImageUrl, '_blank')} className="flex items-center gap-2 px-5 py-3 bg-pastel-blue rounded-2xl hover:bg-red-50 transition-all font-bold text-sm text-red-600">
                        <Eye className="w-5 h-5" /> View
                      </button>
                    )}
                  </div>
                  {workoutImageUrl && <img src={workoutImageUrl} alt="Workout" className="mt-4 w-full max-h-48 object-cover rounded-2xl border border-gray-200" />}
                </div>
                <div className="flex gap-3 md:gap-4 pt-4">
                  <button type="button" onClick={() => { setIsWorkoutModalOpen(false); setWorkoutText(workoutPlan?.description || ''); setWorkoutImageUrl(workoutPlan?.image_url || ''); }} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-[1.5rem] font-black text-xs md:text-sm hover:bg-gray-200 transition-all">Cancel</button>
                  <button onClick={handleSaveWorkout} disabled={actionLoading || (!workoutText && !workoutImageUrl)}
                    className="flex-[2] py-4 bg-brand-primary text-white rounded-[1.5rem] font-black text-xs md:text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50">
                    {actionLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Member Modal — Admin / Staff */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl p-5 md:p-10 border border-white/50 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Edit Member</h2>
                  <p className="text-gray-400 font-black mt-1 uppercase text-[10px] tracking-widest">{member?.name}</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 md:p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shrink-0">
                  <CloseCircle className="w-6 md:w-8 h-6 md:h-8" />
                </button>
              </div>

              <form onSubmit={handleEditSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Name</label>
                    <input type="text" required value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone</label>
                    <input type="tel" required value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                    <input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })}
                      className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">DOB</label>
                    <input type="date" required value={editData.dob} onChange={e => setEditData({ ...editData, dob: e.target.value })}
                      className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Plan</label>
                    <select value={editData.membership_plan} onChange={e => setEditData({ ...editData, membership_plan: e.target.value })}
                      className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                    >
                      <option value="">Select plan</option>
                      {plans.map((p: any) => (<option key={p.id} value={p.plan_name}>{p.plan_name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                    <select value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value })}
                      className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                    >
                      {CATEGORIES.map(c => (<option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Discount (%)</label>
                    <input type="number" min="0" max="100" value={editData.discount_percent} onChange={e => setEditData({ ...editData, discount_percent: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                      className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700" />
                  </div>
                </div>
                <div className="flex gap-3 md:gap-4 pt-4">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-[1.5rem] font-black text-xs md:text-sm hover:bg-gray-200 transition-all">Cancel</button>
                  <button type="submit" disabled={actionLoading} className="flex-[2] py-4 bg-brand-primary text-white rounded-[1.5rem] font-black text-xs md:text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50">
                    {actionLoading ? 'Saving...' : 'Save Changes'}
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
