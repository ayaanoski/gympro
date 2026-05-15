/**
 * Master Admin UID Override
 * Replace with your actual Firebase UID to bypass role restrictions.
 */
export const MASTER_ADMIN_UID = "OiD59a3JirYra0N0f87chcHqUyW2";

export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  TRAINER: 'trainer',
  MEMBER: 'member'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];
