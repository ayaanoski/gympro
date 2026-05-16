import { db } from '../firebase';
import { format } from 'date-fns';

const CLOSING_HOUR = 23;
const CLOSING_MINUTE = 59;

function isPastClosing(): boolean {
  const now = new Date();
  return now.getHours() > CLOSING_HOUR || (now.getHours() === CLOSING_HOUR && now.getMinutes() >= CLOSING_MINUTE);
}

export async function autoCheckoutStaleEntries(userId: string): Promise<void> {
  try {
    const snap = await db.collection('staff_attendance')
      .where('user_id', '==', userId)
      .where('date', '<=', format(new Date(), 'yyyy-MM-dd'))
      .get();

    const batch = db.batch();
    let updated = false;

    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (!data.logout_time) {
        if (data.date < format(new Date(), 'yyyy-MM-dd') || isPastClosing()) {
          batch.update(doc.ref, { logout_time: '11:59 PM' });
          updated = true;
        }
      }
    });

    if (updated) {
      await batch.commit();
    }
  } catch (err) {
    console.error('Auto-checkout error:', err);
  }
}
