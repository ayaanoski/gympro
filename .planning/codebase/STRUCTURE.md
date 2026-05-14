# Directory Structure

**Analysis Date:** 2026-05-14

## Root Layout

```text
.
├── .planning/              # GSD project planning and codebase map
├── public/                 # Static assets (images, icons)
├── src/                    # Source code
│   ├── components/         # Reusable UI components
│   ├── context/            # React context providers (Auth, etc.)
│   ├── pages/              # Page components (Admin, Staff, Shared)
│   ├── services/           # Backend interaction services (Firebase)
│   ├── utils/              # Helper functions and integrations
│   ├── App.tsx             # Main routing and layout entry
│   ├── firebase.ts         # Firebase initialization
│   ├── main.tsx            # Application entry point
│   └── types.ts            # Global TypeScript interfaces
├── package.json            # Dependencies and scripts
└── vite.config.ts          # Build configuration
```

## Key Locations

**Core Logic:**
- `src/services/`: Contains all Firestore interaction logic. Essential for understanding data operations.
- `src/context/AuthContext.tsx`: Manages user sessions and role assignments.

**UI & Layout:**
- `src/components/Layout.tsx`: Defines the main dashboard shell (sidebar, header).
- `src/pages/admin/`: Contains administrative screens (Plans, Attendance Logs, Settings).
- `src/pages/staff/`: Contains operational screens (Members, Payments).

**Integrations:**
- `src/utils/whatsapp.ts`: Logic for communication features.
- `src/firebase.ts`: Database connection and instance export.

## Naming Conventions

- **Components**: PascalCase (e.g., `MembersList.tsx`, `Layout.tsx`).
- **Services/Utils**: camelCase (e.g., `adminService.ts`, `whatsapp.ts`).
- **Styles**: `index.css` using Tailwind directives.
- **Types**: Interfaces defined in `src/types.ts` using PascalCase.

## Module Boundaries

- Components should remain largely presentational, deferring data fetching to services.
- Roles are strictly enforced at the route level in `App.tsx`.

---

*Structure analysis: 2026-05-14*
*Update after major directory reorganization*
