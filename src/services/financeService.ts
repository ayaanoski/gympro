import { db } from '../firebase';
import firebase from 'firebase/compat/app';

export const financeService = {
  getExpenses: (callback: (expenses: any[]) => void) => {
    return db.collection('expenses')
      .orderBy('date', 'desc')
      .onSnapshot((snap) => {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
  },

  addExpense: async (expenseData: any) => {
    return db.collection('expenses').add({
      ...expenseData,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  deleteExpense: async (expenseId: string) => {
    return db.collection('expenses').doc(expenseId).delete();
  },

  getTrainerEarnings: (callback: (earnings: any[]) => void) => {
    return db.collection('trainer_earnings')
      .orderBy('date', 'desc')
      .onSnapshot((snap) => {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
  },

  getTrainerEarningsByTrainer: (trainerId: string, callback: (earnings: any[]) => void) => {
    return db.collection('trainer_earnings')
      .where('trainer_id', '==', trainerId)
      .orderBy('date', 'desc')
      .onSnapshot((snap) => {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
  },

  markEarningAsPaid: async (earningId: string) => {
    return db.collection('trainer_earnings').doc(earningId).update({
      status: 'paid',
      paid_at: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
};
