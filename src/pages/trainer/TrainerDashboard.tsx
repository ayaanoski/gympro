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
  ClockCircle,
  Magnifer,
  AltArrowLeft,
  Dumbbell,
  FileText,
  Logout
} from '@solar-icons/react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ImageViewer } from '../../components/ImageViewer';

export const TrainerDashboard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [progressUpdates, setProgressUpdates] = useState<any[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<Record<string, any>>({});
  const [dietPlans, setDietPlans] = useState<Record<string, any>>({});
  const [viewerSrc, setViewerSrc] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 10;

  const filteredMembers = members.filter((m: any) =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone?.includes(searchQuery)
  );
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PER_PAGE));
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  useEffect(() => {
    if (!user) return;

    const unsubMembers = db.collection('members')
      .where('trainer_id', '==', user.uid)
      .onSnapshot((snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMembers(list);
        setLoading(false);
      });

    const today = format(new Date(), 'yyyy-MM-dd');
    const unsubAttendance = db.collection('staff_attendance')
      .where('user_id', '==', user.uid)
      .where('date', '==', today)
      .onSnapshot((snap) => {
        setTodayRecord(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
      });

    return () => {
      unsubMembers();
      unsubAttendance();
    };
  }, [user]);

  // Separate effect for progress, workout & diet plans — uses members list
  useEffect(() => {
    if (members.length === 0) return;
    const memberIds = members.map((m: any) => m.id);
    const ids = memberIds.slice(0, 10);

    const unsubProgress = db.collection('progress')
      .where('member_id', 'in', ids)
      .onSnapshot((snap) => {
        const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        logs.sort((a: any, b: any) => (b.date || '') > (a.date || '') ? 1 : -1);
        setProgressUpdates(logs.slice(0, 10));
      });

    const unsubWorkouts = db.collection('workout_plans')
      .where('member_id', 'in', ids)
      .onSnapshot((snap) => {
        const plans: Record<string, any> = {};
        snap.docs.forEach(d => { const data = d.data(); plans[data.member_id] = data; });
        setWorkoutPlans(plans);
      });

    const unsubDiets = db.collection('diet_plans')
      .where('member_id', 'in', ids)
      .onSnapshot((snap) => {
        const plans: Record<string, any> = {};
        snap.docs.forEach(d => { const data = d.data(); plans[data.member_id] = data; });
        setDietPlans(plans);
      });

    return () => { unsubProgress(); unsubWorkouts(); unsubDiets(); };
  }, [members]);

  useEffect(() => {
    if (members.length === 0) return;

    const memberIds = members.map(m => m.id);
    const unsubProgress = db.collection('progress')
      .where('member_id', 'in', memberIds.slice(0, 10))
      .onSnapshot((snap) => {
        const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        logs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setProgressUpdates(logs.slice(0, 8));
      });

    return () => unsubProgress();
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

  const handleCheckOut = async () => {
    if (!user || !todayRecord?.id) return;
    setActionLoading(true);
    try {
      await db.collection('staff_attendance').doc(todayRecord.id).update({
        logout_time: new Date().toLocaleTimeString()
      });
    } catch (err) { console.error(err); }
    setActionLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">My Athletes</h1>
          <p className="text-gray-500 mt-2 text-sm md:text-lg font-medium">{members.length} assigned members</p>
        </div>
        <div className="flex items-center gap-3">
          {!todayRecord ? (
            <button onClick={handleCheckIn} disabled={actionLoading}
              className="flex items-center gap-2 bg-gray-900 text-white px-5 md:px-7 py-3 md:py-4 rounded-[1.5rem] font-black text-sm hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95 disabled:opacity-50">
              <ClockCircle className="w-5 h-5 text-red-400" />
              {actionLoading ? '...' : 'Check In'}
            </button>
          ) : !todayRecord.logout_time ? (
            <button onClick={handleCheckOut} disabled={actionLoading}
              className="flex items-center gap-2 bg-red-600 text-white px-5 md:px-7 py-3 md:py-4 rounded-[1.5rem] font-black text-sm hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-50">
              <Logout className="w-5 h-5" />
              {actionLoading ? '...' : 'Check Out'}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-5 md:px-7 py-3 md:py-4 bg-pastel-emerald text-red-600 rounded-[1.5rem] border border-red-100 font-black text-sm">
              <CheckCircle className="w-5 h-5" />
              Done
            </div>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-premium group">
          <div className="w-12 md:w-14 h-12 md:h-14 bg-pastel-blue text-red-600 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
            <UsersGroupTwoRounded className="w-6 md:w-7 h-6 md:h-7" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Athletes</p>
          <p className="text-3xl md:text-4xl font-black text-gray-900 mt-2">{members.length}</p>
        </div>
        <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-premium group">
          <div className="w-12 md:w-14 h-12 md:h-14 bg-pastel-purple text-red-600 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
            <ClipboardList className="w-6 md:w-7 h-6 md:h-7" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Plans</p>
          <p className="text-3xl md:text-4xl font-black text-gray-900 mt-2">{members.filter((m: any) => m.status === 'active').length}</p>
        </div>
        <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-premium group">
          <div className="w-12 md:w-14 h-12 md:h-14 bg-pastel-emerald text-red-600 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
            <GraphUp className="w-6 md:w-7 h-6 md:h-7" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress Logs</p>
          <p className="text-3xl md:text-4xl font-black text-gray-900 mt-2">{progressUpdates.length}</p>
        </div>
      </div>

      {/* Recent Progress */}
      {progressUpdates.length > 0 && (
        <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-premium">
          <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight mb-4 md:mb-6">Recent Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {progressUpdates.slice(0, 6).map((log: any) => {
              const member = members.find((m: any) => m.id === log.member_id);
              return (
                <div key={log.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <p className="text-sm font-black text-gray-900 truncate">{member?.name || 'Unknown'}</p>
                    <p className="text-[10px] font-black text-gray-400 whitespace-nowrap">{log.date}</p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {log.weight && <p className="text-xs font-bold text-gray-600">Weight: {log.weight} KG</p>}
                    {log.height && <p className="text-xs font-bold text-gray-600">Height: {log.height} CM</p>}
                    {log.body_fat && <p className="text-xs font-bold text-gray-600">Body Fat: {log.body_fat}%</p>}
                  </div>
                  {log.notes && <p className="text-xs font-bold text-gray-400 mt-2 line-clamp-1">{log.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workout & Diet Plans Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-premium">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pastel-purple rounded-2xl border border-red-100">
              <Dumbbell className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Workout Plans</h3>
          </div>
          {members.length > 0 ? (
            <div className="space-y-3">
              {members.slice(0, 5).map((m: any) => {
                const wp = workoutPlans[m.id];
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate min-w-0">{m.name}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {wp?.image_url ? (
                        <img src={wp.image_url} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-200 cursor-pointer" onClick={() => { setViewerSrc(wp.image_url); setViewerOpen(true); }} />
                      ) : wp?.description ? (
                        <span className="text-[10px] font-black text-red-600 bg-pastel-emerald px-2 py-1 rounded-full">Set</span>
                      ) : (
                        <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-full">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-6 text-gray-400 font-black text-[10px] uppercase tracking-widest">No athletes assigned</p>
          )}
        </div>

        <div className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-premium">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pastel-emerald rounded-2xl border border-red-100">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Diet Plans</h3>
          </div>
          {members.length > 0 ? (
            <div className="space-y-3">
              {members.slice(0, 5).map((m: any) => {
                const dp = dietPlans[m.id];
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate min-w-0">{m.name}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {dp?.image_url ? (
                        <img src={dp.image_url} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-200 cursor-pointer" onClick={() => { setViewerSrc(dp.image_url); setViewerOpen(true); }} />
                      ) : dp?.description ? (
                        <span className="text-[10px] font-black text-red-600 bg-pastel-emerald px-2 py-1 rounded-full">Set</span>
                      ) : (
                        <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-full">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-6 text-gray-400 font-black text-[10px] uppercase tracking-widest">No athletes assigned</p>
          )}
        </div>
      </div>

      {/* Image Viewer */}
      <ImageViewer src={viewerSrc} open={viewerOpen} onClose={() => setViewerOpen(false)} />

      {/* Athletes List */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-premium overflow-hidden">
        <div className="p-4 md:p-8 border-b border-gray-50/50">
          <div className="relative group">
            <Magnifer className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-brand-primary" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-medium text-gray-600"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-4 md:px-8 py-4 md:py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Athlete</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedMembers.map((member) => (
                <tr key={member.id} className="group hover:bg-gray-50/50 transition-all">
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 md:w-12 h-10 md:h-12 bg-pastel-indigo rounded-2xl flex items-center justify-center font-black text-brand-primary overflow-hidden shrink-0">
                        {member.photo ? <img src={member.photo} alt="" className="w-full h-full object-cover" /> : member.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm md:text-base font-black text-gray-900 truncate">{member.name}</p>
                        <p className="text-xs font-bold text-gray-400 truncate">{member.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-sm font-bold text-gray-600">
                    <span className="px-3 md:px-4 py-1.5 bg-pastel-purple/30 text-red-600 rounded-full border border-red-100 text-[10px] md:text-sm whitespace-nowrap">{member.membership_plan}</span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <span className={`inline-flex items-center px-2 md:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${member.status === 'active' ? 'bg-pastel-emerald text-red-500 border border-red-100' : 'bg-pastel-pink text-pink-500 border border-pink-100'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                    <button
                      onClick={() => navigate(`/members/${member.id}`)}
                      className="p-2 md:p-3 bg-white text-gray-400 hover:text-brand-primary hover:bg-pastel-indigo rounded-xl transition-all shadow-sm border border-gray-100"
                      title="View Profile"
                    >
                      <AltArrowRight className="w-5 md:w-6 h-5 md:h-6" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">
                      {searchQuery ? 'No athletes match your search' : 'No athletes assigned yet'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 md:p-8 border-t border-gray-50/50 flex items-center justify-between gap-4">
            <p className="text-xs font-bold text-gray-400">
              Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filteredMembers.length)} of {filteredMembers.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white text-gray-400 hover:text-brand-primary rounded-xl transition-all border border-gray-100 disabled:opacity-30"
              >
                <AltArrowLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === page ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 border border-gray-100'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white text-gray-400 hover:text-brand-primary rounded-xl transition-all border border-gray-100 disabled:opacity-30"
              >
                <AltArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
