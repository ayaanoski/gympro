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
  Banknote,
  TrashBinTrash
} from '@solar-icons/react';
import * as XLSX from 'xlsx';
import { db } from '../../firebase';

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

  const handleDelete = async (paymentId: string, memberName: string) => {
    if (!window.confirm(`Delete payment for ${memberName}? This cannot be undone.`)) return;
    try {
      await db.collection('payments').doc(paymentId).delete();
    } catch (err) {
      console.error(err);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'UPI': return <Wallet className="w-4 h-4 text-red-500" />;
      case 'Card': return <Card className="w-4 h-4 text-red-500" />;
      default: return <Banknote className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6 md:space-y-10 pb-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Financial Ledger</h1>
          <p className="text-gray-500 mt-2 text-sm md:text-lg font-medium">Analyze and scale your revenue streams</p>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-3 bg-gray-900 text-white px-6 md:px-8 py-4 rounded-[1.5rem] font-black text-sm hover:bg-black transition-all shadow-xl shadow-gray-200 w-full md:w-auto justify-center"
        >
          <Download className="w-5 h-5 transition-transform group-hover:translate-y-1" />
          Extract Financial Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className="bg-pastel-emerald rounded-[2.5rem] p-5 md:p-8 border border-red-100/50 shadow-premium relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <p className="text-red-600/70 text-[10px] font-black uppercase tracking-widest mb-2">Total Capital Flow</p>
          <p className="text-2xl md:text-4xl font-black text-red-900 tracking-tight">₹{payments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-red-600/60 uppercase tracking-tighter">Verified Reserves</span>
          </div>
        </div>

        <div className="bg-pastel-blue rounded-[2.5rem] p-5 md:p-8 border border-red-100/50 shadow-premium relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <p className="text-red-600/70 text-[10px] font-black uppercase tracking-widest mb-2">Current Cycle Gain</p>
          <p className="text-2xl md:text-4xl font-black text-red-900 tracking-tight">₹{payments.filter(p => p.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-xs font-bold text-red-600/60 uppercase tracking-tighter">Rolling Month Total</span>
          </div>
        </div>

        <div className="bg-pastel-purple rounded-[2.5rem] p-5 md:p-8 border border-red-100/50 shadow-premium relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <p className="text-red-600/70 text-[10px] font-black uppercase tracking-widest mb-2">Network Transactions</p>
          <p className="text-2xl md:text-4xl font-black text-red-900 tracking-tight">{payments.length}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-xs font-bold text-red-600/60 uppercase tracking-tighter">Completed Operations</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden">
        <div className="p-4 md:p-8 border-b border-gray-50/50 flex flex-col md:flex-row gap-4 md:gap-6">
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
          <button className="flex items-center gap-3 px-6 md:px-8 py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-sm hover:scale-105 transition-all shadow-lg shadow-gray-200 w-full md:w-auto justify-center">
            <Filter className="w-5 h-5" />
            Refine Search
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-gray-50/50">
                <th className="px-4 md:px-8 py-4 md:py-6 font-black">Timeline</th>
                <th className="px-4 md:px-8 py-4 md:py-6 font-black">Payer Identity</th>
                <th className="px-4 md:px-8 py-4 md:py-6 font-black">Capital Units</th>
                <th className="px-4 md:px-8 py-4 md:py-6 font-black">Protocol</th>
                <th className="px-4 md:px-8 py-4 md:py-6 font-black">Strategic Package</th>
                <th className="px-4 md:px-8 py-4 md:py-6 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {filteredPayments.length > 0 ? filteredPayments.map((payment) => (
                <tr key={payment.id} className="group hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <div className="flex items-center gap-2 md:gap-3 text-sm font-black text-gray-400 whitespace-nowrap">
                      <Calendar className="w-4 h-4 text-brand-primary/40 shrink-0" />
                      {payment.date}
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <p className="text-sm md:text-base font-black text-gray-900 truncate max-w-[120px] md:max-w-none">{payment.member_name}</p>
                    <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest truncate max-w-[120px] md:max-w-none">{payment.member_id}</p>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <p className="text-sm md:text-base font-black text-red-500">₹{payment.amount}</p>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <div className={`inline-flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${payment.method === 'UPI' ? 'bg-pastel-purple text-red-600' :
                      payment.method === 'Card' ? 'bg-pastel-blue text-red-600' :
                        'bg-pastel-emerald text-red-600'
                      }`}>
                      {getMethodIcon(payment.method)}
                      {payment.method}
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <span className="px-2 md:px-4 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">
                      {payment.plan_name}
                    </span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                    <button
                      onClick={() => handleDelete(payment.id, payment.member_name)}
                      className="p-2 md:p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm bg-white"
                      title="Delete Payment"
                    >
                      <TrashBinTrash className="w-4 md:w-5 h-4 md:h-5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 md:px-8 py-12 md:py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 md:w-20 h-16 md:h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Banknote className="w-6 md:w-8 h-6 md:h-8 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-black text-base md:text-lg">No financial events recorded</p>
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
