import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, getDB } from "./config/db.js";

// Routes
import authRoutes       from "./routes/authRoutes.js";
import logRoutes        from "./routes/logRoutes.js";
import profileRoutes    from "./routes/profileRoutes.js";
import weightRoutes     from "./routes/weightRoutes.js";
import customFoodRoutes from "./routes/customFoodRoutes.js";
import chatRoutes       from "./routes/chatRoutes.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
  ],
}));
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "Vitals API running ✅",
    db:     getDB() ? "MongoDB connected ✅" : "MongoDB not connected ❌",
    ai:     process.env.GEMINI_API_KEY ? "AI enabled ✅" : "AI disabled ❌",
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",         authRoutes);
app.use("/api/log",          logRoutes);
app.use("/api/profile",      profileRoutes);
app.use("/api/weight",       weightRoutes);
app.use("/api/custom-foods", customFoodRoutes);
app.use("/api/chat",         chatRoutes);

// ─── Start server ─────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Vitals API running on http://localhost:${PORT}`);
  });
});

export default app;
