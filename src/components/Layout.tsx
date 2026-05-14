import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Widget,
  UsersGroupTwoRounded,
  Card,
  Dumbbell,
  Settings,
  Logout,
  HamburgerMenu,
  CloseCircle,
  ClipboardList,
  Calendar,
  UserCheck
} from '@solar-icons/react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { userProfile, isAdmin, isStaff, isTrainer, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Widget, roles: ['admin', 'staff', 'trainer'] },
    { name: 'Members', path: '/members', icon: UsersGroupTwoRounded, roles: ['admin', 'staff'] },
    { name: 'Plans', path: '/plans', icon: ClipboardList, roles: ['admin'] },
    { name: 'Payments', path: '/payments', icon: Card, roles: ['admin', 'staff'] },
    { name: 'Attendance', path: '/attendance', icon: Calendar, roles: ['admin'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item =>
    isAdmin || item.roles.includes(userProfile?.role || '')
  );

  return (
    <div className="min-h-screen bg-[#fbfbfe] flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-md border-b p-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
          GYM<span className="text-brand-primary">PRO</span>
        </h1>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <HamburgerMenu className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 z-50 flex-shrink-0
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
              GYM<span className="text-brand-primary">PRO</span>
            </h1>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <CloseCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-red-50/80 text-brand-primary font-bold'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-brand-primary' : 'text-gray-300 group-hover:text-gray-900'}`} />
                  <span className="text-sm font-medium tracking-tight">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-50">
            <div className="px-4 py-3 mb-4 rounded-xl">
              <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.15em] mb-1">Active User</p>
              <p className="text-sm font-bold text-gray-900 truncate">{userProfile?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 font-bold"
            >
              <Logout className="w-5 h-5" />
              <span className="text-sm">Log out</span>
            </button>
          </div>
        </div>
      </aside>


      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <div className="p-4 md:p-10 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
