import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { userPublic } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "vitals_dev_secret_change_in_production";

// ─── Nodemailer transporter ───────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ─── Signup ───────────────────────────────────────────────────────────────────
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

// ─── Login ────────────────────────────────────────────────────────────────────
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

// ─── Me ───────────────────────────────────────────────────────────────────────
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

// ─── Forgot Password ──────────────────────────────────────────────────────────
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const db = getDB();
    const user = await db.collection("users").findOne({ email });

    // Always return success even if email not found — prevents user enumeration
    if (!user) return res.json({ success: true });

    // Generate a secure random token valid for 1 hour
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { resetToken, resetTokenExpiry } }
    );

    const resetUrl = `https://${req.headers.host}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"Vitals App" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Reset your Vitals password",
      html: `
        <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#F7F5F0;border-radius:16px;">
          <h1 style="font-family:serif;color:#1A1814;margin-bottom:8px;">Vitals</h1>
          <p style="color:#5C5849;margin-bottom:24px;">You requested a password reset. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}"
            style="display:inline-block;background:#D4582A;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:15px;">
            Reset Password
          </a>
          <p style="color:#9A9386;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to send reset email" });
  }
}

// ─── Reset Password ───────────────────────────────────────────────────────────
export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ error: "Token and password are required" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const db = getDB();
    const user = await db.collection("users").findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }, // token must not be expired
    });

    if (!user)
      return res.status(400).json({ error: "Reset link is invalid or has expired" });

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetToken: "", resetTokenExpiry: "" }, // clean up token
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
}