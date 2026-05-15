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
      name: memberData.name,
      phone: memberData.phone,
      email: memberData.email,
      dob: memberData.dob,
      membership_plan: memberData.membership_plan,
      category: memberData.category || 'normal',
      discount_percent: memberData.discount_percent || 0,
      trainer_id: memberData.trainer_id || '',
      trainer_name: memberData.trainer_name || 'Not Assigned',
      expiry_date: memberData.expiry_date,
      start_date: memberData.start_date,
      auth_uid: memberData.auth_uid || '',
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
      category: memberData.category || 'normal',
      discount_percent: memberData.discount_percent || 0,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    });

    return docRef;
  },

  renewMembership: async (memberId: string, renewalData: any) => {
    await db.collection('members').doc(memberId).update({
      expiry_date: renewalData.new_expiry,
      status: 'active',
      membership_plan: renewalData.plan_name,
      category: renewalData.category || 'normal',
      discount_percent: renewalData.discount_percent || 0
    });

    await db.collection('payments').add({
      member_id: memberId,
      member_name: renewalData.member_name,
      amount: renewalData.amount,
      method: renewalData.payment_method,
      plan_name: renewalData.plan_name,
      category: renewalData.category || 'normal',
      discount_percent: renewalData.discount_percent || 0,
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
