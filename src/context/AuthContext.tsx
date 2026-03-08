import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { MASTER_ADMIN_UID, ROLES } from '../constants';
import { UserProfile } from '../types';
import firebase from 'firebase/compat/app';

interface AuthContextType {
  user: firebase.User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isStaff: boolean;
  isTrainer: boolean;
  isEmployeeActive: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Set up real-time listener for user profile
        const unsubscribeProfile = db.collection('users').doc(firebaseUser.uid).onSnapshot((doc) => {
          if (doc.exists) {
            setUserProfile(doc.data() as UserProfile);
          } else {
            // If profile doesn't exist yet (e.g. during registration)
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const isAdmin = user?.uid === MASTER_ADMIN_UID || userProfile?.role === ROLES.ADMIN;
  const isStaff = userProfile?.role === ROLES.STAFF;
  const isTrainer = userProfile?.role === ROLES.TRAINER;
  const isEmployeeActive = userProfile?.active === true || user?.uid === MASTER_ADMIN_UID;

  const logout = async () => {
    await auth.signOut();
  };

  const value = {
    user,
    userProfile,
    isAdmin,
    isStaff,
    isTrainer,
    isEmployeeActive,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
