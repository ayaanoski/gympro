import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import {
  Magnifer,
  UserPlus,
  ClockCircle,
  Gift,
  Dollar,
  AltArrowRight,
  ChatRoundDots
} from '@solar-icons/react';
import { openWhatsApp, whatsAppTemplates } from '../../utils/whatsapp';
import { format } from 'date-fns';

export const StaffDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    expiringSoon: [] as any[],
    birthdays: [] as any[],
    recentPayments: [] as any[]
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const now = new Date();
      const todayStr = format(now, 'MM-dd');
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);

      // Fetch members for expiry and birthdays
      const membersSnap = await db.collection('members').get();
      const members = membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const expiring = members.filter((m: any) => {
        const expiry = new Date(m.expiry_date);
        return m.status === 'active' && expiry > now && expiry <= sevenDaysFromNow;
      });

      const birthdays = members.filter((m: any) => {
        if (!m.dob) return false;
        return m.dob.includes(todayStr); // Assuming DOB is YYYY-MM-DD
      });

      // Fetch recent payments
      const paymentsSnap = await db.collection('payments').orderBy('date', 'desc').limit(5).get();
      const payments = paymentsSnap.docs.map(doc => doc.data());

      setStats({
        expiringSoon: expiring,
        birthdays: birthdays,
        recentPayments: payments
      });
    };

    fetchData();
  }, []);

  const sendBirthdayWish = (member: any) => {
    openWhatsApp(member.phone, whatsAppTemplates.birthday(member.name));
  };

  const sendExpiryReminder = (member: any) => {
    openWhatsApp(member.phone, whatsAppTemplates.expiry(member.name, member.expiry_date));
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-500">Daily gym operations</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors w-full md:w-auto justify-center">
            <UserPlus className="w-5 h-5" />
            Add Member
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Magnifer className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search members by name, phone or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Expiry Reminders */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-2">
                <ClockCircle className="w-5 h-5 text-orange-500 shrink-0" />
                <h3 className="text-lg font-bold">Expiring Soon</h3>
              </div>
              <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-lg text-xs font-bold shrink-0">
                {stats.expiringSoon.length} Members
              </span>
            </div>

            <div className="space-y-3 md:space-y-4">
              {stats.expiringSoon.length > 0 ? stats.expiringSoon.map((member, i) => (
                <div key={i} className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-2xl gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-gray-400 shrink-0">
                      {member.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{member.name}</p>
                      <p className="text-xs text-gray-500 truncate">Expires: {member.expiry_date}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => sendExpiryReminder(member)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                  >
                    <ChatRoundDots className="w-5 h-5" />
                  </button>
                </div>
              )) : (
                <p className="text-center text-gray-500 py-8">No memberships expiring soon</p>
              )}
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-2">
                <Dollar className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="text-lg font-bold">Recent Payments</h3>
              </div>
            </div>
            <div className="space-y-3 md:space-y-4">
              {stats.recentPayments.length > 0 ? stats.recentPayments.map((payment, i) => (
                <div key={i} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">₹{payment.amount}</p>
                    <p className="text-xs text-gray-500 truncate">{payment.date} • {payment.method}</p>
                  </div>
                  <AltArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                </div>
              )) : (
                <p className="text-center text-gray-500 py-4">No recent payments</p>
              )}
            </div>
          </div>
        </div>

        {/* Birthdays */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-red-600 p-4 md:p-6 rounded-3xl text-white shadow-lg shadow-red-200">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <Gift className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">Today's Birthdays</h3>
            </div>
            <div className="space-y-3 md:space-y-4">
              {stats.birthdays.length > 0 ? stats.birthdays.map((member, i) => (
                <div key={i} className="flex items-center justify-between bg-white/10 p-3 rounded-2xl backdrop-blur-sm gap-2">
                  <p className="text-sm font-medium truncate min-w-0">{member.name}</p>
                  <button
                    onClick={() => sendBirthdayWish(member)}
                    className="p-2 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-colors shrink-0"
                  >
                    <ChatRoundDots className="w-4 h-4" />
                  </button>
                </div>
              )) : (
                <p className="text-red-100 text-sm py-4">No birthdays today</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
