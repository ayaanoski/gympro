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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500">Track your gym's revenue</p>
        </div>
        <button 
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-200"
        >
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900">₹{payments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium mb-1">This Month</p>
          <p className="text-3xl font-bold text-emerald-600">₹{payments.filter(p => p.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium mb-1">Transactions</p>
          <p className="text-3xl font-bold text-gray-900">{payments.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Magnifer className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by member name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100">
            <Filter className="w-5 h-5" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-50">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Member</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium">Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayments.length > 0 ? filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {payment.date}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{payment.member_name}</p>
                    <p className="text-xs text-gray-500">{payment.member_id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-emerald-600">₹{payment.amount}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {getMethodIcon(payment.method)}
                      {payment.method}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {payment.plan_name}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No payment records found
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
