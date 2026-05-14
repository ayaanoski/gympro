# Testing Practices

**Analysis Date:** 2026-05-14

## Current State

The codebase currently does not have an automated testing suite implemented. Manual verification is the primary method for ensuring quality.

## Frameworks (Planned/Recommended)

- **Unit Testing**: Vitest or Jest.
- **Component Testing**: React Testing Library.
- **E2E Testing**: Playwright or Cypress.

## Testing Strategy

**Manual Verification Checklist:**
- **Auth & RBAC**: Verify that a 'Staff' user cannot access `/settings` and that 'Trainers' can only view member profiles relevant to them.
- **Data Persistence**: Confirm that adding a new membership plan immediately reflects in the database and updates the UI for all administrative users.
- **Responsive Layout**: Manually verify dashboard charts and tables across mobile (iPhone/Android) and desktop (Chrome/Safari) viewports.
- **WhatsApp Integration**: Test the announcement utility with dummy data to ensure the correctly formatted payload is generated for the UI to handle.

**Recommended Automation Roadmap:**
1. **Critical Path Tests**: Implement Playwright tests for the login flow and member registration.
2. **Service Layer Mocking**: Setup Vitest with `firebase-mock` to test `adminService` and `staffService` in isolation.
3. **CI Integration**: Add a GitHub Action to run linting and (eventually) automated tests on every pull request.

## Known Gaps

- **Lack of Unit Tests**: No automated unit tests exist for complex calculations in the service layer (e.g., membership expiry date math).
- **No Integration Testing**: The interaction between the React frontend and the live Firebase Firestore instance is not systematically tested.
- **No Visual Regression**: Changes to the premium Tailwind-based UI are not verified against a baseline, increasing the risk of "CSS bleed" or layout breaks.

---

*Testing analysis: 2026-05-14*
*Update as testing infrastructure is implemented*
