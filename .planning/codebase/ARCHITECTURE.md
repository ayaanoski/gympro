# Architecture

**Analysis Date:** 2026-05-14

## System Overview

GymPro Management is a React-based Single Page Application (SPA) designed for gym administration. It follows a modular frontend architecture with a clear separation between UI components, business logic (services), and state management (context).

## Core Patterns

**Frontend Architecture:**
- Component-Based UI using React functional components and hooks.
- Layered Design:
  - **View Layer**: `src/pages` and `src/components` (UI presentation).
  - **Logic Layer**: `src/services` (Firebase interaction and business rules).
  - **State Layer**: `src/context` (Auth and global application state).

**Data Flow:**
- Unidirectional data flow via React props and Context API.
- Real-time updates using Firestore `onSnapshot` listeners in service layers.

**Security & Access Control:**
- Role-Based Access Control (RBAC) implemented via `ProtectedRoute` component.
- Centralized auth state in `AuthContext`.
- Allowed roles: `admin`, `staff`, `trainer`.

## Directory Organization

- `src/pages`: Feature-specific page components, organized by role (`admin`, `staff`).
- `src/components`: Reusable UI elements and layout shells.
- `src/services`: Data access services wrapping Firebase Firestore operations.
- `src/context`: React context providers for global state management.
- `src/utils`: Helper functions and external integration utilities.

## Abstractions

**Service Layer:**
Service objects (e.g., `adminService`, `trainerService`) abstract away the complexities of Firestore queries, providing a clean API for components to consume data.

**Protected Routes:**
The `ProtectedRoute` component abstracts role validation logic, ensuring only authorized users can access specific routes defined in `App.tsx`.

## Entry Points

- `index.html`: Main HTML template.
- `src/main.tsx`: React application mount point.
- `src/App.tsx`: Centralized routing and layout configuration.

---

*Architecture analysis: 2026-05-14*
*Update after major architectural shifts*
