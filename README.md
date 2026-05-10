# 🥗 Vitals — Daily Health & Nutrition Tracker

A full-stack MERN app to track daily calories, macros, water intake, steps, and weight.

---

## 📁 Folder Structure

```
vitals/
├── frontend/                   # React + Vite
│   ├── index.html
│   ├── vite.config.js          # Dev proxy → backend :3001
│   ├── package.json
│   └── src/
│       ├── main.jsx            # React entry point
│       ├── App.jsx             # Root component + MainApp
│       ├── index.css           # Global styles
│       ├── api/
│       │   └── api.js          # All API helper functions
│       ├── pages/
│       │   ├── AuthPage.jsx    # Login / Sign Up
│       │   └── OnboardingPage.jsx  # Goal setup wizard
│       └── components/
│           ├── UI.jsx          # ProgBar, MacroPill, Stepper, Card
│           ├── FoodChip.jsx    # Preset food tile with MiniStepper
│           ├── CustomFood.jsx  # AddFoodModal + CustomFoodChip
│           ├── Charts.jsx      # WeightChart + MiniLineChart (Chart.js)
│           └── DatePickerBar.jsx
│
└── backend/                    # Express + MongoDB
    ├── index.js                # App entry — mounts all routes
    ├── package.json
    ├── .env.example            # Copy → .env and fill in values
    ├── config/
    │   └── db.js               # MongoDB connect + index creation
    ├── middleware/
    │   ├── auth.js             # JWT verification
    │   └── requireDB.js        # Guard — 503 if DB not ready
    ├── models/                 # Document shape docs + helpers
    │   ├── User.js
    │   ├── Log.js
    │   ├── Weight.js
    │   ├── CustomFood.js
    │   └── Profile.js
    ├── controllers/            # Business logic
    │   ├── authController.js
    │   ├── logController.js
    │   ├── profileController.js
    │   ├── weightController.js
    │   └── customFoodController.js
    └── routes/                 # Express routers
        ├── authRoutes.js
        ├── logRoutes.js
        ├── profileRoutes.js
        ├── weightRoutes.js
        └── customFoodRoutes.js
```

---

## 🚀 Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env        # then edit .env with your MongoDB URI
npm install
npm run dev                 # runs on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # runs on http://localhost:5173
```

Vite proxies all `/api/*` requests to `http://localhost:3001` automatically.

---

## 🌍 API Endpoints

| Method | Path                    | Auth | Description              |
|--------|-------------------------|------|--------------------------|
| POST   | /api/auth/signup        | —    | Create account           |
| POST   | /api/auth/login         | —    | Login, returns JWT       |
| GET    | /api/auth/me            | ✅   | Get current user         |
| GET    | /api/log?date=YYYY-MM-DD| ✅   | Get daily log            |
| PUT    | /api/log                | ✅   | Save daily log           |
| GET    | /api/profile            | ✅   | Get goals & targets      |
| PUT    | /api/profile            | ✅   | Save goals & targets     |
| GET    | /api/weight             | ✅   | Get all weight entries   |
| POST   | /api/weight             | ✅   | Log weight               |
| PUT    | /api/weight/:id         | ✅   | Edit weight entry        |
| DELETE | /api/weight/:id         | ✅   | Delete weight entry      |
| GET    | /api/custom-foods       | ✅   | Get custom foods         |
| POST   | /api/custom-foods       | ✅   | Add custom food          |
| PATCH  | /api/custom-foods/:id   | ✅   | Toggle checked state     |
| DELETE | /api/custom-foods/:id   | ✅   | Delete custom food       |
| POST   | /api/chat               | ✅   | AI chat via Gemini       |

---

## 🔑 Environment Variables (backend/.env)

| Variable       | Required | Description                        |
|----------------|----------|------------------------------------|
| MONGODB_URI    | ✅       | MongoDB Atlas connection string    |
| JWT_SECRET     | ✅       | Secret key for signing JWTs        |
| PORT           | —        | Server port (default: 3001)        |
| GEMINI_API_KEY | —        | Google Gemini key for AI chat      |

---

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, inline CSS (CSS variables for theming)
- **Backend**: Node.js, Express 4, MongoDB 6 (Atlas)
- **Auth**: JWT (30-day tokens) + bcryptjs
- **Charts**: Chart.js 4 (loaded via CDN)
- **Fonts**: DM Sans + DM Serif Display (Google Fonts)
