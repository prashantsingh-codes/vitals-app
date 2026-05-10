import { connectDB, getDB } from "../config/db.js";

export async function requireDB(req, res, next) {
  if (!getDB()) await connectDB();
  if (!getDB()) {
    return res.status(503).json({
      error: "Database not connected. Check MONGODB_URI in backend/.env",
    });
  }
  next();
}
