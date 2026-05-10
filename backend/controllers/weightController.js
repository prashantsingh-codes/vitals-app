import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { formatWeightEntry } from "../models/Weight.js";

export async function getWeight(req, res) {
  try {
    const db = getDB();
    const entries = await db
      .collection("weight")
      .find({ userId: req.userId })
      .toArray();

    // Normalize dates and pick latest entry per date
    const normalized = entries.map((e) => {
      let isoDate = e.date;
      if (e.date && !e.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const parsed = new Date(`${e.date} 2026`);
        isoDate = !isNaN(parsed)
          ? parsed.toISOString().split("T")[0]
          : new Date(e.loggedAt).toISOString().split("T")[0];
      }
      return formatWeightEntry({ ...e, date: isoDate });
    });

    const byDate = {};
    normalized.forEach((e) => {
      if (!byDate[e.date] || new Date(e.loggedAt) > new Date(byDate[e.date].loggedAt)) {
        byDate[e.date] = e;
      }
    });

    const sorted = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
    res.json(sorted);
  } catch (err) {
    console.error("Get weight error:", err);
    res.status(500).json({ error: "Failed to fetch weight" });
  }
}

export async function logWeight(req, res) {
  try {
    const { value, date } = req.body;
    if (!value || isNaN(value))
      return res.status(400).json({ error: "Invalid weight value" });

    const isoDate = date || new Date().toISOString().split("T")[0];
    const db = getDB();
    const existing = await db
      .collection("weight")
      .findOne({ userId: req.userId, date: isoDate });

    if (existing) {
      await db.collection("weight").updateOne(
        { _id: existing._id },
        { $set: { value: parseFloat(value), loggedAt: new Date() } }
      );
      return res.status(200).json(
        formatWeightEntry({ ...existing, value: parseFloat(value), date: isoDate })
      );
    }

    const entry = {
      userId:   req.userId,
      value:    parseFloat(value),
      date:     isoDate,
      loggedAt: new Date(),
    };
    const result = await db.collection("weight").insertOne(entry);
    res.status(201).json(formatWeightEntry({ ...entry, _id: result.insertedId }));
  } catch (err) {
    console.error("Log weight error:", err);
    res.status(500).json({ error: "Failed to log weight" });
  }
}

export async function updateWeight(req, res) {
  try {
    const { value } = req.body;
    if (!value || isNaN(value))
      return res.status(400).json({ error: "Invalid weight value" });

    const db = getDB();
    const result = await db.collection("weight").findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: req.userId },
      { $set: { value: parseFloat(value) } },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ error: "Entry not found" });
    res.json(formatWeightEntry(result));
  } catch (err) {
    console.error("Update weight error:", err);
    res.status(500).json({ error: "Failed to update weight entry" });
  }
}

export async function deleteWeight(req, res) {
  try {
    const db = getDB();
    await db
      .collection("weight")
      .deleteOne({ _id: new ObjectId(req.params.id), userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete weight error:", err);
    res.status(500).json({ error: "Failed to delete weight entry" });
  }
}
