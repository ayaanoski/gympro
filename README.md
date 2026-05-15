# GYMPRO Management System

A real-time gym management PWA built with **React 19**, **Vite 6**, **TypeScript 5.8**, and **Firebase**. Supports four roles — Admin, Staff, Trainer, and Member — each with a tailored dashboard. Real-time Firestore sync, role-based access, WhatsApp integration, Cloudinary media uploads, and a fully mobile-responsive glassmorphism UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **UI** | React 19, Tailwind CSS 4.1, Framer Motion 12 |
| **Icons** | Solar Icons, Lucide React |
| **Charts** | Recharts |
| **Build** | Vite 6, TypeScript 5.8 |
| **Backend** | Firebase Auth, Firestore, Cloud Storage (compat SDK v10) |
| **Media** | Cloudinary (unsigned uploads, max 3 MB) |
| **Messaging** | WhatsApp (wa.me links) |
| **Other** | date-fns, xlsx (Excel export) |

---

## Roles & Routes

| Path | Component | Access | Description |
|---|---|---|---|
| `/login` | Login | Public | Sign in / register |
| `/dashboard` | Dashboard (dispatcher) | All | Routes to role-specific dashboard |
| `/members` | MembersList | admin, staff | Member CRUD, registration |
| `/members/:id` | MemberProfile | admin, staff, trainer | Full member detail view |
| `/plans` | MembershipPlans | admin | Create/edit/delete plans |
| `/payments` | Payments | admin, staff | Financial ledger |
| `/attendance` | AttendanceLogs | admin | All attendance records |
| `/staff-attendance` | StaffAttendance | staff | Staff attendance + check-in/out |
| `/settings` | Settings | admin | User management (employees) |
| `/my-dashboard` | MemberDashboard | member | Member's personal dashboard |
| `/my-profile` | MemberSettings | member | Change password |
| `/my-attendance` | MemberAttendance | member | Attendance history + check-in/out |
| `/trainer-earnings` | TrainerEarnings | trainer | Fee tracking |
| `/my-clients` | TrainerClients | trainer | List of assigned clients |
| `/trainer-profile` | TrainerProfile | trainer | Attendance + QR code upload |

---

## Firebase Collections

### `users/{uid}`
Employee/member auth profiles.
```
uid, name, email, phone, role (admin|staff|trainer|member), active, created_at, qr_code?
```

### `members/{docId}`
Gym member records.
```
auth_uid, name, phone, email?, dob, photo?, membership_plan,
category (normal|student|couples), discount_percent, trainer_id, trainer_name,
trainer_fee, start_date, expiry_date, status (active|expired|pending),
height?, member_id?, created_at
```

### `plans/{docId}`
Membership plans.
```
plan_name, duration, duration_unit (days|months), price, description, trainer_included
```

### `payments/{docId}`
Payment transactions.
```
member_id, member_name, amount, method (Cash|UPI|Card), date, plan_name,
category?, discount_percent?, timestamp
```

### `staff_attendance/{docId}`
Check-in/check-out logs for all roles.
```
user_id, name, role, date, login_time, logout_time?, timestamp
```

### `workout_plans/{docId}` / `diet_plans/{docId}`
Plans set by trainers, viewed by admin/staff/members.
```
member_id, description?, image_url?, created_by?, created_at?, updated_at?
```

### `progress/{docId}`
Weight / height / body fat logs.
```
member_id, date, weight?, height?, body_fat?, notes?
```

### `trainer_earnings/{docId}`
Trainer fee payments (recorded manually by trainer).
```
trainer_id, member_id, member_name, amount, date, created_at
```

### `member_documents/{docId}`
Uploaded Aadhar cards and profile photos.
```
member_id, type (aadhar|profile_photo), url, uploaded_at, uploaded_by
```

---

## Pages & Key Features

### Login (`/login`)
- Sign in with email/password
- Registration for staff/trainer (pending admin approval)
- Auto-logs `staff_attendance` on sign-in for active employees
- 0% sign-out animations

### Admin Dashboard (`/dashboard` — admin)
- 4 stat cards with real growth rates (new members 30d, retention, churn, at-risk)
- Portfolio value summary → navigates to Payments
- Revenue Analysis area chart (daily/weekly/monthly/yearly) with expandable modal
- Recent Payments panel (top 10) → navigates to Payments
- Recent Admissions table → navigates to MemberProfile
- All stats computed from live Firestore data

### Members List (`/members` — admin, staff)
- Real-time member list with Firestore `onSnapshot`
- Search by name / phone / member ID
- Status filters: all / active / expired
- Category filters: all / normal / student / couples
- Category badge on each row
- Actions: WhatsApp, profile view, delete
- **Register Member modal**:
  - Full Name, Phone, Email, Temporary Password, DOB
  - Membership Plan (auto-calculates price)
  - Category (normal / student / couples)
  - Discount % (auto-calculates discounted amount)
  - Trainer assignment with Trainer Fee field (appears when trainer selected)
  - Total Amount = plan price − discount + trainer fee
  - Payment method
  - **On submit**: Creates Firebase Auth account via secondary app (preserves admin session) → saves `users/{uid}` with role `member` → creates member doc with `auth_uid` → creates `trainer_earnings` record if fee > 0 → opens WhatsApp with credentials
- **Delete**: Confirmation dialog → deletes member document (real-time removal)

### Member Profile (`/members/:id` — admin, staff, trainer)
**~30 state variables, 7 real-time listeners.**
- Profile card: photo, name, member ID, status dot, WhatsApp, renew, phone, join date
- Trainer assignment dropdown (admin/staff only)
- Membership status + category + discount badges
- **Diet Plan**: viewable by all; editable by trainer (text + Cloudinary image)
- **Latest Progress**: weight, height, body fat, notes; log form for trainer
- **Workout Plan**: viewable by all; editable by trainer (text + Cloudinary image)
- **Documents** (admin/staff only): Profile photo + Aadhar upload via Cloudinary, store in `member_documents`
- **Payment History** (admin/staff only)
- **Renewal modal**: plan, category, discount, auto-calc, payment method; sends WhatsApp
- **Edit Member modal**: name, phone, email, DOB, plan, category, discount, trainer fee
- ImageViewer for all uploaded images (pinch-to-zoom)

### Membership Plans (`/plans` — admin)
- Real-time plan cards with name, duration, price, trainer toggle, description
- Create/Edit modal with spring animation
- Delete with confirmation

### Payments (`/payments` — admin, staff)
- Stat cards: total capital, current month revenue, transaction count
- Real-time table with date, member, amount, method icons, plan, delete action
- Search by member name/ID
- Excel export via xlsx

### Attendance Logs (`/attendance` — admin)
- Role filter toggle: staff/trainer vs members
- Search by name/role
- Table: avatar, role badge, date, login, logout (members only)
- Excel export
- Real-time via Firestore

### Staff Attendance (`/staff-attendance` — staff)
- Check In / Check Out / Done badge (real-time today record)
- Role filter toggle (staff/trainer vs members)
- Search + Export
- Same table format as admin Attendance Logs

### Settings (`/settings` — admin)
- Staff/Trainer count summary cards
- Pending Approvals section with Approve / Reject & Delete
- Employee table: activate/suspend/delete
- **Add Employee modal**: Creates Firebase Auth via secondary app, saves `users/{uid}`, sends WhatsApp? (no, just creates)
- Role badges: admin=purple, staff=blue, trainer=emerald
- Members are excluded from all views

### Staff Dashboard (`/dashboard` — staff)
- Check In / Check Out / Done badge
- Expiring members (7 days) with WhatsApp reminder button
- Recent Payments (last 5)
- Today's Birthdays card with WhatsApp wish button
- Search bar

---

### Member Pages

### Member Dashboard (`/my-dashboard`)
- Check In / Check Out / Done badge
- Membership status: plan, expiry, days left (expiring-soon orange), category
- Trainer info (name, phone)
- Today's attendance
- Workout Plan card (description + image, ImageViewer)
- Diet Plan card (description + image, ImageViewer)
- Latest Progress logs (up to 5): weight, height, body fat
- Real-time via `auth_uid` → `members` lookup → `workout_plans`, `diet_plans`, `progress` queries by `member_id`

### Member Attendance (`/my-attendance`)
- Weekly mini calendar (7 days) with active-day indicators and today ring
- Today's status card with login/logout times
- Animated Check In / Check Out buttons (Framer Motion AnimatePresence)
- Full history list with Complete/Active badges
- Entry stagger animation on mount

### Member Settings (`/my-profile`)
- Account info display (name, email)
- Change password form: re-authenticate → validate → update
- Firebase error handling (wrong-password, weak-password)

---

### Trainer Pages

### Trainer Dashboard (`/dashboard` — trainer)
- Check In / Check Out / Done badge
- Stat cards: assigned athletes, active plans, progress logs
- **Recent Progress** grid (up to 6): member name, weight, height, body fat, date, notes
- **Workout Plans** card (up to 5): member name + status (image thumbnail/Set badge)
- **Diet Plans** card (up to 5): same pattern
- Full athlete table: photo, name, phone, plan, status, profile link
- Search + pagination (10 per page)
- ImageViewer for plan images
- Real-time listeners for members, attendance, progress, workout plans, diet plans

### Trainer Clients (`/my-clients`)
- Search by name/phone
- List with avatar, status badge → click navigates to MemberProfile
- Real-time via `members.where('trainer_id', '==', user.uid)`

### Trainer Earnings (`/trainer-earnings`)
- Total earnings sum
- Combined list: recorded payments (from `trainer_earnings`) + pending fees (from member `trainer_fee`)
- Pending entries marked with orange badge
- **Add Fees modal**: select client (auto-fills configured fee) → enter amount → saves to `trainer_earnings`
- Real-time from both `trainer_earnings` and `members` collections

### Trainer Profile (`/trainer-profile`)
- Today Attendance: check in/out, login/logout times
- Attendance History (last 20): date, login, logout, Complete/Active
- **QR Code upload**: Cloudinary upload → stored in `users/{uid}.qr_code` → viewable via ImageViewer
- Max 3 MB validation, upload spinner, Change/View buttons

---

## Components

### Layout (`src/components/Layout.tsx`)
- Role-based sidebar navigation (admin/staff: full sidebar; trainers: top bar; members: sidebar)
- Nav items filtered by role
- Mobile hamburger menu with overlay
- Logout button + active user display
- Glassmorphism white/80 backdrop-blur styling

### ProtectedRoute (`src/components/ProtectedRoute.tsx`)
- Auth check → redirect to `/login`
- Employee active check → "Pending Approval" screen
- Role-based access → redirect to `/dashboard`
- Admin override bypass for master UID

### ImageViewer (`src/components/ImageViewer.tsx`)
- Full-screen modal with dark backdrop
- Close button (top-right) + click-outside-to-close
- Pinch-to-zoom (mobile) + scroll-wheel zoom (desktop)
- Drag to pan when zoomed
- Double-click to toggle 1x / 2.5x
- Zoom percentage indicator
- Framer Motion transitions

---

## Context

### AuthContext (`src/context/AuthContext.tsx`)
- `auth.onAuthStateChanged` listener
- Real-time `users/{uid}` Firestore listener
- Computed: `isAdmin`, `isStaff`, `isTrainer`, `isMember`, `isEmployeeActive`
- Master admin UID override in `constants.ts`
- Members bypass `isEmployeeActive` check (no approval needed)

---

## Services

| Service | Key Methods |
|---|---|
| **adminService** | `getPlans`, `addPlan`, `updatePlan`, `deletePlan`, `getUsers`, `updateUserStatus`, `getAttendanceLogs` |
| **staffService** | `getMembers`, `getPayments`, `addPayment`, `addMember` (member + payment), `renewMembership`, `getExpiringMembers` |
| **trainerService** | `getAssignedMembers`, `getProgressLogs`, `updateWorkoutPlan`, `addProgressLog`, `markAttendance` |
| **sharedService** | `getMemberById`, `getMemberPayments`, `getMemberProgress`, `getMemberWorkoutPlan` |

---

## Integrations

### WhatsApp
- `wa.me` links opened in new tab via anchor click (bypasses popup blockers)
- Templates: welcome (with/without credentials), renewal, progress, birthday, expiry, check-in
- Auto-prepends `91` for 10-digit Indian numbers

### Cloudinary
- Direct unsigned uploads via `POST https://api.cloudinary.com/v1_1/{cloud_name}/auto|image/upload`
- API key + upload preset from env vars
- 3 MB client-side size limit
- Used for: profile photos, Aadhar cards, workout images, diet images, QR codes

### Firebase Auth
- Primary auth for all roles
- Secondary apps for admin creating users (preserves admin session)
- Member auth created at registration time by admin/staff

---

## Environment Variables (`.env`)

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase measurement ID |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `VITE_CLOUDINARY_API_KEY` | Cloudinary API key |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned upload preset |

---

## Development

```bash
npm install
npm run dev     # Vite dev server on port 3000
npm run build   # Production build to dist/
npm run lint    # TypeScript type check (tsc --noEmit)
```

## Design System
- **Color**: Red brand primary (`#dc2626`), white backgrounds, pastel red tints
- **Font**: Plus Jakarta Sans
- **Shape**: Heavy use of `rounded-[2rem]`, `rounded-[3rem]`, glassmorphism cards
- **Animations**: Framer Motion spring transitions, entrance stagger animations
- **Responsive**: All pages adapt from mobile to desktop via `md:` breakpoints

## Technical Notes
- All queries use Firestore `onSnapshot` for real-time updates
- Firestore composite indexes needed for `where` + `orderBy` queries; errors provide self-service URLs
- Service worker registration in `main.tsx` expects `/sw.js` in public/
- Email/password auth only (no OAuth)
