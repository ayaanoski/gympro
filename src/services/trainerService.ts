import { db } from '../firebase';
import { format } from 'date-fns';

export const trainerService = {
  getAssignedMembers: (trainerId: string, callback: (members: any[]) => void) => {
    return db.collection('members')
      .where('trainer_id', '==', trainerId)
      .onSnapshot((snap) => {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
  },

  getProgressLogs: (memberId: string, callback: (logs: any[]) => void) => {
    return db.collection('progress')
      .where('member_id', '==', memberId)
      .orderBy('date', 'desc')
      .onSnapshot((snap) => {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
  },

  updateWorkoutPlan: async (memberId: string, planData: any) => {
    const snap = await db.collection('workout_plans')
      .where('member_id', '==', memberId)
      .limit(1)
      .get();

    if (snap.empty) {
      await db.collection('workout_plans').add({ member_id: memberId, ...planData });
    } else {
      await db.collection('workout_plans').doc(snap.docs[0].id).update(planData);
    }
  },

  addProgressLog: (memberId: string, logData: any) => {
    return db.collection('progress').add({
      member_id: memberId,
      ...logData,
      date: new Date().toISOString().split('T')[0]
    });
  },

  markAttendance: (trainerId: string, trainerName: string) => {
    return db.collection('staff_attendance').add({
      user_id: trainerId,
      name: trainerName,
      role: 'trainer',
      date: format(new Date(), 'yyyy-MM-dd'),
      login_time: new Date().toLocaleTimeString(),
      timestamp: new Date().toISOString()
    });
  }
};
