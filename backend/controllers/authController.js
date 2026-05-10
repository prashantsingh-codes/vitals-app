import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { userPublic } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "vitals_dev_secret_change_in_production";

export async function signup(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const db = getDB();
    const existing = await db.collection("users").findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Account already exists with this email" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    const token = jwt.sign({ userId: result.insertedId.toString() }, JWT_SECRET, {
      expiresIn: "30d",
    });
    res.status(201).json({
      token,
      user: { id: result.insertedId, name, email },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const db = getDB();
    const user = await db.collection("users").findOne({ email });
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
      expiresIn: "30d",
    });
    res.json({ token, user: userPublic(user) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
}

export async function me(req, res) {
  try {
    const db = getDB();
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(req.userId) }, { projection: { password: 0 } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: userPublic(user) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
}
