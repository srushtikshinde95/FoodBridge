# FoodBridge AI — Smart Food Redistribution & Supply Chain Management System

**FoodBridge AI** is an end-to-end intelligent supply chain management web application connecting **Hotels/Restaurants with surplus food** to **NGOs in need of meals**, governed by an **AI-powered matching, safety-screening, and logistics routing engine**.

---

## 🌟 Core Architecture & Supply Chain

```
HOTEL (Surplus Registration)
       ↓
FOOD SAFETY SCREENING (Rule-Based Shelf-Life & Danger-Zone Verification)
       ↓
AI MATCHING ENGINE (Multi-Factor Need + Urgency + Compatibility Scoring)
       ↓
DELIVERY FEASIBILITY GATING (Food-Life Window vs Transit ETA Check)
       ↓
ROUTE OPTIMIZATION & PARTIAL ALLOCATION (Single or Multi-NGO Split)
       ↓
DISPATCH & LOGISTICS (Real-Time Driver Tracking & Waypoints)
       ↓
NGO (Beneficiaries Nourished & Zero Landfill Waste)
```

---

## 🚀 Key Features

### 1. Rule-Based Food Safety Verification Engine
- Real-time screening before allocation evaluates:
  - Elapsed time since cooking/preparation
  - Food category specific maximum ambient shelf lives
  - Danger zone temperature compliance (Refrigerated $\le 5^\circ\text{C}$, Hot holding $\ge 60^\circ\text{C}$)
  - Container packaging condition (Sealed, Foil wrap, Covered, Open/Loose)
- Outcomes: `🟢 ELIGIBLE`, `🟡 REVIEW REQUIRED`, `🔴 NOT ELIGIBLE` with clear explainable justifications.

### 2. Multi-Criteria Priority Scoring Engine
- Computes transparent composite match score ($0 - 100$) using configurable weights:
  - **Need & Beneficiary Demand Score (30%)**
  - **NGO Urgency Score (25%)** (`CRITICAL` = 100, `HIGH` = 80, `MEDIUM` = 50, `LOW` = 25)
  - **Time Feasibility & Safe-Life Margin (20%)**
  - **Food Category & Dietary Compatibility (15%)**
  - **Distance & Proximity Decay (10%)**

### 3. Food-Life-Aware Delivery Feasibility Gating
- Prevents spoiled meal deliveries: if $\text{Transit ETA} + \text{Safety Buffer} > \text{Remaining Food Window}$, candidate is strictly marked **`INFEASIBLE`** and excluded with a transparent explanation.

### 4. Multi-NGO Partial Split Allocation
- Intelligently divides large food batches (e.g. 200 servings) across multiple high-priority shelters (e.g. 120 servings to Shelter A + 80 servings to Shelter B).

### 5. Interactive Geospatial City Map & Route Optimization
- Interactive Leaflet map displaying donor hotels, NGO shelters, active delivery trucks, and turn-by-turn road navigation waypoints.

### 6. Dedicated Portals & 1-Click Demo Sandbox
- **Hotel Portal**: Surplus registration with live safety pre-check preview, active donation tracker, and dispatch history.
- **NGO Portal**: Requirement submission with urgency tags, incoming donation alerts with Accept/Reject controls.
- **Admin Command Center**: 5-stage live supply chain pipeline, AI matching inspector, priority weight tuning sliders, Recharts analytics, and simulation scenario switcher.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Leaflet, React-Leaflet, Lucide Icons, Recharts, Axios, React Router.
- **Backend**: Node.js (v24), Express, Better-SQLite3 / Native Node SQLite, JWT Authentication, Bcrypt.js, CORS.
- **Database**: Relational SQLite (`foodbridge.db`) with foreign keys, transactional integrity, and seed scenario suite.

---

## 💻 Running the Application

### 1. Backend Setup
```bash
cd backend
npm install
npm run seed     # Seeds 5 hotels, 8 NGOs, 15 donations, requirements, and configs
npm start        # Runs on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev      # Runs on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Pre-Seeded Demo Accounts (1-Click Switcher Available in Top Bar)

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@foodbridge.org` | `admin123` | Full system command console & weight tuner |
| **Hotel (Donor)** | `sunrise@hotel.com` | `hotel123` | Hotel Sunrise (100 Basmati Rice servings) |
| **Hotel (Donor)** | `royal@hotel.com` | `hotel123` | Hotel Royal Orchid (60 Paneer Masala servings) |
| **NGO (Beneficiary)** | `hope@ngo.org` | `ngo123` | Hope Foundation (120 Children Shelter) |
| **NGO (Beneficiary)** | `hands@ngo.org` | `ngo123` | Helping Hands (200 Homeless Migrant Shelter) |

---

## 🧪 Automated Test Suite
To run the automated verification test suite:
```bash
cd backend
node test_suite.js
```

---

## 🌐 Public Production Deployment (Vercel + Render)

For complete step-by-step instructions on deploying the frontend to **Vercel** and backend to **Render**, please see [DEPLOYMENT.md](DEPLOYMENT.md).

