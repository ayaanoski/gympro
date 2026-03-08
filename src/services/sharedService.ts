import { db } from '../firebase';

export const sharedService = {
  getMemberById: (id: string) => {
    return db.collection('members').doc(id).get();
  },

  getMemberPayments: (memberId: string) => {
    return db.collection('payments')
      .where('member_id', '==', memberId)
      .orderBy('date', 'desc')
      .get();
  },

  getMemberProgress: (memberId: string) => {
    return db.collection('progress')
      .where('member_id', '==', memberId)
      .orderBy('date', 'desc')
      .get();
  },

  getMemberWorkoutPlan: (memberId: string) => {
    return db.collection('workout_plans')
      .where('member_id', '==', memberId)
      .limit(1)
      .get();
  }
};
