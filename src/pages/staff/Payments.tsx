import React, { useEffect, useState } from 'react';
import { staffService } from '../../services/staffService';
import {
  Dollar,
  Magnifer,
  Filter,
  Download,
  Calendar,
  Card,
  Wallet,
  Banknote
} from '@solar-icons/react';
import * as XLSX from 'xlsx';

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = staffService.getPayments((data) => {
      setPayments(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(payments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(workbook, `Gym_Payments_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredPayments = payments.filter(p =>
    p.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.member_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'UPI': return <Wallet className="w-4 h-4 text-purple-500" />;
      case 'Card': return <Card className="w-4 h-4 text-blue-500" />;
      default: return <Banknote className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-10 pb-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Financial Ledger</h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">Analyze and scale your revenue streams</p>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-sm hover:bg-black transition-all shadow-xl shadow-gray-200"
        >
          <Download className="w-5 h-5 transition-transform group-hover:translate-y-1" />
          Extract Financial Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-pastel-emerald rounded-[2.5rem] p-8 border border-emerald-100/50 shadow-premium relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <p className="text-emerald-600/70 text-[10px] font-black uppercase tracking-widest mb-2">Total Capital Flow</p>
          <p className="text-4xl font-black text-emerald-900 tracking-tight">₹{payments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-emerald-600/60 uppercase tracking-tighter">Verified Reserves</span>
          </div>
        </div>

        <div className="bg-pastel-blue rounded-[2.5rem] p-8 border border-blue-100/50 shadow-premium relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <p className="text-blue-600/70 text-[10px] font-black uppercase tracking-widest mb-2">Current Cycle Gain</p>
          <p className="text-4xl font-black text-blue-900 tracking-tight">₹{payments.filter(p => p.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-xs font-bold text-blue-600/60 uppercase tracking-tighter">Rolling Month Total</span>
          </div>
        </div>

        <div className="bg-pastel-purple rounded-[2.5rem] p-8 border border-purple-100/50 shadow-premium relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <p className="text-purple-600/70 text-[10px] font-black uppercase tracking-widest mb-2">Network Transactions</p>
          <p className="text-4xl font-black text-purple-900 tracking-tight">{payments.length}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full" />
            <span className="text-xs font-bold text-purple-600/60 uppercase tracking-tighter">Completed Operations</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden">
        <div className="p-8 border-b border-gray-50/50 flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Magnifer className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-brand-primary" />
            <input
              type="text"
              placeholder="Query by member name or transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-medium text-gray-600"
            />
          </div>
          <button className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-sm hover:scale-105 transition-all shadow-lg shadow-gray-200">
            <Filter className="w-5 h-5" />
            Refine Search
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-gray-50/50">
                <th className="px-8 py-6 font-black">Timeline</th>
                <th className="px-8 py-6 font-black">Payer Identity</th>
                <th className="px-8 py-6 font-black">Capital Units</th>
                <th className="px-8 py-6 font-black">Protocol</th>
                <th className="px-8 py-6 font-black">Strategic Package</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {filteredPayments.length > 0 ? filteredPayments.map((payment) => (
                <tr key={payment.id} className="group hover:bg-gray-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3 text-sm font-black text-gray-400">
                      <Calendar className="w-4 h-4 text-brand-primary/40" />
                      {payment.date}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-base font-black text-gray-900">{payment.member_name}</p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{payment.member_id}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-base font-black text-emerald-500">₹{payment.amount}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${payment.method === 'UPI' ? 'bg-pastel-purple text-purple-600' :
                      payment.method === 'Card' ? 'bg-pastel-blue text-blue-600' :
                        'bg-pastel-emerald text-emerald-600'
                      }`}>
                      {getMethodIcon(payment.method)}
                      {payment.method}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-4 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      {payment.plan_name}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Banknote className="w-8 h-8 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-black text-lg">No financial events recorded</p>
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
