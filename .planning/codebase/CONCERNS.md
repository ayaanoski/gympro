# Technical Concerns

**Analysis Date:** 2026-05-14

## Critical Issues

- **No Automated Testing**: Lack of unit, integration, or E2E tests increases risk of regression.
- **Legacy Firebase SDK**: Usage of `firebase/compat` mode should be migrated to the modular v9+ SDK for better performance and smaller bundle sizes.

## Technical Debt

- **Dead Dependencies**: `express` and `better-sqlite3` are present in `package.json` but not used in the frontend codebase. These should be removed if not needed.
- **Type Safety**: Some usage of `any` in `src/types.ts` (especially for Firestore Timestamps) weakens type safety.

## Performance Concerns

- **Bundle Size**: Multiple icon libraries (`lucide-react`, `solar-icons`) and legacy Firebase SDK may lead to larger bundle sizes.
- **Real-time Listeners**: High number of active `onSnapshot` listeners could impact performance if not managed/unsubscribed correctly.

## Maintenance Risks

- **Role Management**: Hardcoded role strings are used in `src/constants.ts` and throughout `App.tsx`. A more robust approach would involve a centralized permissions mapping or a dynamic role system.
- **Firebase Dependency**: The application is tightly coupled with Firebase Firestore and Auth. While this simplifies development, it creates a significant lock-in, making it difficult to migrate to other backend solutions (e.g., PostgreSQL or MongoDB) without a major refactor of the service layer.
- **Environment Variable Management**: The reliance on `.env` files without a formal secrets management strategy (like Vault or Doppler) could lead to security risks if credentials are mishandled during team scaling.

## Potential Scalability Bottlenecks

- **Data Pagination**: Currently, some services (like `adminService.getUsers`) fetch entire collections without explicit pagination. As the gym member base grows, this will lead to increased memory usage and slower page loads.
- **State Complexity**: As more features are added, the centralized `AuthContext` may become a "God Object." Moving to a more granular state management solution (like Zustand or TanStack Query) should be considered for data-heavy features.

---

*Concerns audit: 2026-05-14*
*Update as issues are resolved or new concerns emerge*
