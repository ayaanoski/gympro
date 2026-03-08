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

export const TrainerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    assignedMembers: [] as any[],
    recentProgress: [] as any[],
    attendanceStatus: false
  });
  const [loading, setLoading] = useState(false);

  const handleMarkAttendance = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await trainerService.markAttendance(user.uid, user.displayName || 'Trainer');
      setStats(prev => ({ ...prev, attendanceStatus: true }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const unsubscribe = trainerService.getAssignedMembers(user.uid, (members) => {
      // Fetch recent progress updates for these members
      const memberIds = members.map(m => m.id);
      
      const updateStats = async () => {
        let progress: any[] = [];
        if (memberIds.length > 0) {
          const progressSnap = await db.collection('progress')
            .where('member_id', 'in', memberIds.slice(0, 10))
            .orderBy('date', 'desc')
            .limit(5)
            .get();
          progress = progressSnap.docs.map(doc => doc.data());
        }

        const today = format(new Date(), 'yyyy-MM-dd');
        const attendanceSnap = await db.collection('staff_attendance')
          .where('user_id', '==', user.uid)
          .where('date', '==', today)
          .get();

        setStats({
          assignedMembers: members,
          recentProgress: progress,
          attendanceStatus: !attendanceSnap.empty
        });
      };

      updateStats();
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trainer Dashboard</h1>
          <p className="text-gray-500">Manage your athletes</p>
        </div>
        <div className="flex items-center gap-3">
          {!stats.attendanceStatus && (
            <button 
              onClick={handleMarkAttendance}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-100 disabled:opacity-50"
            >
              <ClockCircle className="w-5 h-5" />
              {loading ? 'Marking...' : 'Mark Attendance'}
            </button>
          )}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${stats.attendanceStatus ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
            <CheckCircle className="w-5 h-5" />
            {stats.attendanceStatus ? 'Checked In' : 'Not Checked In'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <UsersGroupTwoRounded className="w-6 h-6" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Assigned Members</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.assignedMembers.length}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <ClipboardList className="w-6 h-6" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Active Plans</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.assignedMembers.length}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <GraphUp className="w-6 h-6" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Recent Updates</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.recentProgress.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assigned Members List */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Assigned Members</h3>
          <div className="space-y-4">
            {stats.assignedMembers.length > 0 ? stats.assignedMembers.map((member, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {member.photo ? <img src={member.photo} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.status.toUpperCase()}</p>
                  </div>
                </div>
                <AltArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600 transition-colors" />
              </div>
            )) : (
              <p className="text-center text-gray-500 py-8">No members assigned to you</p>
            )}
          </div>
        </div>

        {/* Recent Progress */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Recent Progress Updates</h3>
          <div className="space-y-4">
            {stats.recentProgress.length > 0 ? stats.recentProgress.map((update, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-gray-500 font-bold uppercase">{update.date}</p>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    {update.weight} kg
                  </span>
                </div>
                <p className="text-sm text-gray-700 italic">"{update.notes}"</p>
              </div>
            )) : (
              <p className="text-center text-gray-500 py-8">No recent progress records</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
