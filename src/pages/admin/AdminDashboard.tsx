import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import {
  UsersGroupTwoRounded,
  UserCheck,
  UserCross,
  GraphUp,
  Dollar,
  ClockCircle,
  AddCircle,
  CloseCircle
} from '@solar-icons/react';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { format, subMonths, subWeeks, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    expiringSoon: 0,
    totalRevenue: 0,
    recentPayments: [] as any[],
    recentAdmissions: [] as any[],
    growthRates: {
      totalMembers: 0,
      activeMembers: 0,
      expiredMembers: 0,
      expiringSoon: 0
    },
    revenuePerformance: 0
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [isChartExpanded, setIsChartExpanded] = useState(false);

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

      // Fetch all payments for aggregation
      const allPaymentsSnap = await db.collection('payments').get();
      const allPayments = allPaymentsSnap.docs.map(doc => ({
        ...doc.data(),
        amount: Number(doc.data().amount) || 0,
        dateObj: new Date(doc.data().date)
      }));

      const recentPayments = [...allPayments]
        .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
        .slice(0, 10);

      const totalRev = allPayments.reduce((acc, p) => acc + p.amount, 0);

      // Generate dynamic chart data based on timeRange
      let chartData: any[] = [];
      if (timeRange === 'daily') {
        chartData = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i)); // Last 7 days
          const dateStr = format(d, 'yyyy-MM-dd');
          const dayAmount = allPayments
            .filter(p => format(p.dateObj, 'yyyy-MM-dd') === dateStr)
            .reduce((acc, p) => acc + p.amount, 0);
          return { name: format(d, 'EEE'), revenue: dayAmount };
        });
      } else if (timeRange === 'weekly') {
        chartData = Array.from({ length: 4 }, (_, i) => {
          const currentWeekStart = startOfWeek(now);
          const start = subWeeks(currentWeekStart, 3 - i); // Last 4 weeks
          const end = endOfWeek(start);

          const weekAmount = allPayments.filter(p =>
            isWithinInterval(p.dateObj, { start, end })
          ).reduce((acc, p) => acc + p.amount, 0);

          return { name: `Week ${i + 1}`, revenue: weekAmount };
        });
      } else if (timeRange === 'monthly') {
        chartData = Array.from({ length: 6 }, (_, i) => {
          const d = subMonths(now, 5 - i); // Last 6 months
          const monthStr = format(d, 'yyyy-MM');
          const monthAmount = allPayments
            .filter(p => format(p.dateObj, 'yyyy-MM') === monthStr)
            .reduce((acc, p) => acc + p.amount, 0);
          return { name: format(d, 'MMM'), revenue: monthAmount };
        });
      } else { // Yearly
        const currentYear = now.getFullYear();
        chartData = Array.from({ length: 4 }, (_, i) => {
          const year = currentYear - (3 - i); // Last 4 years
          const yearAmount = allPayments
            .filter(p => p.dateObj.getFullYear() === year)
            .reduce((acc, p) => acc + p.amount, 0);
          return { name: year.toString(), revenue: yearAmount };
        });
      }

      // Calculate growth rates from real data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const joinedLast30Days = members.filter((m: any) => {
        const start = new Date(m.start_date);
        return start >= thirtyDaysAgo && start <= now;
      }).length;

      const totalGrowth = total > 0 ? Math.round((joinedLast30Days / total) * 100) : 0;
      const activeGrowth = (total - expired) > 0 ? Math.round((active / Math.max(total - expired, 1)) * 100) : 0;
      const expiredGrowth = total > 0 ? Math.round((expired / total) * 100) : 0;
      const expiringGrowth = active > 0 ? Math.round((expiring / active) * 100) : 0;

      // Calculate revenue performance (last period vs previous)
      let revenueGrowth = 0;
      if (chartData.length >= 2) {
        const last = chartData[chartData.length - 1].revenue;
        const prev = chartData[chartData.length - 2].revenue;
        revenueGrowth = prev > 0 ? Math.round(((last - prev) / prev) * 100) : (last > 0 ? 100 : 0);
      }

      setStats({
        totalMembers: total,
        activeMembers: active,
        expiredMembers: expired,
        expiringSoon: expiring,
        totalRevenue: totalRev,
        recentPayments: recentPayments,
        recentAdmissions: members.slice(0, 5),
        growthRates: {
          totalMembers: totalGrowth,
          activeMembers: activeGrowth,
          expiredMembers: expiredGrowth,
          expiringSoon: expiringGrowth
        },
        revenuePerformance: revenueGrowth
      });
      setRevenueData(chartData);
    };

    fetchData();
  }, [timeRange]);

  const RenderChart = ({ height = 320, idPrefix = 'main' }: { height?: number, idPrefix?: string }) => {
    if (!revenueData || revenueData.length === 0) {
      return (
        <div className="flex items-center justify-center w-full h-full text-gray-400 font-bold uppercase text-[10px] tracking-widest">
          No data for this period
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={revenueData}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          <defs>
            <linearGradient id={`${idPrefix}RevenueGradient`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`${idPrefix}RevenueStroke`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}
            dy={15}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900' }}
            tickFormatter={(val) => val > 0 ? `₹${val / 1000}k` : '0'}
          />
          <Tooltip
            cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '4 4' }}
            contentStyle={{
              borderRadius: '24px',
              border: 'none',
              boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
              padding: '20px',
              backgroundColor: '#111827',
              color: '#fff'
            }}
            itemStyle={{ color: '#fff', fontWeight: '900', fontSize: '14px' }}
            labelStyle={{ color: '#6366f1', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'NET REVENUE']}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={`url(#${idPrefix}RevenueStroke)`}
            strokeWidth={4}
            fillOpacity={1}
            fill={`url(#${idPrefix}RevenueGradient)`}
            dot={{ r: 6, fill: '#fff', stroke: '#6366f1', strokeWidth: 3 }}
            activeDot={{ r: 8, fill: '#6366f1', stroke: '#fff', strokeWidth: 4 }}
            animationDuration={2000}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const statCards = [
    {
      name: 'Total Members',
      value: stats.totalMembers,
      growth: stats.growthRates.totalMembers,
      icon: UsersGroupTwoRounded,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      glow: 'shadow-red-500/20',
      labelColor: 'text-red-600',
      growthLabel: 'New (30d)'
    },
    {
      name: 'Active Members',
      value: stats.activeMembers,
      growth: stats.growthRates.activeMembers,
      icon: UserCheck,
      color: 'bg-gradient-to-br from-red-400 to-red-600',
      glow: 'shadow-red-500/20',
      labelColor: 'text-red-600',
      growthLabel: 'Retention'
    },
    {
      name: 'Expired Members',
      value: stats.expiredMembers,
      growth: stats.growthRates.expiredMembers,
      icon: UserCross,
      color: 'bg-gradient-to-br from-pink-400 to-rose-600',
      glow: 'shadow-pink-500/20',
      labelColor: 'text-pink-600',
      growthLabel: 'Churn'
    },
    {
      name: 'Expiring Soon',
      value: stats.expiringSoon,
      growth: stats.growthRates.expiringSoon,
      icon: ClockCircle,
      color: 'bg-gradient-to-br from-orange-400 to-amber-600',
      glow: 'shadow-orange-500/20',
      labelColor: 'text-orange-600',
      growthLabel: 'At Risk'
    },
  ];

  return (
    <div className="space-y-6 md:space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight text-brand-primary">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2 text-sm md:text-lg font-medium">Monitoring your gym's pulse and performance</p>
        </div>
        <div className="flex items-center gap-4">
          <div
            onClick={() => navigate('/payments')}
            className="bg-white px-4 md:px-8 py-4 md:py-5 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-premium flex items-center gap-4 md:gap-6 group hover:border-brand-primary/20 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="w-10 md:w-14 h-10 md:h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-red-500/20 relative z-10">
              <Dollar className="w-5 md:w-8 h-5 md:h-8 text-white" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">Portfolio Value</p>
              <p className="text-xl md:text-3xl font-black text-gray-900 leading-none">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {statCards.map((card) => (
          <div
            key={card.name}
            onClick={() => navigate('/members')}
            className="group relative p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-white border border-gray-100 shadow-premium hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 md:hover:-translate-y-2 overflow-hidden cursor-pointer"
          >
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-40 h-40 ${card.color} opacity-[0.03] blur-3xl group-hover:opacity-10 transition-opacity duration-500`} />

            <div className={`w-10 md:w-14 h-10 md:h-14 ${card.color} rounded-2xl flex items-center justify-center text-white mb-4 md:mb-8 shadow-xl ${card.glow} group-hover:scale-110 transition-transform duration-500`}>
              <card.icon className="w-5 md:w-7 h-5 md:h-7" />
            </div>

            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-3">{card.name}</p>
            <p className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">{card.value}</p>

            <div className="mt-4 md:mt-6 flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full ${card.labelColor} bg-current/5`}>
                <GraphUp className="w-3 md:w-3.5 h-3 md:h-3.5" />
                <span className="text-[10px] font-black uppercase">{card.growth}%</span>
              </div>
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{card.growthLabel}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div
          onClick={() => setIsChartExpanded(true)}
          className="lg:col-span-2 bg-white p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-premium relative overflow-hidden cursor-pointer group/chart"
        >
          <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-pastel-indigo/30 blur-3xl rounded-full -mr-20 -mt-20 opacity-50 group-hover/chart:bg-brand-primary/10 transition-colors" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-12 relative z-10">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Revenue Analysis</h2>
              <p className="text-gray-400 font-bold mt-1 uppercase text-[10px] tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                Click to expand
              </p>
            </div>
            <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100/50 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${timeRange === range
                    ? 'bg-white text-brand-primary shadow-sm ring-1 ring-gray-100'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-60 md:h-80 relative z-10 -mx-4">
            <RenderChart idPrefix="dashboard" />
          </div>
        </div>

        <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-premium flex flex-col h-full cursor-pointer hover:border-brand-primary/20 transition-all" onClick={() => navigate('/payments')}>
          <div className="flex items-center justify-between mb-6 md:mb-10">
            <div>
              <h3 className="text-lg md:text-xl font-black text-gray-900">Recent Payments</h3>
              <p className="text-sm text-gray-400 font-medium mt-1">Latest transactions</p>
            </div>
          </div>
          <div className="space-y-3 md:space-y-4 flex-1 overflow-y-auto pr-2">
            {stats.recentPayments.length > 0 ? stats.recentPayments.map((payment, i) => (
              <div key={i} className="flex items-center justify-between p-3 md:p-4 hover:bg-pastel-indigo/30 rounded-[1.5rem] transition-all duration-300 border border-transparent hover:border-red-100/50 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Dollar className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">Payment Received</p>
                    <p className="text-xs text-gray-400 font-bold">{payment.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-red-500">+₹{payment.amount}</p>
                  <p className="text-[10px] text-red-400 font-black tracking-widest uppercase">Success</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full py-10">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Dollar className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-gray-400 font-bold tracking-tight">No recent payments recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Chart Modal */}
      <AnimatePresence>
        {isChartExpanded && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChartExpanded(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-6xl bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl p-5 md:p-12 overflow-hidden border border-white/50 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start md:items-center justify-between mb-6 md:mb-12 gap-4">
                <div>
                  <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3 md:gap-4">
                    <GraphUp className="w-6 md:w-8 h-6 md:h-8 text-brand-primary" />
                    Revenue Analytics
                  </h2>
                  <p className="text-gray-400 font-bold mt-2 uppercase text-[10px] md:text-xs tracking-[0.2em]">{timeRange} perspective</p>
                </div>
                <button onClick={() => setIsChartExpanded(false)} className="p-2 md:p-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shrink-0">
                  <CloseCircle className="w-6 md:w-10 h-6 md:h-10" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-8 mb-6 md:mb-12">
                <div className="bg-gray-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Peak</p>
                  <p className="text-lg md:text-2xl font-black text-gray-900">₹{Math.max(...revenueData.map(d => d.revenue)).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Average</p>
                  <p className="text-lg md:text-2xl font-black text-gray-900">₹{Math.floor(revenueData.reduce((a, b) => a + b.revenue, 0) / revenueData.length).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Performance</p>
                  <p className={`text-lg md:text-2xl font-black ${stats.revenuePerformance >= 0 ? 'text-red-500' : 'text-pink-500'}`}>
                    {stats.revenuePerformance >= 0 ? '+' : ''}{stats.revenuePerformance}%
                  </p>
                </div>
                <div className="bg-gray-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Range</p>
                  <p className="text-lg md:text-2xl font-black text-brand-primary uppercase">{timeRange}</p>
                </div>
              </div>

              <div className="h-64 md:h-[500px] -mx-2 md:-mx-8">
                <RenderChart height={300} idPrefix="modal" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Recent Admissions */}
      <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-10">
          <div>
            <h3 className="text-lg md:text-xl font-black text-gray-900">Recent New Admissions</h3>
            <p className="text-sm text-gray-400 font-medium mt-1">Latest members to join</p>
          </div>
          <button
            onClick={() => navigate('/members')}
            className="px-5 md:px-6 py-3 bg-brand-primary/10 text-brand-primary rounded-2xl text-sm font-black hover:bg-brand-primary hover:text-white transition-all duration-300 w-full md:w-auto text-center"
          >
            View All Members
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em]">
                <th className="pb-4 md:pb-6 px-2 md:px-4">Member</th>
                <th className="pb-4 md:pb-6 px-2 md:px-4">Plan</th>
                <th className="pb-4 md:pb-6 px-2 md:px-4">Status</th>
                <th className="pb-4 md:pb-6 px-2 md:px-4 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentAdmissions.length > 0 ? stats.recentAdmissions.map((member, i) => (
                <tr key={i} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/members/${member.id}`)}>
                  <td className="py-3 md:py-5 px-2 md:px-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-8 md:w-12 h-8 md:h-12 bg-pastel-indigo rounded-xl md:rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0">
                        {member.photo ? (
                          <img src={member.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-red-400 font-black text-xs md:text-lg">
                            {member.name[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-black text-gray-900 truncate">{member.name}</p>
                        <p className="text-[10px] md:text-xs text-gray-400 font-bold truncate">{member.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 md:py-5 px-2 md:px-4 font-bold text-gray-600 text-[10px] md:text-sm">
                    <span className="px-2 md:px-3 py-1 bg-gray-100 rounded-lg truncate inline-block max-w-[80px] md:max-w-none">{member.membership_plan}</span>
                  </td>
                  <td className="py-3 md:py-5 px-2 md:px-4">
                    <span className={`inline-flex items-center px-2 md:px-4 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${member.status === 'active'
                      ? 'bg-pastel-emerald text-red-500 border border-red-100'
                      : 'bg-pastel-pink text-pink-500 border border-pink-100'
                      }`}>
                      <span className={`w-1 h-1.5 md:w-1.5 md:h-1.5 rounded-full mr-1 md:mr-2 ${member.status === 'active' ? 'bg-red-500' : 'bg-pink-500'}`}></span>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3 md:py-5 px-2 md:px-4 text-[10px] md:text-sm font-black text-gray-400 text-right whitespace-nowrap">{member.start_date}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-8 md:py-12 text-center">
                    <p className="text-gray-300 font-black text-sm md:text-lg">No admissions found</p>
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

