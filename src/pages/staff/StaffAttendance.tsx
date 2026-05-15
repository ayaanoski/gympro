import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import {
  Calendar,
  ClockCircle,
  User,
  Magnifer,
  CheckCircle,
  CloseCircle,
  Logout,
  UsersGroupTwoRounded
} from '@solar-icons/react';
import * as XLSX from 'xlsx';

export const StaffAttendance: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'staff' | 'member'>('staff');
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');

    const unsubToday = db.collection('staff_attendance')
      .where('user_id', '==', user.uid)
      .where('date', '==', today)
      .onSnapshot((snap) => {
        setTodayRecord(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
      });

    const unsubLogs = db.collection('staff_attendance')
      .orderBy('timestamp', 'desc')
      .onSnapshot((snap) => {
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

    return () => { unsubToday(); unsubLogs(); };
  }, [user]);

  const handleCheckIn = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await db.collection('staff_attendance').add({
        user_id: user.uid,
        name: userProfile?.name || 'Staff',
        role: 'staff',
        date: format(new Date(), 'yyyy-MM-dd'),
        login_time: new Date().toLocaleTimeString(),
        timestamp: new Date().toISOString()
      });
    } catch (err) { console.error(err); }
    setActionLoading(false);
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

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredLogs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `Gym_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const employeeRoles = ['admin', 'staff', 'trainer'];
  const filteredLogs = logs.filter(log => {
    const matchesRole = roleFilter === 'staff' ? employeeRoles.includes(log.role) : log.role === 'member';
    const matchesSearch = log.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.role?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 md:space-y-10 pb-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Attendance</h1>
          <p className="text-gray-500 mt-2 text-sm md:text-lg font-medium">Monitor {roleFilter === 'staff' ? 'staff and trainer' : 'member'} records</p>
        </div>
        <div className="flex items-center gap-3">
          {!todayRecord ? (
            <button onClick={handleCheckIn} disabled={actionLoading}
              className="flex items-center gap-2 bg-gray-900 text-white px-5 md:px-7 py-3 md:py-4 rounded-[1.5rem] font-black text-sm hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95 disabled:opacity-50">
              <ClockCircle className="w-5 h-5 text-red-400" />
              {actionLoading ? 'Checking in...' : 'Check In'}
            </button>
          ) : !todayRecord.logout_time ? (
            <button onClick={handleCheckOut} disabled={actionLoading}
              className="flex items-center gap-2 bg-red-600 text-white px-5 md:px-7 py-3 md:py-4 rounded-[1.5rem] font-black text-sm hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-50">
              <Logout className="w-5 h-5" />
              {actionLoading ? 'Checking out...' : 'Check Out'}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-5 md:px-7 py-3 md:py-4 bg-pastel-emerald text-red-600 rounded-[1.5rem] border border-red-100 font-black text-sm">
              <CheckCircle className="w-5 h-5" />
              Done Today
            </div>
          )}
          <button onClick={exportToExcel}
            className="flex items-center gap-2 bg-brand-primary text-white px-5 md:px-7 py-3 md:py-4 rounded-[1.5rem] font-black text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20">
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden">
        {/* Filters */}
        <div className="p-4 md:p-8 border-b border-gray-50 flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center justify-between">
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button onClick={() => setRoleFilter('staff')} className={`px-5 md:px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === 'staff' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
              Staff / Trainer
            </button>
            <button onClick={() => setRoleFilter('member')} className={`px-5 md:px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === 'member' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
              Members
            </button>
          </div>
          <div className="relative max-w-md group w-full md:w-auto">
            <Magnifer className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-brand-primary" />
            <input type="text" placeholder="Search by name or role..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-medium text-gray-600" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-gray-50/50">
                <th className="px-4 md:px-8 py-4 md:py-6 font-black">{roleFilter === 'staff' ? 'Employee' : 'Member'}</th>
                <th className="px-4 md:px-8 py-4 md:py-6 font-black text-center">Role</th>
                <th className="px-4 md:px-8 py-4 md:py-6 font-black">Date</th>
                <th className="px-4 md:px-8 py-4 md:py-6 font-black text-right">Login</th>
                {roleFilter === 'member' && <th className="px-4 md:px-8 py-4 md:py-6 font-black text-right">Logout</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 md:w-12 h-10 md:h-12 bg-pastel-indigo rounded-2xl flex items-center justify-center text-brand-primary shadow-sm group-hover:scale-110 transition-transform shrink-0">
                        <User className="w-5 md:w-6 h-5 md:h-6" />
                      </div>
                      <p className="text-sm md:text-base font-black text-gray-900 truncate">{log.name}</p>
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-center">
                    <span className={`inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${log.role === 'admin' ? 'bg-pastel-purple text-red-600 border border-red-100' :
                        log.role === 'staff' ? 'bg-pastel-blue text-red-600 border border-red-100' :
                        log.role === 'trainer' ? 'bg-pastel-emerald text-red-600 border border-red-100' :
                          'bg-pastel-orange text-orange-600 border border-orange-100'
                      }`}>
                      {log.role}
                    </span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                    <div className="flex items-center gap-2 md:gap-3 text-sm font-bold text-gray-500">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      {log.date}
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2 md:gap-3 text-sm font-black text-gray-900">
                      <ClockCircle className="w-4 h-4 text-brand-primary shrink-0" />
                      {log.login_time}
                    </div>
                  </td>
                  {roleFilter === 'member' && (
                    <td className="px-4 md:px-8 py-4 md:py-6 text-right whitespace-nowrap">
                      <span className="text-sm font-black text-gray-400">{log.logout_time || '—'}</span>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={roleFilter === 'member' ? 5 : 4} className="px-4 md:px-8 py-12 md:py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 md:w-20 h-16 md:h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <UsersGroupTwoRounded className="w-6 md:w-8 h-6 md:h-8 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-black text-base md:text-lg">No attendance records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
