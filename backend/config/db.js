import { MongoClient } from "mongodb";

let db = null;

export function getDB() {
  return db;
}

async function migrateWeightDates() {
  try {
    const entries = await db
      .collection("weight")
      .find({ date: { $not: /^\d{4}-\d{2}-\d{2}$/ } })
      .toArray();

    if (entries.length === 0) {
      console.log("✅ Weight migration: nothing to fix");
      return;
    }

    let fixed = 0;
    for (const e of entries) {
      const parsed = new Date(`${e.date} 2026`);
      if (!isNaN(parsed)) {
        await db.collection("weight").updateOne(
          { _id: e._id },
          { $set: { date: parsed.toISOString().split("T")[0] } }
        );
        fixed++;
      }
    }
    console.log(`✅ Weight migration: fixed ${fixed} entries`);
  } catch (err) {
    console.error("❌ Weight migration failed:", err.message);
  }
}

export async function connectDB() {
  if (!process.env.MONGODB_URI) {
    console.warn("⚠️  MONGODB_URI not set — database features disabled");
    return;
  }
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db("vitals");
    console.log("✅ Connected to MongoDB Atlas");

    // Create indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("logs").createIndex({ userId: 1, date: 1 }, { unique: true });
    await db.collection("weight").createIndex({ userId: 1, loggedAt: -1 });
    await db.collection("customFoods").createIndex({ userId: 1 });

    await migrateWeightDates();
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
}
