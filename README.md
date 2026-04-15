# Tenant Configuration Control Panel - Frontend

React + TypeScript admin UI for onboarding tenants, MFA login, and managing tenant/domain authentication configuration.

## Stack

- React 18 + TypeScript
- Vite
- TanStack Router
- TanStack Query
- Zustand
- Tailwind CSS + PostCSS
- Framer Motion
- MUI + Emotion

## Current Frontend Structure

frontend/
|- src/config/routes.tsx (route tree and guards)
|- src/features/auth/ (login, signup, MFA forms + APIs)
|- src/features/auth-config/ (tenant auth config state and APIs)
|- src/features/domains/ (domain CRUD and related state)
|- src/features/mailing-lists/ (mailing list UI/state)
|- src/layouts/ (AuthLayout, DashboardLayout)
|- src/pages/ (auth settings pages and central auth screens)
|- src/shared/components/ (design system primitives)
|- src/stores/auth.store.ts (auth session state)

## Quick Start

1) Install dependencies

```bash
npm install
```

2) Configure frontend/.env

```env
VITE_API_BASE_URL=http://localhost:3001
```

3) Run development server

```bash
npm run dev
```

Frontend base URL: http://localhost:5173

## Routes (Current)

### Public/Auth

- /login
- /signup
- /verify-mfa
- /auth-config-doc

### Tenant-Facing Central Auth

- /tenantconfig/auth/$tenantId
- /tenantconfig/signup/$tenantId

### Protected Dashboard

- /auth-config
- /auth-config/password-policy
- /auth-config/sso-otp
- /auth-config/session
- /auth-config/domains
- /auth-config/domain-auth
- /auth-config/mailing-lists

## Auth and Security Behavior

- Login is two-step: password then OTP verification.
- Guard logic redirects authenticated users away from login/signup and unauthenticated users away from protected pages.
- Sensitive token handling remains backend cookie-based; frontend store keeps only non-sensitive session metadata.
- API calls should be made with credentials enabled so cookie sessions persist.

## Backend Integration Notes

- Frontend expects backend on port 3001 by default.
- Critical APIs used by UI include admin auth, auth-config, domains, domain-auth behavior, mailing-lists, and central-auth.
- Ensure backend CORS includes frontend origin in ALLOWED_ORIGINS.

## Build and Quality Commands

```bash
npm run dev
npm run build
npm run preview
npm run lint
```
