import React, { useEffect, useState } from 'react';
import { financeService } from '../../services/financeService';
import { adminService } from '../../services/adminService';
import {
  Wallet,
  AddCircle,
  TrashBinTrash,
  CloseCircle,
  Document
} from '@solar-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Rent',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const categories = ['Rent', 'Utilities', 'Maintenance', 'Marketing', 'Payroll', 'Equipment', 'Miscellaneous'];

  useEffect(() => {
    const unsubscribe = financeService.getExpenses(setExpenses);
    return () => unsubscribe();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await financeService.addExpense({
        ...formData,
        amount: Number(formData.amount)
      });
      setIsModalOpen(false);
      setFormData({
        title: '',
        amount: '',
        category: 'Rent',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
    } catch (err: any) {
      alert(err.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Delete this expense record?')) return;
    try {
      await financeService.deleteExpense(id);
    } catch (err) {
      console.error(err);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(expenses);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, `Gym_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const currentMonthExpenses = expenses
    .filter(e => e.date && e.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6 md:space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Expenses</h1>
          <p className="text-gray-500 mt-2 text-sm md:text-lg font-medium">Track your gym's outgoing capital</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-3 bg-white text-gray-700 px-6 py-4 rounded-[1.5rem] font-black text-sm hover:bg-gray-50 border border-gray-100 transition-all shadow-sm"
          >
            <Document className="w-5 h-5" />
            Export
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 bg-brand-primary text-white px-6 md:px-8 py-4 rounded-[1.5rem] font-black text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20"
          >
            <AddCircle className="w-5 h-5" />
            Log Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <div className="bg-white rounded-[2.5rem] p-5 md:p-8 border border-gray-100 shadow-premium relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Expenses (All Time)</p>
          <p className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">₹{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-pastel-pink rounded-[2.5rem] p-5 md:p-8 border border-pink-100/50 shadow-premium relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <p className="text-pink-600/70 text-[10px] font-black uppercase tracking-widest mb-2">This Month's Expenses</p>
          <p className="text-2xl md:text-4xl font-black text-pink-900 tracking-tight">₹{currentMonthExpenses.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-gray-50/50">
                <th className="px-4 md:px-8 py-4 md:py-6">Date</th>
                <th className="px-4 md:px-8 py-4 md:py-6">Title</th>
                <th className="px-4 md:px-8 py-4 md:py-6">Category</th>
                <th className="px-4 md:px-8 py-4 md:py-6">Amount</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {expenses.length > 0 ? expenses.map((expense) => (
                <tr key={expense.id} className="group hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 md:px-8 py-4 md:py-6 text-sm font-black text-gray-400">{expense.date}</td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <p className="text-sm md:text-base font-black text-gray-900">{expense.title}</p>
                    <p className="text-[10px] text-gray-400 font-bold truncate max-w-[200px]">{expense.description}</p>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black uppercase text-gray-500">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <p className="text-sm font-black text-pink-500">₹{expense.amount?.toLocaleString()}</p>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="p-2 md:p-3 text-gray-300 hover:text-pink-500 hover:bg-pink-50 rounded-xl transition-all shadow-sm bg-white"
                    >
                      <TrashBinTrash className="w-4 md:w-5 h-4 md:h-5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 md:px-8 py-12 md:py-20 text-center text-gray-400 font-black">
                    No expenses recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl p-6 md:p-8 border border-white/50"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-900">Log Expense</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500">
                  <CloseCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Title</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none font-bold text-gray-700" placeholder="e.g. Electric Bill" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Amount (₹)</label>
                    <input type="number" required min="0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none font-bold text-gray-700" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Date</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none font-bold text-gray-700" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none font-bold text-gray-700">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Description (Optional)</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none font-bold text-gray-700" placeholder="Additional details..." rows={2} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-4 mt-4 bg-brand-primary text-white rounded-[1.5rem] font-black text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50">
                  {loading ? 'Processing...' : 'Save Expense'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
