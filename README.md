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
│   ├── index.js          # Express API proxy server
│   ├── package.json      # Server dependencies
│   └── .env              # ← Add your API key here
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 Setup — Step by Step

### Prerequisites
- **Node.js v18+** — download from [nodejs.org](https://nodejs.org)

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

### Step 3 — Add your Anthropic API key

Open `server/.env` and replace the placeholder:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

Get your key at: https://console.anthropic.com/

> **Note:** The app works fine without a key — only the AI Coach tab requires it.

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
| 🔐 Auth | Login & Sign Up with local storage |
| 🥗 Food Tracker | Checkboxes for milk, oats, whey, rice, paneer, dal, soya |
| 🥚 Eggs | Whole eggs + egg whites with separate macro tracking |
| 📊 Macros | Calories, protein, fat — progress bars + remaining |
| 🌱 Alternatives | 6 veg/egg suggestions to hit your targets |
| ⚖️ Weight | Log weight, chart history, goal prediction |
| 💧 Hydration | Glass-by-glass water tracker |
| 🚶 Steps | Daily step counter with calorie estimate |
| 📊 BMI | Auto-calculated from latest weight |
| 🤖 AI Coach | Chat with Claude for nutrition & fitness advice |
| 🌙 Dark mode | Full dark/light theme |
| 📱 Responsive | Mobile bottom nav + desktop sidebar layout |

---

## 🛠 Tech Stack

- **Frontend:** React 18, Vite
- **Backend:** Node.js, Express
- **Charts:** Chart.js (CDN)
- **Fonts:** DM Sans + DM Serif Display (Google Fonts)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)

---

## 🔒 Notes

- All user data (food logs, weight, preferences) is stored in **browser localStorage**
- The Express server only proxies requests to Anthropic — it stores nothing
- Your API key stays in `server/.env` and is never exposed to the browser
