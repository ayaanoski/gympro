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

  useEffect(() => {
    const unsubscribe = adminService.getAttendanceLogs(setLogs);
    return () => unsubscribe();
  }, []);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(logs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `Gym_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredLogs = logs.filter(log =>
    log.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Attendance Logs</h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">Monitor staff and trainer login activity records</p>
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
        <div className="p-8 border-b border-gray-50">
          <div className="relative max-w-md group">
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
                <th className="px-8 py-6 font-black">Employee</th>
                <th className="px-8 py-6 font-black text-center">Identity Role</th>
                <th className="px-8 py-6 font-black">Attendance Date</th>
                <th className="px-8 py-6 font-black text-right">Login Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-pastel-indigo rounded-2xl flex items-center justify-center text-brand-primary shadow-sm group-hover:scale-110 transition-transform">
                        <User className="w-6 h-6" />
                      </div>
                      <p className="text-base font-black text-gray-900">{log.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${log.role === 'admin' ? 'bg-pastel-purple text-red-600 border border-red-100' :
                        log.role === 'staff' ? 'bg-pastel-blue text-red-600 border border-red-100' :
                          'bg-pastel-emerald text-red-600 border border-red-100'
                      }`}>
                      {log.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {log.date}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 text-sm font-black text-gray-900">
                      <ClockCircle className="w-4 h-4 text-brand-primary" />
                      {log.login_time}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
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
