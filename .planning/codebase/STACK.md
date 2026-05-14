# Technology Stack

**Analysis Date:** 2026-05-14

## Languages

**Primary:**
- TypeScript 5.8 - All application code and type definitions
- CSS (Tailwind 4) - Global and component-level styling

**Secondary:**
- JavaScript - Configuration files (`vite.config.ts` via build transform)

## Runtime

**Environment:**
- Node.js 22.x - Build-time environment
- Browser - Client-side execution environment

**Package Manager:**
- npm 10.x
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.0 - UI framework
- React Router 7.2 - Routing and navigation

**Build/Dev:**
- Vite 6.2 - Build tool and development server
- Tailwind CSS 4.1 - Styling framework and PostCSS processing

## Key Dependencies

**Critical:**
- `firebase` 10.14 - Backend services (Firestore, Auth)
- `motion` 12.23 - Interactive animations (Framer Motion)
- `lucide-react` 0.546 - Vector icon library
- `react-router-dom` 7.2 - Client-side routing logic

**Infrastructure:**
- `@google/genai` 1.29 - Google Gemini AI integration
- `recharts` 2.12 - Data visualization and dashboard charts

## Configuration

**Environment:**
- `.env` files - Local environment configuration
- `.env.example` - Template for required environment variables

**Build:**
- `tsconfig.json` - TypeScript compiler configuration
- `vite.config.ts` - Vite build and plugin configuration

## Platform Requirements

**Development:**
- Any platform with Node.js 20+ support
- Git for version control

**Production:**
- Static site hosting (Vercel, Netlify, Firebase Hosting)
- Firebase project for backend services

---

*Stack analysis: 2026-05-14*
*Update after major dependency changes*
