import { MongoClient } from "mongodb";

// ── Serverless-safe connection cache ──────────────────────────────────────────
// On Vercel each cold invocation gets a fresh module scope, but the Node.js
// global object persists across warm re-uses of the same container.
// Storing the client on `global` means we reuse the connection instead of
// opening a new one on every request, which exhausts Atlas M0's connection limit
// and causes slow/failed polls that break cross-device sync.
const g = global;

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
  // Already connected in this container — reuse it
  if (g._mongoClient && db) return;

  if (!process.env.MONGODB_URI) {
    console.warn("⚠️  MONGODB_URI not set — database features disabled");
    return;
  }
  try {
    // Reuse an existing client cached on global (warm serverless container)
    if (!g._mongoClient) {
      g._mongoClient = new MongoClient(process.env.MONGODB_URI, {
        maxPoolSize: 10,          // keep a small pool per container
        serverSelectionTimeoutMS: 5000,  // fail fast instead of hanging
        socketTimeoutMS: 10000,
      });
      await g._mongoClient.connect();
      console.log("✅ Connected to MongoDB Atlas");
    }

    db = g._mongoClient.db("vitals");

    // Create indexes (idempotent — safe to run every cold start)
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("logs").createIndex({ userId: 1, date: 1 }, { unique: true });
    await db.collection("weight").createIndex({ userId: 1, loggedAt: -1 });
    await db.collection("customFoods").createIndex({ userId: 1 });

    await migrateWeightDates();
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    g._mongoClient = null; // reset so next request retries
  }
}