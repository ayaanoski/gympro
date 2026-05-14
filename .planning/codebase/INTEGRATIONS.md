# External Integrations

**Analysis Date:** 2026-05-14

## APIs & External Services

**Backend Services:**
- Firebase / Firestore - Primary data store and authentication
  - SDK/Client: `firebase` npm package v10.x
  - Auth: Configuration in `src/firebaseConfig.ts`
  - Collections: `plans`, `users`, `staff_attendance`, `members`

**AI & Machine Learning:**
- Google Gemini API - AI integration
  - SDK/Client: `@google/genai` v1.29
  - Auth: Expected via API key (env var)

**Messaging:**
- WhatsApp Integration - Announcement services
  - Implementation: `src/utils/whatsapp.ts`
  - Integration method: Custom utility logic (needs further verification for third-party API usage)

## Data Storage

**Databases:**
- Firebase Firestore - Primary cloud database
  - Client: Firebase JS SDK (compat mode)
  - Connection: `src/firebase.ts`

**Local Development:**
- SQLite - (Present in `package.json` as `better-sqlite3`, but usage not detected in `src/`)
  - Potential dead dependency or future integration plan.

## Authentication & Identity

**Auth Provider:**
- Firebase Auth - User authentication and role-based access
  - Implementation: `src/context/AuthContext.tsx`
  - Roles: `admin`, `staff`, `trainer` defined in `src/constants.ts`

## CI/CD & Deployment

**Hosting:**
- Expected: Firebase Hosting (given Firebase integration) or Vercel.

## Environment Configuration

**Development:**
- Required env vars: Firebase configuration keys (API Key, Project ID, etc.)
- Secrets location: `.env` (gitignored)

## Webhooks & Callbacks

**Incoming:**
- None detected in frontend code.

**Outgoing:**
- WhatsApp - Triggered for active member announcements.

---

*Integration audit: 2026-05-14*
*Update when adding/removing external services*
