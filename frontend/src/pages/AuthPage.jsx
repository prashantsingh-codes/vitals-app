import { useState } from "react";
import { api } from "../api/api.js";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || !password) { setError("Please fill all fields"); return; }
    if (mode === "signup" && !name) { setError("Please enter your name"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError("");
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
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 38, color: "var(--text)", marginBottom: 4 }}>Vitals</div>
          <div style={{ fontSize: 13, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em" }}>Your daily health companion</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, boxShadow: "0 8px 32px rgba(26,24,20,.12)" }}>
          <div style={{ display: "flex", gap: 4, background: "var(--bg2)", borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {["login", "signup"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
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
          </div>
        </div>
      </div>
    </div>
  );
}
