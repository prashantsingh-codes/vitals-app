# 🌿 Vitals — Daily Health Tracker

A full-stack React + Express fitness tracker with AI coaching, macro tracking, weight logging, and more.

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
- **Gemini API key** — get from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

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
# Gemini API key (required for AI Coach)
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxx

# MongoDB connection string (required for auth + data persistence)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/vitals

# JWT secret (change this to a random string in production)
JWT_SECRET=your_secret_here

# Server port (optional, defaults to 3001)
PORT=3001
```

Get your Gemini API key from: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

> ⚠️ **Important:** When creating your API key, click **"Create API key in new project"** — this ensures Gemini API is enabled for that key. Keys not linked to a project will return quota errors even on a fresh key.

> **Note:** The app works without an API key — only the AI Coach tab requires it.

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
| 🤖 AI Coach | Chat with Gemini AI for nutrition & fitness advice |
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
| AI | Google Gemini API (`gemini-2.0-flash`) |
| Fonts | DM Sans + DM Serif Display (Google Fonts) |

---

## 🤖 AI Coach — How It Works

The AI Coach tab uses **Google Gemini** (`gemini-2.0-flash`) as the backend AI. It is configured as "Vitals AI" — a health and nutrition coach with context about Indian foods and macro tracking.

- Messages are sent to your Express server at `/api/chat`
- The server forwards them to the Gemini API (your key stays server-side, never exposed to the browser)
- Gemini responds with concise, practical nutrition advice

**Free tier limits:**
- 15 requests per minute
- 1,500 requests per day
- Resets every minute / midnight

Monitor your usage at: [https://ai.dev/rate-limit](https://ai.dev/rate-limit)

---

## 🔒 Security Notes

- API keys live in `server/.env` and are **never exposed to the browser**
- Passwords are hashed with **bcrypt** before storage
- All API routes are protected with **JWT authentication**
- MongoDB connection is scoped to the `vitals` database only

---

## 🐛 Common Issues

| Issue | Fix |
|---|---|
| `MONGODB_URI not set` | Add your Atlas connection string to `server/.env` |
| `AI Coach not responding` | Check `GEMINI_API_KEY` is set in `server/.env` and restart server |
| `429 Too Many Requests` | You've hit Gemini's free tier limit — wait 1 min and retry |
| `limit: 0` quota error | Enable billing on Google Cloud or create key in a new project |
| `model not found` error | Use `gemini-2.0-flash` — check available models at [ai.dev](https://ai.dev) |
| `401 Unauthorized` | Log out and log back in to refresh your JWT token |
| Port already in use | Change `PORT` in `server/.env` or kill the process on 3001 |

---

## 📄 License

MIT — free to use and modify.
