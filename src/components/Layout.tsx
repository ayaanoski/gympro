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
    { name: 'My Members', path: '/trainer/members', icon: UserCheck, roles: ['trainer'] },
    { name: 'Attendance', path: '/attendance', icon: Calendar, roles: ['admin'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    isAdmin || item.roles.includes(userProfile?.role || '')
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-bold tracking-tight">GYM<span className="text-emerald-600">PRO</span></h1>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2">
          <HamburgerMenu className="w-6 h-6" />
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
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r z-50 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold tracking-tight">GYM<span className="text-emerald-600">PRO</span></h1>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2">
              <CloseCircle className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                    ${isActive 
                      ? 'bg-emerald-50 text-emerald-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t">
            <div className="px-4 py-3 mb-4">
              <p className="text-sm font-medium text-gray-900 truncate">{userProfile?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{userProfile?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Logout className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
