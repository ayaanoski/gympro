import { UserRole } from './constants';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  created_at: any; // firebase.firestore.Timestamp
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  dob: string;
  photo?: string;
  membership_plan_id: string;
  start_date: string;
  expiry_date: string;
  trainer_id?: string;
  status: 'active' | 'expired' | 'pending';
  created_at: any;
  member_id: string; // Unique ID like GYM-001
}

export interface Plan {
  id: string;
  plan_name: string;
  duration: number; // in days or months? Let's use days for simplicity in calculation
  duration_unit: 'days' | 'months';
  price: number;
  description: string;
  trainer_included: boolean;
}

export interface Payment {
  id: string;
  member_id: string;
  plan_id: string;
  amount: number;
  method: 'Cash' | 'UPI' | 'Card';
  date: string;
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  member_id: string;
  trainer_id: string;
  exercises: {
    day: string;
    exercise_name: string;
    sets: string;
    reps: string;
    notes?: string;
  }[];
}

export interface Progress {
  id: string;
  member_id: string;
  date: string;
  weight: number;
  body_fat: number;
  muscle_mass?: number;
  notes?: string;
}

export interface AttendanceLog {
  id: string;
  user_id: string;
  name: string;
  role: UserRole;
  date: string;
  login_time: string;
}
