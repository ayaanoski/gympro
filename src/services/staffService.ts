import { db } from '../firebase';

export const staffService = {
  getMembers: (callback: (members: any[]) => void) => {
    return db.collection('members').onSnapshot((snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  },

  getPayments: (callback: (payments: any[]) => void) => {
    return db.collection('payments')
      .orderBy('date', 'desc')
      .onSnapshot((snap) => {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
  },

  addPayment: (paymentData: any) => {
    return db.collection('payments').add({
      ...paymentData,
      timestamp: new Date().toISOString()
    });
  },

  addMember: async (memberData: any) => {
    const docRef = await db.collection('members').add({
      ...memberData,
      status: 'active',
      created_at: new Date().toISOString()
    });
    
    // Record initial payment
    await db.collection('payments').add({
      member_id: docRef.id,
      member_name: memberData.name,
      amount: memberData.initial_payment,
      method: memberData.payment_method,
      plan_name: memberData.membership_plan,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    });

    return docRef;
  },

  renewMembership: async (memberId: string, renewalData: any) => {
    await db.collection('members').doc(memberId).update({
      expiry_date: renewalData.new_expiry,
      status: 'active',
      membership_plan: renewalData.plan_name
    });

    await db.collection('payments').add({
      member_id: memberId,
      member_name: renewalData.member_name,
      amount: renewalData.amount,
      method: renewalData.payment_method,
      plan_name: renewalData.plan_name,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    });
  },

  getExpiringMembers: (days: number = 7) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const todayStr = today.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];

    return db.collection('members')
      .where('expiry_date', '>=', todayStr)
      .where('expiry_date', '<=', futureStr)
      .get();
  }
};
