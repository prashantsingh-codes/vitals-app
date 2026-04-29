# 🌿 Vitals — Daily Health Tracker

A full-stack React + Express fitness tracker with macro tracking, weight logging, hydration, and more.

---

## 📁 Project Structure

```
vitals-app/
├── src/
│   ├── main.jsx          # React entry point
│   └── App.jsx           # Main app (all components)
├── server/
│   ├── index.js          # Express API server
│   ├── package.json      # Server dependencies
│   └── .env              # ← Add your API keys here
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 Setup — Step by Step

### Prerequisites
- **Node.js v18+** — download from [nodejs.org](https://nodejs.org)
- **MongoDB Atlas** — free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)

---

### Step 1 — Install frontend dependencies

In the **root** `vitals-app/` folder:

```bash
npm install
```

---

### Step 2 — Install backend dependencies

```bash
cd server
npm install
cd ..
```

---

### Step 3 — Configure environment variables

Create `server/.env` with the following:

```env
# MongoDB connection string (required)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/vitals

# JWT secret (change this to a random string in production)
JWT_SECRET=your_secret_here

# Server port (optional, defaults to 3001)
PORT=3001
```

---

### Step 4 — Run the app

**Run both frontend + backend together (recommended):**

```bash
npm run start
```

This starts:
- React dev server → http://localhost:5173
- Express API server → http://localhost:3001

**Or run them separately in two terminals:**

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
npm run server
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Auth | Sign up & log in — credentials stored in MongoDB |
| 🎯 Onboarding | Goal setup with Mifflin-St Jeor BMR/TDEE calculator |
| 🥗 Food Tracker | Preset Indian foods + custom food logging |
| 🥚 Eggs | Whole eggs + egg whites with separate macro tracking |
| 📊 Macros | Calories, protein, fat — progress bars + remaining |
| 📈 Projections | Weight change forecast based on your calorie target |
| ⚖️ Weight | Log weight, chart history, trend prediction |
| 💧 Hydration | Glass-by-glass water tracker (goal: 8 glasses) |
| 🚶 Steps | Daily step counter with calorie burn estimate |
| 📊 BMI | Auto-calculated from latest weight entry |
| 🌙 Dark mode | Full dark/light theme toggle |
| 📱 Responsive | Mobile bottom nav + desktop sidebar layout |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| Auth | JWT + bcrypt |
| Charts | Chart.js (CDN) |
| Fonts | DM Sans + DM Serif Display (Google Fonts) |

---

## 🔒 Security Notes

- Passwords are hashed with **bcrypt** before storage
- All API routes are protected with **JWT authentication**
- MongoDB connection is scoped to the `vitals` database only
- Environment variables are never exposed to the browser

---

## ☁️ Deploying to Vercel

### Step 1 — Add `vercel.json` in root:
```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } },
    { "src": "server/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server/index.js" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Step 2 — Add environment variables on Vercel:
Go to **Vercel → your project → Settings → Environment Variables:**
```
MONGODB_URI  = mongodb+srv://...
JWT_SECRET   = your_secret
```

### Step 3 — Allow all IPs on MongoDB Atlas:
Go to **MongoDB Atlas → Network Access → Add IP → Allow from Anywhere** (`0.0.0.0/0`)

### Step 4 — Push to GitHub:
```bash
git add .
git commit -m "deploy: vercel config"
git push
```

---

## 🐛 Common Issues

| Issue | Fix |
|---|---|
| `Database not connected` | Check `MONGODB_URI` in Vercel env variables and redeploy |
| `401 Unauthorized` | Log out and log back in to refresh your JWT token |
| White screen on Vercel | Make sure `vercel.json` has `{ "handle": "filesystem" }` route |
| MongoDB connection refused | Add `0.0.0.0/0` to Atlas Network Access |
| Port already in use | Change `PORT` in `server/.env` or kill the process on 3001 |

---

## 📄 License

MIT — free to use and modify.
