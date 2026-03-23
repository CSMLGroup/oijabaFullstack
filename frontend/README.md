# Oijaba Frontend (React)

This is the Vite + React frontend used to replace legacy HTML pages.

Quick start:

1. cd frontend
2. npm install
3. npm run dev

Open http://localhost:5173 and make sure your backend at http://localhost:3001 is running.

Notes:
- TypeScript is enabled for all app code (`.ts`/`.tsx`).
- The app reads/writes `localStorage.oijaba_token` for auth session continuity with existing backend APIs.
- Guest users now land on rider OTP login/register; rider/admin/driver dashboards are role-gated by token payload.
- Root-level Bangladesh location data can be refreshed with `npm run generate:bd-location-data`.

Migration status:
- Core rider, driver, and admin React pages are in `frontend/src/`.
- Legacy static pages under `pages/` are being removed as React equivalents are wired.
