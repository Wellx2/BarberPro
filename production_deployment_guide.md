# 🚀 BarberPro Production Deployment Guide

This document provides a comprehensive checklist and instructions for deploying the BarberPro platform to a production environment.

## 🏗️ Architecture Overview

BarberPro is a multi-tenant SaaS platform built with:
- **Frontend:** React + Tailwind CSS (Vite)
- **Backend:** NestJS (Node.js)
- **Database:** PostgreSQL (managed via Prisma)
- **Auth:** JWT (JSON Web Tokens) + OAuth (Google)

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Ensure the following variables are set in your production environment (e.g., Vercel, Railway, AWS):

#### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
JWT_SECRET="your-very-strong-secret"
JWT_REFRESH_SECRET="your-very-strong-refresh-secret"
FRONTEND_URL="https://your-app-domain.com"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### Frontend (.env)
```env
VITE_API_URL="https://your-api-domain.com"
VITE_GOOGLE_CLIENT_ID="your-google-client-id"
```

### 2. Database Migration
Run the following command to apply migrations to the production database:
```bash
npx prisma migrate deploy
```

### 3. Security Hardening
- [ ] CORS: Ensure `FRONTEND_URL` is the only allowed origin in `main.ts`.
- [ ] Rate Limiting: Implement `ThrottlerModule` in NestJS for API protection.
- [ ] HTTPS: Ensure both frontend and backend are served over TLS.
- [ ] Production Database: Use a managed service (e.g., Supabase, Neon, AWS RDS) with automated backups.

---

## 🚀 Deployment Steps

### Step 1: Backend Deployment (Node.js)
1.  **Build:** Run `npm run build` to generate the `dist/` folder.
2.  **Start:** Run `npm run start:prod`.
3.  **Process Management:** Use `pm2` to keep the app running:
    ```bash
    pm2 start dist/main.js --name barberpro-backend
    ```

### Step 2: Frontend Deployment (Vite/Static)
1.  **Build:** Run `npm run build`.
2.  **Statics:** Upload the `dist/` folder to a CDN or static hosting (Vercel, Netlify, S3).
3.  **SPA Handling:** Ensure your server redirects all routes to `index.html`.

### Step 3: Google OAuth Configuration
1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Update "Authorized redirect URIs" to include:
    `https://your-api-domain.com/auth/google/callback`
3.  Update "Authorized JavaScript origins" to include:
    `https://your-app-domain.com`

---

## 🛡️ Ongoing Maintenance
- **Backups:** Schedule daily PostgreSQL backups.
- **Logs:** Use a logging service (e.g., Papertrail, Sentry) for error tracking.
- **Monitoring:** Set up health checks for the `/api/health` endpoint.

---

> [!IMPORTANT]
> Always test the full flow (Register -> Login -> Create Shop -> Create Appointment) in a staging environment before pushing to production.
