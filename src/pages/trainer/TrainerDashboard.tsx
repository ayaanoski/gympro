import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { trainerService } from '../../services/trainerService';
import {
  UsersGroupTwoRounded,
  ClipboardList,
  GraphUp,
  CheckCircle,
  AltArrowRight,
  User,
  ClockCircle
} from '@solar-icons/react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export const TrainerDashboard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'members'>('overview');
  const [members, setMembers] = useState<any[]>([]);
  const [progressUpdates, setProgressUpdates] = useState<any[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    // 1. Real-time Assigned Members
    const unsubscribeMembers = db.collection('members')
      .where('trainer_id', '==', user.uid)
      .onSnapshot((snap) => {
        const membersList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMembers(membersList);
        setLoading(false);
      });

    // 2. Real-time Attendance Status
    const today = format(new Date(), 'yyyy-MM-dd');
    const unsubscribeAttendance = db.collection('staff_attendance')
      .where('user_id', '==', user.uid)
      .where('date', '==', today)
      .onSnapshot((snap) => {
        setIsCheckedIn(!snap.empty);
      });

    return () => {
      unsubscribeMembers();
      unsubscribeAttendance();
    };
  }, [user]);

  // Handle Progress Updates in separate effect to avoid nested listeners
  useEffect(() => {
    if (members.length === 0) return;

    const memberIds = members.map(m => m.id);
    const unsubscribeProgress = db.collection('progress')
      .where('member_id', 'in', memberIds.slice(0, 10))
      .onSnapshot((snap) => {
        const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        logs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setProgressUpdates(logs.slice(0, 8));
      });

    return () => unsubscribeProgress();
  }, [members]);

  const handleCheckIn = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await trainerService.markAttendance(user.uid, userProfile?.name || user.displayName || 'Trainer');
    } catch (err) {
      console.error(err);
      alert('Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-10 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Performance Command</h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">Coordinate and track your athlete grid</p>
        </div>

        <div className="flex items-center gap-4">
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="px-8 py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-sm hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center gap-3 active:scale-95 disabled:opacity-50"
            >
              <ClockCircle className="w-5 h-5 text-emerald-400" />
              {actionLoading ? 'Initializing...' : 'Authorize Check-In'}
            </button>
          ) : (
            <div className="px-8 py-4 bg-pastel-emerald text-emerald-600 rounded-[1.5rem] border border-emerald-100 font-black text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              Operational Status: Active
            </div>
          )}
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex bg-white p-2 rounded-[2rem] shadow-premium border border-gray-100 w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
            }`}
        >
          Grid Overview
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'members' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
            }`}
        >
          My Athletes
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-premium group">
              <div className="w-14 h-14 bg-pastel-blue text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UsersGroupTwoRounded className="w-7 h-7" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Athletes</p>
              <p className="text-4xl font-black text-gray-900 mt-2">{members.length}</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-premium group">
              <div className="w-14 h-14 bg-pastel-purple text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ClipboardList className="w-7 h-7" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocols Assigned</p>
              <p className="text-4xl font-black text-gray-900 mt-2">{members.length}</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-premium group">
              <div className="w-14 h-14 bg-pastel-emerald text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <GraphUp className="w-7 h-7" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weekly Growth Logs</p>
              <p className="text-4xl font-black text-gray-900 mt-2">{progressUpdates.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Quick Athlete Access */}
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-premium overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Assigned Roster</h3>
                <button onClick={() => setActiveTab('members')} className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                {members.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    onClick={() => navigate(`/members/${member.id}`)}
                    className="flex items-center justify-between p-5 bg-gray-50/50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 rounded-2xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-pastel-indigo rounded-2xl flex items-center justify-center font-black text-brand-primary overflow-hidden">
                        {member.photo ? <img src={member.photo} alt="" className="w-full h-full object-cover" /> : member.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{member.name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{member.expiry_date} Phase End</p>
                      </div>
                    </div>
                    <AltArrowRight className="w-5 h-5 text-gray-300 group-hover:text-brand-primary transition-all" />
                  </div>
                ))}
                {members.length === 0 && <p className="text-center py-10 text-gray-400 font-bold uppercase text-[10px] tracking-widest">No athletes assigned yet</p>}
              </div>
            </div>

            {/* Recent Growth Logs */}
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-premium h-fit">
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-8">Growth Stream</h3>
              <div className="space-y-6">
                {progressUpdates.map((update, i) => (
                  <div key={update.id || i} className="p-6 bg-pastel-emerald/10 border-l-4 border-emerald-500 rounded-r-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-sm font-black text-gray-900">
                          {members.find(m => m.id === update.member_id)?.name || 'Athlete'}
                        </p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{update.date}</p>
                      </div>
                      <span className="px-4 py-2 bg-white text-emerald-600 rounded-xl text-sm font-black shadow-sm">
                        {update.weight} KG
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-600 line-clamp-2 leading-relaxed">{update.notes}</p>
                  </div>
                ))}
                {progressUpdates.length === 0 && <p className="text-center py-10 text-gray-400 font-bold uppercase text-[10px] tracking-widest">No growth logs recorded</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-premium overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Athlete Identity</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Type</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contract Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((member) => (
                  <tr key={member.id} className="group hover:bg-gray-50/50 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-pastel-indigo rounded-2xl flex items-center justify-center font-black text-brand-primary overflow-hidden">
                          {member.photo ? <img src={member.photo} alt="" className="w-full h-full object-cover" /> : member.name[0]}
                        </div>
                        <div>
                          <p className="text-base font-black text-gray-900">{member.name}</p>
                          <p className="text-xs font-bold text-gray-400">{member.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-gray-600">
                      <span className="px-4 py-1.5 bg-pastel-purple/30 text-purple-600 rounded-full border border-purple-100">
                        {member.membership_plan}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${member.status === 'active' ? 'bg-pastel-emerald text-emerald-500 border border-emerald-100' : 'bg-pastel-pink text-pink-500 border border-pink-100'
                        }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => navigate(`/members/${member.id}`)}
                        className="p-3 bg-white text-gray-400 hover:text-brand-primary hover:bg-pastel-indigo rounded-xl transition-all shadow-sm border border-gray-100"
                      >
                        <AltArrowRight className="w-6 h-6" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
