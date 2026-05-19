import { useState, useEffect } from "react";
import { api } from "../api/api.js";

// ─── Shared styles ────────────────────────────────────────────────────────────
const inp = {
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "12px 16px",
  fontSize: 15,
  color: "var(--text)",
  fontFamily: "'DM Sans',sans-serif",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const shell = {
  minHeight: "100vh",
  background: "var(--bg)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const card = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 20,
  padding: 28,
  boxShadow: "0 8px 32px rgba(26,24,20,.12)",
};

// ─── AuthPage ─────────────────────────────────────────────────────────────────
export default function AuthPage({ onAuth }) {
  // Check if we landed on /reset-password?token=...
  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get("token");
  if (resetToken) return <ResetPasswordPage token={resetToken} onAuth={onAuth} />;

  return <LoginSignupPage onAuth={onAuth} />;
}

// ─── LoginSignupPage ──────────────────────────────────────────────────────────
function LoginSignupPage({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(m) { setMode(m); setError(""); setInfo(""); }

  async function submit() {
    setError(""); setInfo("");

    // ── Forgot password ──
    if (mode === "forgot") {
      if (!email) { setError("Please enter your email"); return; }
      setLoading(true);
      try {
        await api.forgotPassword(email);
        setInfo("If that email exists, a reset link has been sent. Check your inbox.");
        setEmail("");
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally { setLoading(false); }
      return;
    }

    // ── Login / Signup ──
    if (!email || !password) { setError("Please fill all fields"); return; }
    if (mode === "signup" && !name) { setError("Please enter your name"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const data =
        mode === "signup"
          ? await api.signup(name, email, password)
          : await api.login(email, password);
      localStorage.setItem("vt_token", data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally { setLoading(false); }
  }

  return (
    <div style={shell}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 38, color: "var(--text)", marginBottom: 4 }}>Vitals</div>
          <div style={{ fontSize: 13, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em" }}>Your daily health companion</div>
        </div>

        <div style={card}>
          {/* Forgot password view */}
          {mode === "forgot" ? (
            <>
              <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, marginBottom: 16, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
                ← Back to login
              </button>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Forgot password?</div>
              <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 20 }}>Enter your email and we'll send you a reset link.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" style={inp} onKeyDown={(e) => e.key === "Enter" && submit()} />
                {error && <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>{error}</div>}
                {info  && <div style={{ fontSize: 13, color: "var(--green)", fontWeight: 500, background: "var(--greenBg)", padding: "10px 14px", borderRadius: 8 }}>{info}</div>}
                <button onClick={submit} disabled={loading}
                  style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Login / Signup tabs */}
              <div style={{ display: "flex", gap: 4, background: "var(--bg2)", borderRadius: 10, padding: 4, marginBottom: 24 }}>
                {["login", "signup"].map((m) => (
                  <button key={m} onClick={() => switchMode(m)}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer", background: mode === m ? "var(--surface)" : "transparent", color: mode === m ? "var(--text)" : "var(--text3)", fontWeight: 600, fontSize: 14, fontFamily: "inherit", transition: "all .2s" }}>
                    {m === "login" ? "Log In" : "Sign Up"}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {mode === "signup" && (
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inp} />
                )}
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" style={inp} />
                <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" style={inp} onKeyDown={(e) => e.key === "Enter" && submit()} />
                {error && <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>{error}</div>}
                <button onClick={submit} disabled={loading}
                  style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
                </button>
                {/* Forgot password link — only on login */}
                {mode === "login" && (
                  <button onClick={() => switchMode("forgot")}
                    style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, textAlign: "center", textDecoration: "underline", padding: 0 }}>
                    Forgot password?
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ResetPasswordPage ────────────────────────────────────────────────────────
// Shown when user clicks the email link: /reset-password?token=xxx
function ResetPasswordPage({ token, onAuth }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setError("");
    if (!password || !confirm) { setError("Please fill both fields"); return; }
    if (password.length < 6)   { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm)  { setError("Passwords don't match"); return; }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      // Clean the token from the URL without a page reload
      window.history.replaceState({}, "", "/");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally { setLoading(false); }
  }

  return (
    <div style={shell}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 38, color: "var(--text)", marginBottom: 4 }}>Vitals</div>
        </div>
        <div style={card}>
          {done ? (
            // Success state
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Password reset!</div>
              <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 20 }}>Your password has been updated. You can now log in.</div>
              <button onClick={() => window.location.reload()}
                style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
                Go to Login
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Set new password</div>
              <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 20 }}>Choose a strong password for your account.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" type="password" style={inp} />
                <input value={confirm}  onChange={(e) => setConfirm(e.target.value)}  placeholder="Confirm password" type="password" style={inp} onKeyDown={(e) => e.key === "Enter" && submit()} />
                {error && <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>{error}</div>}
                <button onClick={submit} disabled={loading}
                  style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Saving…" : "Reset Password"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}