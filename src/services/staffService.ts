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

  getPaymentsOnce: async () => {
    const snap = await db.collection('payments')
      .orderBy('date', 'desc')
      .limit(100)
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
      trainer_fee: memberData.trainer_fee || 0,
      expiry_date: memberData.expiry_date,
      start_date: memberData.start_date,
      auth_uid: memberData.auth_uid || '',
      status: 'active',
      total_fees: memberData.total_fees || 0,
      total_paid: memberData.amount_paid || 0,
      due_amount: memberData.due_amount || 0,
      next_due_date: memberData.next_due_date || null,
      created_at: new Date().toISOString()
    });
    
    // Record initial payment
    if (memberData.amount_paid > 0) {
      await db.collection('payments').add({
        member_id: docRef.id,
        member_name: memberData.name,
        amount: memberData.amount_paid,
        method: memberData.payment_method,
        plan_name: memberData.membership_plan,
        category: memberData.category || 'normal',
        discount_percent: memberData.discount_percent || 0,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        payment_type: memberData.due_amount > 0 ? 'Partial' : 'Full'
      });
    }

    return docRef;
  },

  renewMembership: async (memberId: string, renewalData: any) => {
    await db.collection('members').doc(memberId).update({
      expiry_date: renewalData.new_expiry,
      status: 'active',
      membership_plan: renewalData.plan_name,
      category: renewalData.category || 'normal',
      discount_percent: renewalData.discount_percent || 0,
      total_fees: renewalData.total_fees || 0,
      total_paid: renewalData.amount_paid || 0,
      due_amount: renewalData.due_amount || 0,
      next_due_date: renewalData.next_due_date || null,
    });

    if (renewalData.amount_paid > 0) {
      await db.collection('payments').add({
        member_id: memberId,
        member_name: renewalData.member_name,
        amount: renewalData.amount_paid,
        method: renewalData.payment_method,
        plan_name: renewalData.plan_name,
        category: renewalData.category || 'normal',
        discount_percent: renewalData.discount_percent || 0,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        payment_type: renewalData.due_amount > 0 ? 'Partial' : 'Full'
      });
    }
  },

  recordDuePayment: async (memberId: string, paymentData: any) => {
    // get current member
    const memberDoc = await db.collection('members').doc(memberId).get();
    const member = memberDoc.data();
    if (!member) throw new Error('Member not found');

    const newTotalPaid = (member.total_paid || 0) + paymentData.amount;
    const newDueAmount = (member.total_fees || 0) - newTotalPaid;

    await db.collection('members').doc(memberId).update({
      total_paid: newTotalPaid,
      due_amount: Math.max(0, newDueAmount),
      next_due_date: paymentData.next_due_date || null
    });

    await db.collection('payments').add({
      member_id: memberId,
      member_name: member.name,
      amount: paymentData.amount,
      method: paymentData.method,
      plan_name: 'Due Clearance',
      category: member.category || 'normal',
      discount_percent: 0,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      payment_type: 'Due'
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
  },

  getMembersWithDuesOnce: async () => {
    const snap = await db.collection('members')
      .where('due_amount', '>', 0)
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
