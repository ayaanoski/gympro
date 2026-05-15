import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export const adminService = {
  getPlans: (callback: (plans: any[]) => void) => {
    return db.collection('plans').onSnapshot((snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  },

  getPlansOnce: async () => {
    const snap = await db.collection('plans').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  addPlan: (planData: any) => {
    return db.collection('plans').add(planData);
  },

  updatePlan: (id: string, planData: any) => {
    return db.collection('plans').doc(id).update(planData);
  },

  deletePlan: (id: string) => {
    return db.collection('plans').doc(id).delete();
  },

  getUsers: (callback: (users: any[]) => void) => {
    return db.collection('users').onSnapshot((snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  },

  getUsersOnce: async () => {
    const snap = await db.collection('users').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  updateUserStatus: (userId: string, active: boolean) => {
    return db.collection('users').doc(userId).update({
      active,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  sendAnnouncement: async (message: string) => {
    const membersSnap = await db.collection('members').where('status', '==', 'active').get();
    const members = membersSnap.docs.map(doc => doc.data());
    return members.map(m => ({ name: m.name, phone: m.phone }));
  },

  getAttendanceLogs: (callback: (logs: any[]) => void) => {
    return db.collection('staff_attendance')
      .orderBy('timestamp', 'desc')
      .onSnapshot((snap) => {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
  },

  getAttendanceLogsOnce: async () => {
    const snap = await db.collection('staff_attendance')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
