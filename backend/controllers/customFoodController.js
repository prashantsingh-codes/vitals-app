import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { normalizeCustomFood } from "../models/CustomFood.js";

export async function getCustomFoods(req, res) {
  try {
    const db = getDB();
    const foods = await db
      .collection("customFoods")
      .find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(foods.map(normalizeCustomFood));
  } catch (err) {
    console.error("Get custom foods error:", err);
    res.status(500).json({ error: "Failed to fetch custom foods" });
  }
}

export async function addCustomFood(req, res) {
  try {
    const { name, cal, pro, fat } = req.body;
    if (!name || cal === undefined)
      return res.status(400).json({ error: "Name and calories required" });

    const db = getDB();
    const food = {
      userId:    req.userId,
      name,
      cal:       Number(cal)  || 0,
      pro:       Number(pro)  || 0,
      fat:       Number(fat)  || 0,
      checked:   true,
      createdAt: new Date(),
    };
    const result = await db.collection("customFoods").insertOne(food);
    res.status(201).json(normalizeCustomFood({ ...food, _id: result.insertedId }));
  } catch (err) {
    console.error("Add custom food error:", err);
    res.status(500).json({ error: "Failed to save custom food" });
  }
}

export async function toggleCustomFood(req, res) {
  try {
    const db = getDB();
    await db.collection("customFoods").updateOne(
      { _id: new ObjectId(req.params.id), userId: req.userId },
      { $set: { checked: req.body.checked } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Toggle custom food error:", err);
    res.status(500).json({ error: "Failed to update custom food" });
  }
}

export async function deleteCustomFood(req, res) {
  try {
    const db = getDB();
    await db
      .collection("customFoods")
      .deleteOne({ _id: new ObjectId(req.params.id), userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete custom food error:", err);
    res.status(500).json({ error: "Failed to delete custom food" });
  }
}
