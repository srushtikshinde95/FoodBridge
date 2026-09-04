# FoodBridge AI — Production Deployment Guide (Vercel + Render)

This guide walks you through deploying **FoodBridge AI** publicly with HTTPS:
- **Frontend**: [Vercel](https://vercel.com)
- **Backend**: [Render](https://render.com)
- **Database**: Native SQLite (`node:sqlite`) with automatic schema setup & seed scenarios.

---

## 🏗️ Architecture Overview

```
User Browser (HTTPS)
       │
       ▼
┌──────────────────────────────┐
│  Vercel Edge Network         │  ➔ Hosted at: https://foodbridge-ai.vercel.app
│  (React 19 + Vite SPA)       │  ➔ Configured via: frontend/vercel.json
└──────────────┬───────────────┘
               │  REST API Calls via VITE_API_URL
               ▼
┌──────────────────────────────┐
│  Render Web Service (Node)   │  ➔ Hosted at: https://foodbridge-backend.onrender.com
│  (Express.js + AI Engines)   │  ➔ CORS allowed for FRONTEND_URL
│  (Native SQLite Database)    │  ➔ Database: backend/data/foodbridge.db
└──────────────────────────────┘
```

---

## 🚀 Step 1: Deploy Backend to Render

1. Push your repository to **GitHub** or **GitLab**.
2. Log in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** ➔ **Web Service**.
4. Connect your repository.
5. Configure the service settings:
   - **Name**: `foodbridge-backend` (or your preferred name)
   - **Language / Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free` or `Starter`
6. Add **Environment Variables** in the Render settings:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `JWT_SECRET` | `generate-a-secure-random-string-here` | Secret key for JWT signing |
   | `FRONTEND_URL` | `https://<your-vercel-domain>.vercel.app` | Allowed CORS origin (can update after Vercel deployment) |
   | `NODE_VERSION` | `24` or `22.5.0` | Ensures native `node:sqlite` runtime |
7. Click **Create Web Service**.
8. Once deployed, note down your Render backend URL (e.g. `https://foodbridge-backend.onrender.com`).
9. Verify the backend health by visiting: `https://foodbridge-backend.onrender.com/api/health`.

---

## 🌐 Step 2: Deploy Frontend to Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** ➔ **Project**.
3. Import your GitHub repository.
4. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`frontend`**
   - **Build Command**: `npm run build` (Default)
   - **Output Directory**: `dist` (Default)
   - **Install Command**: `npm install` (Default)
5. Add **Environment Variables**:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://<your-render-app-name>.onrender.com/api` | Full URL to your Render API prefix |
6. Click **Deploy**.
7. Vercel will build and assign your production HTTPS URL (e.g. `https://foodbridge-ai.vercel.app`).

---

## 🔄 Step 3: Link CORS on Backend

After Vercel gives you your frontend URL:
1. Return to your **Render Dashboard** ➔ `foodbridge-backend` ➔ **Environment**.
2. Update the `FRONTEND_URL` variable with your exact Vercel URL (e.g., `https://foodbridge-ai.vercel.app`).
3. Click **Save Changes** (Render will redeploy automatically with CORS restricted to your Vercel frontend).

---

## ⚙️ How Production Compatibility Works

1. **Centralized API Client**:
   [`frontend/src/api/client.js`](frontend/src/api/client.js) automatically points all HTTP requests to `import.meta.env.VITE_API_URL` when provided, falling back to `/api` for local development.
2. **SPA Deep-Linking & Page Refreshes**:
   [`frontend/vercel.json`](frontend/vercel.json) routes all incoming URL paths (`/matching`, `/donate`, `/hotel/dashboard`, `/ngo/dashboard`, `/admin/dashboard`) to `/index.html` so client-side React Router functions seamlessly.
3. **Database Auto-Seeding**:
   When the backend boots on Render for the first time, [`backend/src/server.js`](backend/src/server.js) detects an empty database and automatically initializes all tables, 5 hotels, 8 NGOs, 15 donations, active requirements, and priority weights.
4. **Cloud Port Binding**:
   The Express server listens on `process.env.PORT || 5000` bound to `0.0.0.0` for cloud container routing.

---

## 🧪 Verification & Testing Commands

To run tests locally prior to deployment:
```bash
# Test backend algorithms & safety screening
cd backend
npm start &
node test_suite.js

# Test frontend production build
cd ../frontend
npm run build
```
