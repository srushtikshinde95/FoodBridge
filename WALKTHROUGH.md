# FoodBridge AI — Project Walkthrough & Verification

FoodBridge AI has been implemented as a fullstack, production-ready intelligent supply chain management system connecting Hotels/Restaurants with surplus food to NGOs in need of meals.

---

## 🎯 Architecture Summary

```
FoodBridge AI
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.js       # Node v24 SQLite database connection
│   │   │   ├── schema.sql          # 9 Relational tables (users, hotels, ngos, food_donations, matches, deliveries, configs, notifications)
│   │   │   └── seed.js             # Rich seed scenario (5 hotels, 8 NGOs, 15 donations, requirements, configs)
│   │   ├── engine/
│   │   │   ├── safetyEngine.js     # Rule-based food safety screening & safe-window calculator
│   │   │   ├── matchingEngine.js   # Multi-criteria scoring (Need, Urgency, Compatibility, Distance, Time Feasibility)
│   │   │   ├── routingEngine.js    # Distance, ETA, street waypoints, and food-life feasibility gating
│   │   │   └── allocator.js        # Single and partial multi-NGO allocation algorithms
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT authentication & role-based authorization (HOTEL, NGO, ADMIN)
│   │   ├── routes/                 # REST endpoints (auth, hotels, ngos, donations, matching, deliveries, admin, reports, notifications)
│   │   └── server.js               # Express application on port 5000
│   └── test_suite.js               # 20 Automated verification test cases
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/             # Navbar, DemoSimulationBar, StatusBadge
    │   │   ├── map/                # SupplyChainMap (Interactive Leaflet map with custom icons & polyline routes)
    │   │   └── ai/                 # ExplainableMatchCard & SafetyScreeningMeter
    │   ├── pages/
    │   │   ├── LandingPage.jsx     # Hero, Live dynamic impact metrics, 6-stage supply chain flow
    │   │   ├── LoginPage.jsx       # Tabbed login/register with 1-click persona switchers
    │   │   ├── hotel/              # HotelDashboard, DonateFoodPage (with live safety preview)
    │   │   ├── ngo/                # NgoDashboard (with Accept/Reject), RequestFoodPage
    │   │   └── admin/              # AdminDashboard, MatchingConsole, DeliveriesPage, ConfigPage, ReportsPage, MapOverviewPage
    │   ├── context/AuthContext.jsx
    │   ├── App.jsx
    │   └── main.jsx
```

---

## 🧪 Verification & Automated Test Results

The backend automated test suite (`backend/test_suite.js`) tested 20 core algorithmic and operational invariants:

```
🧪 Starting FoodBridge AI Automated Verification Test Suite...

--- 1. Testing Food Safety Screening Engine ---
  ✓ PASS: Eligible hot holding food passes screening
  ✓ PASS: Calculates correct safe remaining window
  ✓ PASS: Spoiled/Open packaging food fails screening (NOT ELIGIBLE)
  ✓ PASS: Detects unsealed packaging flag

--- 2. Testing Routing & Delivery Feasibility Engine ---
  ✓ PASS: Fetched Hotel Sunrise and Hope Foundation from DB
  ✓ PASS: Calculates realistic distance (3.64 km)
  ✓ PASS: Calculates realistic duration (16 mins)
  ✓ PASS: Generates street-level waypoints (6 points)
  ✓ PASS: Generates turn-by-turn directions (6 steps)
  ✓ PASS: Short delivery within generous safe window is feasible
  ✓ PASS: Long delivery exceeding food safe window is gated out (INFEASIBLE)
  ✓ PASS: Provides clear explainable gating explanation

--- 3. Testing AI Matching Engine & Explainability ---
  ✓ PASS: Evaluates all candidate NGOs (8 evaluated)
  ✓ PASS: Identifies top feasible recommendation
  ✓ PASS: Top match receives high score (88.1/100)
  ✓ PASS: Generates explainable pros/strengths
  ✓ PASS: Calculates individual factor scores (Need, Urgency, Distance)

--- 4. Testing Multi-NGO Partial Allocation ---
  ✓ PASS: Executes auto-allocation successfully
  ✓ PASS: Creates allocation records (2 allocated)
  ✓ PASS: Allocated 120 of 120 servings

========================================
Test Results: 20 Passed, 0 Failed.
========================================
```

---

## 🖥️ Live Servers & Ports

- **Frontend Application**: `http://localhost:3000`
- **Backend API & Health Check**: `http://localhost:5000/api/health`

---

## 🎬 How to Demonstrate Key Scenarios (Academic EDI Presentation)

1. **Top Simulation Bar**:
   - Use the floating top bar on any page to switch between **Admin**, **Hotel Sunrise**, **Hotel Royal**, **Hope Foundation**, and **Helping Hands**.
2. **Scenario 1 — Standard Eligible Match**:
   - Select **Scenario 1** in the top bar to inspect 100 Basmati Rice servings from Hotel Sunrise matched to Hope Foundation (120 kids) with full score breakdown and route.
3. **Scenario 2 — Critical Urgency Night Shelter Priority**:
   - Select **Scenario 2** to observe how Critical Urgency (100 pts) boosts Homeless Shelter ranking above medium urgency organizations.
4. **Scenario 3 — Short Safe-Life Exclusion**:
   - Select **Scenario 3** to verify that distant NGOs (12+ km) are automatically marked **`INFEASIBLE`** and excluded with a clear explanation when delivery ETA exceeds the remaining safe window.
5. **Scenario 4 — Multi-NGO Partial Split**:
   - Select **Scenario 4** to see a 200-servings batch divided across 2 shelters (120 servings + 80 servings).
6. **Scenario 5 — Food Safety Screening**:
   - Go to `/donate` and test typing a room-temperature cooked rice dish prepared 7 hours ago to see the real-time screening preview turn red with `NOT ELIGIBLE: Exceeded safe ambient storage threshold`.
7. **Interactive Map & Analytics**:
   - Go to `/map` to view the city-wide geospatial layout of donor hotels, beneficiary shelters, and live delivery routes.
   - Go to `/reports` for Recharts analytics on food rescued by category, safety pass rates, and top donors/recipients.
