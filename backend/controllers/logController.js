import { getDB } from "../config/db.js";
import { emptyLog } from "../models/Log.js";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export async function getLog(req, res) {
  try {
    const date = req.query.date || todayStr();
    const db = getDB();
    const log = await db.collection("logs").findOne({ userId: req.userId, date });
    res.json(log || emptyLog(req.userId, date));
  } catch (err) {
    console.error("Get log error:", err);
    res.status(500).json({ error: "Failed to fetch log" });
  }
}

export async function saveLog(req, res) {
  try {
    const date = req.body.date || todayStr();
    const { items, wholeEggs, eggWhites, water, steps } = req.body;
    const db = getDB();

    await db.collection("logs").updateOne(
      { userId: req.userId, date },
      {
        $set: {
          userId: req.userId,
          date,
          ...(items      !== undefined && { items }),
          ...(wholeEggs  !== undefined && { wholeEggs }),
          ...(eggWhites  !== undefined && { eggWhites }),
          ...(water      !== undefined && { water }),
          ...(steps      !== undefined && { steps }),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Save log error:", err);
    res.status(500).json({ error: "Failed to save log" });
  }
}
