import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { 
  UsersGroupTwoRounded, 
  UserCheck, 
  UserCross, 
  GraphUp, 
  Dollar, 
  ClockCircle,
  AddCircle
} from '@solar-icons/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    expiringSoon: 0,
    totalRevenue: 0,
    recentPayments: [] as any[],
    recentAdmissions: [] as any[]
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch members stats
      const membersSnap = await db.collection('members').get();
      const members = membersSnap.docs.map(doc => doc.data());
      
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);

      const total = members.length;
      const active = members.filter(m => m.status === 'active').length;
      const expired = members.filter(m => m.status === 'expired').length;
      const expiring = members.filter(m => {
        const expiry = new Date(m.expiry_date);
        return m.status === 'active' && expiry > now && expiry <= sevenDaysFromNow;
      }).length;

      // Fetch payments for revenue
      const paymentsSnap = await db.collection('payments').orderBy('date', 'desc').limit(10).get();
      const payments = paymentsSnap.docs.map(doc => doc.data());
      
      const allPaymentsSnap = await db.collection('payments').get();
      const totalRev = allPaymentsSnap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);

      // Prepare revenue chart data (last 6 months)
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(), i);
        return format(d, 'MMM');
      }).reverse();

      const chartData = months.map(month => ({
        name: month,
        revenue: Math.floor(Math.random() * 50000) + 10000 // Mock for now, would aggregate from payments
      }));

      setStats({
        totalMembers: total,
        activeMembers: active,
        expiredMembers: expired,
        expiringSoon: expiring,
        totalRevenue: totalRev,
        recentPayments: payments,
        recentAdmissions: members.slice(0, 5)
      });
      setRevenueData(chartData);
    };

    fetchData();
  }, []);

  const statCards = [
    { name: 'Total Members', value: stats.totalMembers, icon: UsersGroupTwoRounded, color: 'bg-blue-50 text-blue-600' },
    { name: 'Active Members', value: stats.activeMembers, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Expired Members', value: stats.expiredMembers, icon: UserCross, color: 'bg-red-50 text-red-600' },
    { name: 'Expiring Soon', value: stats.expiringSoon, icon: ClockCircle, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Overview of your gym's performance</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
            <Dollar className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Total Revenue</p>
              <p className="text-lg font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.name} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center mb-4`}>
              <card.icon className="w-6 h-6" />
            </div>
            <p className="text-gray-500 text-sm font-medium">{card.name}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Revenue Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Recent Payments</h3>
          <div className="space-y-4">
            {stats.recentPayments.length > 0 ? stats.recentPayments.map((payment, i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Dollar className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Payment Received</p>
                    <p className="text-xs text-gray-500">{payment.date}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-emerald-600">+₹{payment.amount}</p>
              </div>
            )) : (
              <p className="text-center text-gray-500 py-8">No recent payments</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Admissions */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Recent New Admissions</h3>
          <button className="text-emerald-600 text-sm font-bold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wider">
                <th className="pb-4 font-medium">Member</th>
                <th className="pb-4 font-medium">Plan</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 font-medium">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentAdmissions.length > 0 ? stats.recentAdmissions.map((member, i) => (
                <tr key={i} className="group">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden">
                        {member.photo ? <img src={member.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">{member.name[0]}</div>}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-600">{member.membership_plan}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${member.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-gray-500">{member.start_date}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">No members found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
