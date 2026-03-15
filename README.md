# Tenant Configuration Control Panel — Sprint 2 Frontend

**Group 3 | Krishna Teja | Frontend Developer**

A full-featured React admin dashboard for tenant authentication configuration, built with:
- **React 18** + **TypeScript**
- **TanStack Router** — type-safe file-based routing
- **TanStack Query** — server state, caching, mutation handling
- **Zustand** — lightweight client state (auth + config)
- **Framer Motion** — page + element animations
- **Tailwind CSS** — utility-first styling with design tokens
- **Syne + DM Sans** — display + body font pairing

---

## Project Structure

```
src/
├── adminSignUp/            # All login / MFA / signup pages & layout
│   ├── AuthLayout.tsx      # Split-panel layout wrapper
│   ├── LoginForm.tsx       # Step 1: password login
│   ├── MFAVerifyForm.tsx   # Step 2: OTP verification
│   └── SignupForm.tsx      # Admin account creation
│
├── authConfig/             # Configuration panel pages & layout
│   ├── DashboardLayout.tsx # Protected layout (redirects if unauth)
│   ├── Sidebar.tsx         # Nav sidebar with logout
│   ├── AuthSettingsPage.tsx     # Main: enable/disable auth methods
│   ├── PasswordPolicyPage.tsx   # Password complexity & expiry
│   ├── SSOOTPPage.tsx           # SSO role mapping + OTP toggle
│   └── SessionRulesPage.tsx     # Session timeout & lockout sliders
│
├── store/
│   ├── auth.store.ts       # Auth state (Zustand, sessionStorage)
│   └── authConfig.store.ts # Config state (Zustand, in-memory)
│
├── api/
│   ├── auth.api.ts         # Placeholder: login, MFA, signup, logout
│   └── authConfig.api.ts   # Placeholder: get/update auth config
│
├── components/
│   └── ui.tsx              # Toggle, Input, Button, Card, Badge, Alert…
│
├── router.ts               # TanStack Router route tree
├── App.tsx                 # QueryClient + RouterProvider
├── main.tsx                # React DOM entry
└── index.css               # Design tokens + Tailwind base
```

---

## Getting Started

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.
API calls are proxied to `http://localhost:3001` (your Express backend).

---

## MFA Login Flow

```
/login  →  POST /api/admin/login
           ↓ (success: requiresMFA=true, sessionToken)
/verify-mfa  →  POST /api/admin/verify-mfa
               ↓ (success: sets HttpOnly JWT cookie)
/auth-config  (protected dashboard)
```

> **Demo OTP:** `123456` (remove this hint before production)

---

## Replacing API Placeholders

All API stubs live in `src/api/`. Each function has a `TODO` comment with the exact endpoint:

| File | Function | Endpoint |
|------|----------|----------|
| `auth.api.ts` | `loginAdmin` | `POST /api/admin/login` |
| `auth.api.ts` | `verifyMFA` | `POST /api/admin/verify-mfa` |
| `auth.api.ts` | `signupAdmin` | `POST /api/admin/signup` |
| `auth.api.ts` | `logoutAdmin` | `POST /api/admin/logout` |
| `auth.api.ts` | `resendOTP` | `POST /api/admin/resend-otp` |
| `authConfig.api.ts` | `getAuthConfig` | `GET /api/auth-config/:tenantId` |
| `authConfig.api.ts` | `updateAuthConfig` | `PUT /api/auth-config/:tenantId` |
| `authConfig.api.ts` | `validateAuthConfig` | `POST /api/auth-config/validate` |

Replace each placeholder body with a real `fetch`/`axios` call. The JWT is stored as an HttpOnly cookie by the backend — the browser sends it automatically with `credentials: "include"`.

---

## Security Notes

- **JWT storage**: HttpOnly cookie (set by backend — never stored in localStorage)
- **Session storage**: Only non-sensitive admin profile is persisted (sessionStorage, clears on tab close)
- **MFA**: Two-step flow — password → OTP; cannot skip to dashboard without completing both
- **Route protection**: `DashboardLayout` checks `isAuthenticated` and redirects to `/login` if false
- **CSP header**: Set in `index.html` (tighten for production)
- **Cookies**: Backend must set `HttpOnly`, `Secure`, `SameSite=Strict` on the JWT cookie

---

## Config Pages

| Route | Page | REQ |
|-------|------|-----|
| `/auth-config` | Enable/disable Password, SSO, OTP, MFA | REQ-TC-1 |
| `/auth-config/password-policy` | Complexity, expiry, lockout | REQ-TC-2 |
| `/auth-config/sso-otp` | SSO role mapping, OTP toggle | REQ-TC-3 |
| `/auth-config/session` | Session timeout, max attempts | REQ-TC-1, REQ-TC-2 |

---

## Technology Decisions

| Decision | Rationale |
|----------|-----------|
| TanStack Router | Type-safe, file-based routing; avoids class component patterns |
| TanStack Query | Handles loading/error/cache for config fetches automatically |
| Zustand | Minimal boilerplate; `persist` middleware with sessionStorage for auth |
| Framer Motion | Smooth, production-grade animations without CSS gymnastics |
| Tailwind + CSS vars | Design tokens in CSS, utility classes in JSX — easy to theme |
