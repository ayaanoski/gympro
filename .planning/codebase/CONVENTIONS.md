# Coding Conventions

**Analysis Date:** 2026-05-14

## Development Standards

**TypeScript:**
- Strict typing preferred where possible.
- Global types defined in `src/types.ts`.
- Use of interfaces for data models (e.g., `Member`, `Plan`).

**React:**
- Functional components exclusively.
- React Hooks for state (`useState`) and side effects (`useEffect`).
- Real-time Firestore listeners used within services and consumed in components.

## UI & Styling

**Tailwind CSS:**
- Standardized via Tailwind 4.
- Utility-first approach for component styling.
- Responsive design patterns (mobile-first).

**Icons:**
- Use of `lucide-react` and `@solar-icons/react` for consistent visual language.

## Code Style

**Naming:**
- PascalCase for React components and types.
- camelCase for functions, variables, and service files.
- SCREAMING_SNAKE_CASE for constants (e.g., in `src/constants.ts`).

**File Organization:**
- Grouping pages by user role (`admin/`, `staff/`).
- Keeping components focused and reusable in `src/components/`.

## Error Handling

- Basic error handling in service layers (needs more robust implementation).
- Use of Firebase error codes where applicable.

---

*Conventions analysis: 2026-05-14*
*Update as team standards evolve*
