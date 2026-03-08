import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import { auth, db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Dumbbell, LockPassword, Letter, Danger, UserRounded, Phone } from '@solar-icons/react';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff' as 'staff' | 'trainer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up Logic
        const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
        const user = userCredential.user;

        if (user) {
          // Create user profile in Firestore
          await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            active: false, // Wait for admin approval
            created_at: firebase.firestore.FieldValue.serverTimestamp()
          });

          navigate('/dashboard');
        }
      } else {
        // Sign In Logic
        const userCredential = await auth.signInWithEmailAndPassword(formData.email, formData.password);
        const user = userCredential.user;

        if (user) {
          const userDoc = await db.collection('users').doc(user.uid).get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData?.active) {
              // Log attendance only for active users
              await db.collection('staff_attendance').add({
                user_id: user.uid,
                name: userData?.name,
                role: userData?.role,
                date: new Date().toISOString().split('T')[0],
                login_time: new Date().toLocaleTimeString(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
              });
            }
          }

          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 p-10 border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl mb-6">
            <Dumbbell className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
            {isSignUp ? 'Join Us' : 'Welcome Back'}
          </h1>
          <p className="text-gray-500">Sign {isSignUp ? 'up' : 'in'} to manage your gym</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-medium"
          >
            <Danger className="w-5 h-5 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {isSignUp && (
              <motion.div
                key="signup-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <UserRounded className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-300"
                      placeholder="John Wick"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-300"
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'staff' })}
                    className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm ${formData.role === 'staff'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-100 bg-gray-50 text-gray-500'
                      }`}
                  >
                    Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'trainer' })}
                    className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm ${formData.role === 'trainer'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-100 bg-gray-50 text-gray-500'
                      }`}
                  >
                    Trainer
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <Letter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-300"
                placeholder="name@gym.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
            <div className="relative">
              <LockPassword className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-300"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4 active:scale-95"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="ml-2 text-emerald-600 font-bold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Register Now'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

