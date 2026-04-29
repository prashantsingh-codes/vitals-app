import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "vitals_dev_secret";

let db;
async function connectDB() {
  if (!process.env.MONGODB_URI) return;
  if (db) return; // reuse existing connection
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db("vitals");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
  }
}

app.use(cors({ origin: "*" }));
app.use(express.json());

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireDB(req, res, next) {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  next();
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post("/api/auth/signup", requireDB, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    const existing = await db.collection("users").findOne({ email });
    if (existing) return res.status(409).json({ error: "Account already exists with this email" });
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await db.collection("users").insertOne({ name, email, password: hashedPassword, createdAt: new Date() });
    const token = jwt.sign({ userId: result.insertedId.toString() }, JWT_SECRET, { expiresIn: "30d" });
    res.status(201).json({ token, user: { id: result.insertedId, name, email } });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/api/auth/login", requireDB, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", auth, requireDB, async (req, res) => {
  try {
    const user = await db.collection("users").findOne({ _id: new ObjectId(req.userId) }, { projection: { password: 0 } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ─── DAILY LOG ────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split("T")[0]; }

app.get("/api/log", auth, requireDB, async (req, res) => {
  try {
    const date = req.query.date || todayStr();
    const log = await db.collection("logs").findOne({ userId: req.userId, date });
    res.json(log || { userId: req.userId, date, items: {}, wholeEggs: 0, eggWhites: 0, water: 0, steps: "" });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch log" });
  }
});

app.put("/api/log", auth, requireDB, async (req, res) => {
  try {
    const date = req.body.date || todayStr();
    const { items, wholeEggs, eggWhites, water, steps } = req.body;
    await db.collection("logs").updateOne(
      { userId: req.userId, date },
      { $set: { userId: req.userId, date, ...(items !== undefined && { items }), ...(wholeEggs !== undefined && { wholeEggs }), ...(eggWhites !== undefined && { eggWhites }), ...(water !== undefined && { water }), ...(steps !== undefined && { steps }), updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save log" });
  }
});

// ─── WEIGHT ───────────────────────────────────────────────────────────────────
app.get("/api/weight", auth, requireDB, async (req, res) => {
  try {
    const entries = await db.collection("weight").find({ userId: req.userId }).sort({ loggedAt: 1 }).toArray();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch weight" });
  }
});

app.post("/api/weight", auth, requireDB, async (req, res) => {
  try {
    const { value } = req.body;
    if (!value || isNaN(value)) return res.status(400).json({ error: "Invalid weight value" });
    const entry = { userId: req.userId, value: parseFloat(value), date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }), loggedAt: new Date() };
    const result = await db.collection("weight").insertOne(entry);
    res.status(201).json({ ...entry, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to log weight" });
  }
});

app.delete("/api/weight/:id", auth, requireDB, async (req, res) => {
  try {
    await db.collection("weight").deleteOne({ _id: new ObjectId(req.params.id), userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete weight entry" });
  }
});

// ─── CUSTOM FOODS ─────────────────────────────────────────────────────────────
app.get("/api/custom-foods", auth, requireDB, async (req, res) => {
  try {
    const foods = await db.collection("customFoods").find({ userId: req.userId }).sort({ createdAt: -1 }).toArray();
    res.json(foods.map(f => ({ ...f, id: f._id })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch custom foods" });
  }
});

app.post("/api/custom-foods", auth, requireDB, async (req, res) => {
  try {
    const { name, cal, pro, fat } = req.body;
    if (!name || cal === undefined) return res.status(400).json({ error: "Name and calories required" });
    const food = { userId: req.userId, name, cal: Number(cal)||0, pro: Number(pro)||0, fat: Number(fat)||0, checked: true, createdAt: new Date() };
    const result = await db.collection("customFoods").insertOne(food);
    res.status(201).json({ ...food, id: result.insertedId, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to save custom food" });
  }
});

app.patch("/api/custom-foods/:id", auth, requireDB, async (req, res) => {
  try {
    await db.collection("customFoods").updateOne({ _id: new ObjectId(req.params.id), userId: req.userId }, { $set: { checked: req.body.checked } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update custom food" });
  }
});

app.delete("/api/custom-foods/:id", auth, requireDB, async (req, res) => {
  try {
    await db.collection("customFoods").deleteOne({ _id: new ObjectId(req.params.id), userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete custom food" });
  }
});

// ─── AI CHAT ──────────────────────────────────────────────────────────────────
app.post("/api/chat", auth, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not set" });

  const systemPrompt = "You are Vitals AI, a friendly health and nutrition coach embedded in a fitness tracker app. The user tracks daily calories, protein, and fat. They eat Indian foods like dal, paneer, soya, rice, milk, oats, whey, and eggs. Give concise, warm, practical advice. Use emojis occasionally. Keep replies under 120 words.";

  try {
    const { messages } = req.body;
    const allContents = messages.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content || m.text || "" }]
    }));
    const firstUserIdx = allContents.findIndex(m => m.role === "user");
    if (firstUserIdx === -1) return res.status(400).json({ error: "No user message found" });
    const contents = allContents.slice(firstUserIdx);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data });
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't respond right now.";
    res.json({ reply });
  } catch (err) {
    console.error("Gemini error:", err.message);
    res.status(500).json({ error: "Failed to reach Gemini API" });
  }
});

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}