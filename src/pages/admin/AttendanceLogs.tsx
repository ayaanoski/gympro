import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import {
  Calendar,
  ClockCircle,
  User,
  Shield,
  Magnifer,
  Download,
  UsersGroupTwoRounded
} from '@solar-icons/react';
import * as XLSX from 'xlsx';

export const AttendanceLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'staff' | 'member'>('staff');

  useEffect(() => {
    adminService.getAttendanceLogsOnce().then(setLogs);
  }, []);

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
    <div className="space-y-10 pb-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Attendance Logs</h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">Monitor {roleFilter === 'staff' ? 'staff and trainer' : 'member'} attendance records</p>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-3 bg-brand-primary text-white px-8 py-4 rounded-[1.5rem] font-black text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20"
        >
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden">
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
            <input
              type="text"
              placeholder="Search by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-medium text-gray-600"
            />
          </div>
        </div>

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
                  <td colSpan={roleFilter === 'member' ? 5 : 4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <UsersGroupTwoRounded className="w-8 h-8 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-black text-lg">No attendance logs discovered</p>
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
